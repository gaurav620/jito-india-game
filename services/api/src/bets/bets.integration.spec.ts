/**
 * Bet placement integration tests — run against REAL PostgreSQL.
 *
 * Step 7 gate (original prompt's TESTING REQUIREMENTS): concurrency and
 * idempotency correctness for bet placement cannot be proven with mocks —
 * every scenario below exercises the real guarded round lock, the real
 * `bets(user_id, idempotency_key)` and `points_transactions(idempotency_key)`
 * UNIQUE constraints, and PostgreSQL's own `now()` for the deadline check,
 * against a live database (same principle established in Phase 2C's
 * points.integration.spec.ts and Phase 2D's rounds.integration.spec.ts).
 *
 * Skipped when INTEGRATION_DB_URL is not set. Skipped tests are NOT reported
 * as PASS in the handoff (MEMORY.md Phase 2B precedent).
 *
 * Run with:
 *   INTEGRATION_DB_URL=postgresql://user:pass@localhost:5432/jito_test npm run test
 */
import { randomBytes } from 'crypto';

import { PrismaClient, RoundState } from '@prisma/client';
import { describe, expect, it, beforeAll, afterAll, afterEach } from 'vitest';

import { InsufficientPointsException, PointsLedgerService } from '../points/points-ledger.service';

import {
  BetIdempotencyKeyReusedException,
  BetIdempotencyKeyTooLongException,
  BetsService,
  DeadlinePassedException,
  RoundMismatchException,
  RoundNotAcceptingException,
} from './bets.service';

const INTEGRATION_DB_URL = process.env['INTEGRATION_DB_URL'];

const GAME_ID = 'triple-chance-timer';
const OTHER_GAME_ID = 'triple-chance-pro-timer';

function randomUsername(): string {
  return `bets_test_${randomBytes(6).toString('hex')}`;
}

function randomKey(prefix: string): string {
  return `${prefix}:${randomBytes(8).toString('hex')}`;
}

function randomDisplayCode(): string {
  return `ZZBET${randomBytes(6).toString('hex')}`;
}

/** Seed a user + points_accounts row, funded THROUGH the ledger (same rationale as points.integration.spec.ts's createUserWithBalance — a real account always starts at 0 and moves only via the ledger). */
async function createUserWithBalance(
  prisma: PrismaClient,
  ledger: PointsLedgerService,
  startingBalanceMinor: bigint,
): Promise<{ userId: string }> {
  const username = randomUsername();
  const user = await prisma.user.create({
    data: { username, email: `${username}@test.com`, passwordHash: 'x', status: 'active' },
  });
  await prisma.pointsAccount.create({ data: { userId: user.id, balanceMinor: 0n, version: 0n } });

  if (startingBalanceMinor > 0n) {
    await ledger.applyMutation({
      userId: user.id,
      direction: 'credit',
      amountMinor: startingBalanceMinor,
      referenceType: 'admin_credit',
      referenceId: null,
      idempotencyKey: randomKey('fixture-seed'),
      description: 'test fixture starting balance',
    });
  }

  return { userId: user.id };
}

/** Best-effort cleanup — `points_transactions`/`admin_logs` are append-only (same reasoning as points.integration.spec.ts); `bets` is not, so it and the user can be removed once no ledger rows exist. */
async function cleanupTestUser(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.bet.deleteMany({ where: { userId } }); // cascades to bet_items
  const account = await prisma.pointsAccount.findUnique({ where: { userId }, select: { id: true } });
  if (account) {
    const txnCount = await prisma.pointsTransaction.count({ where: { accountId: account.id } });
    if (txnCount > 0) return; // append-only — nothing further can be cleaned up
  }
  await prisma.pointsAccount.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

/** Insert a round directly (bypassing services/game-engine, a separate deployable unit) in a precise starting state. */
async function insertRound(
  prisma: PrismaClient,
  overrides: Partial<{ gameId: string; state: RoundState; bettingDeadline: Date }> = {},
) {
  const gameId = overrides.gameId ?? GAME_ID;
  const agg = await prisma.gameRound.aggregate({ where: { gameId }, _max: { roundNumber: true } });
  const roundNumber = (agg._max.roundNumber ?? 0n) + 1n;

  return prisma.gameRound.create({
    data: {
      gameId,
      roundNumber,
      displayCode: randomDisplayCode(),
      state: overrides.state ?? RoundState.BETTING_OPEN,
      opensAt: new Date(Date.now() - 60000),
      bettingDeadline: overrides.bettingDeadline ?? new Date(Date.now() + 60000),
    },
  });
}

async function cleanupRounds(prisma: PrismaClient): Promise<void> {
  // game_rounds is a normal mutable table — safe to hard-delete once no
  // bets reference it (cleanupTestUser already removed those first).
  await prisma.gameRound.deleteMany({ where: { gameId: { in: [GAME_ID, OTHER_GAME_ID] } } });
}

describe.skipIf(!INTEGRATION_DB_URL)('Bet Placement Integration Tests [requires PostgreSQL]', () => {
  let prisma: PrismaClient;
  let ledger: PointsLedgerService;
  let bets: BetsService;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    if (!INTEGRATION_DB_URL) return;
    prisma = new PrismaClient({ datasources: { db: { url: INTEGRATION_DB_URL } } });
    await prisma.$connect();
    // PrismaService/PointsLedgerService/BetsService are structurally
    // identical to their real DI-constructed counterparts at runtime — same
    // pattern as points.integration.spec.ts / rounds.integration.spec.ts.
    ledger = new PointsLedgerService(prisma as never);
    bets = new BetsService(prisma as never, ledger);
    // Defensive: a prior interrupted run (crashed process, killed test run)
    // can leave a live round for these game ids, which would collide with
    // `uq_rounds_one_live_per_game` on the very first insertRound() call.
    // Safe against INTEGRATION_DB_URL's target (a local/dev database with no
    // concurrently-running game-engine — same assumption rounds.integration.spec.ts
    // already makes for these same game ids).
    await cleanupRounds(prisma);
  });

  afterEach(async () => {
    for (const userId of createdUserIds.splice(0)) {
      await cleanupTestUser(prisma, userId);
    }
    await cleanupRounds(prisma);
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.$disconnect();
  });

  async function seedUser(startingBalanceMinor: bigint): Promise<string> {
    const { userId } = await createUserWithBalance(prisma, ledger, startingBalanceMinor);
    createdUserIds.push(userId);
    return userId;
  }

  // ─── 1. Successful bet: persistence + debit + response shape ─────────────────
  it('1. A valid bet is persisted, debits the ledger exactly once, and returns the accepted-bet shape', async () => {
    const userId = await seedUser(10000n);
    const round = await insertRound(prisma);

    const result = await bets.placeBet({
      userId,
      idempotencyKey: randomKey('bet'),
      dto: {
        roundId: round.id,
        gameId: GAME_ID,
        items: [
          { category: 'doubles', selection: 72, amountMinor: 400 },
          { category: 'singles', selection: 2, amountMinor: 100 },
        ],
      },
    });

    expect(result.replayed).toBe(false);
    expect(result.status).toBe('accepted');
    expect(result.totalAmountMinor).toBe(500);
    expect(result.balanceMinor).toBe(9500); // 10000 - 500

    const betRow = await prisma.bet.findUniqueOrThrow({ where: { id: result.betId }, include: { items: true } });
    expect(betRow.roundId).toBe(round.id);
    expect(betRow.totalAmountMinor).toBe(500n);
    expect(betRow.items).toHaveLength(2);

    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(9500n);

    const ledgerRows = await prisma.pointsTransaction.findMany({ where: { referenceType: 'bet_placed', referenceId: result.betId } });
    expect(ledgerRows).toHaveLength(1);
    expect(ledgerRows[0]?.amountMinor).toBe(500n);
    expect(ledgerRows[0]?.direction).toBe('debit');
  });

  // ─── 2. Insufficient balance — no orphan rows ─────────────────────────────────
  it('2. Insufficient balance rejects the bet and leaves no bet row, no bet_items, no ledger row, unchanged balance', async () => {
    const userId = await seedUser(100n);
    const round = await insertRound(prisma);
    const key = randomKey('bet');

    await expect(
      bets.placeBet({
        userId,
        idempotencyKey: key,
        dto: { roundId: round.id, gameId: GAME_ID, items: [{ category: 'triples', selection: 63, amountMinor: 999 }] },
      }),
    ).rejects.toThrow(InsufficientPointsException);

    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(100n); // unchanged

    const betRow = await prisma.bet.findFirst({ where: { userId, idempotencyKey: key } });
    expect(betRow).toBeNull(); // rolled back — the bet insert did not survive

    const ledgerRows = await prisma.pointsTransaction.findMany({ where: { referenceType: 'bet_placed' } });
    expect(ledgerRows.filter((r) => r.description?.includes(round.id))).toHaveLength(0);
  }, 15000);

  // ─── 3. Round not found ────────────────────────────────────────────────────────
  it('3. A non-existent roundId is rejected 404', async () => {
    const userId = await seedUser(1000n);
    await expect(
      bets.placeBet({
        userId,
        idempotencyKey: randomKey('bet'),
        dto: { roundId: '00000000-0000-0000-0000-000000000000', gameId: GAME_ID, items: [{ category: 'singles', selection: 2, amountMinor: 100 }] },
      }),
    ).rejects.toThrow();
  });

  // ─── 4. Round belongs to a different game ─────────────────────────────────────
  it('4. A round that belongs to a different game is rejected (ROUND_MISMATCH)', async () => {
    const userId = await seedUser(1000n);
    const round = await insertRound(prisma, { gameId: OTHER_GAME_ID });

    await expect(
      bets.placeBet({
        userId,
        idempotencyKey: randomKey('bet'),
        dto: { roundId: round.id, gameId: GAME_ID, items: [{ category: 'singles', selection: 2, amountMinor: 100 }] },
      }),
    ).rejects.toThrow(RoundMismatchException);
  });

  // ─── 5. BETTING_LOCKED rejects ─────────────────────────────────────────────────
  it('5. A round already in BETTING_LOCKED rejects new bets (ROUND_NOT_ACCEPTING)', async () => {
    const userId = await seedUser(1000n);
    const round = await insertRound(prisma, { state: RoundState.BETTING_LOCKED });

    await expect(
      bets.placeBet({
        userId,
        idempotencyKey: randomKey('bet'),
        dto: { roundId: round.id, gameId: GAME_ID, items: [{ category: 'singles', selection: 2, amountMinor: 100 }] },
      }),
    ).rejects.toThrow(RoundNotAcceptingException);
  });

  // ─── 6. Deadline passed on the DB clock, even though state still says accepting ──
  it("6. A round whose betting_deadline has already passed is rejected on the DATABASE clock (DEADLINE_PASSED), independent of state", async () => {
    const userId = await seedUser(1000n);
    const round = await insertRound(prisma, { bettingDeadline: new Date(Date.now() - 1000) });

    await expect(
      bets.placeBet({
        userId,
        idempotencyKey: randomKey('bet'),
        dto: { roundId: round.id, gameId: GAME_ID, items: [{ category: 'singles', selection: 2, amountMinor: 100 }] },
      }),
    ).rejects.toThrow(DeadlinePassedException);

    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(1000n);
  });

  // ─── 7. Sequential idempotent replay ──────────────────────────────────────────
  it('7. Replaying the same idempotency key returns the original result without a second bet or a second debit', async () => {
    const userId = await seedUser(1000n);
    const round = await insertRound(prisma);
    const key = randomKey('bet');
    const dto = { roundId: round.id, gameId: GAME_ID, items: [{ category: 'doubles' as const, selection: 72, amountMinor: 300 }] };

    const first = await bets.placeBet({ userId, idempotencyKey: key, dto });
    expect(first.replayed).toBe(false);

    const replays = await Promise.all(
      Array.from({ length: 3 }, () => bets.placeBet({ userId, idempotencyKey: key, dto })),
    );
    for (const replay of replays) {
      expect(replay.replayed).toBe(true);
      expect(replay.betId).toBe(first.betId);
      expect(replay.balanceMinor).toBe(first.balanceMinor);
    }

    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(700n); // moved exactly once (1000 - 300)

    const betRows = await prisma.bet.findMany({ where: { userId, idempotencyKey: key } });
    expect(betRows).toHaveLength(1);
  }, 15000);

  // ─── 8. Same key, different payload ───────────────────────────────────────────
  it('8. The same idempotency key with a different payload is rejected 409, and mutates nothing further', async () => {
    const userId = await seedUser(1000n);
    const round = await insertRound(prisma);
    const key = randomKey('bet');

    await bets.placeBet({
      userId,
      idempotencyKey: key,
      dto: { roundId: round.id, gameId: GAME_ID, items: [{ category: 'doubles', selection: 72, amountMinor: 300 }] },
    });

    await expect(
      bets.placeBet({
        userId,
        idempotencyKey: key,
        dto: { roundId: round.id, gameId: GAME_ID, items: [{ category: 'doubles', selection: 72, amountMinor: 999 }] }, // different amount
      }),
    ).rejects.toThrow(BetIdempotencyKeyReusedException);

    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(700n); // only the FIRST (legitimate) debit applied

    const betRows = await prisma.bet.findMany({ where: { userId, idempotencyKey: key } });
    expect(betRows).toHaveLength(1);
  });

  // ─── 9. N concurrent identical requests — exactly one real bet, one debit ─────
  it('9. N concurrent requests with the SAME idempotency key + payload produce exactly one bet and one debit', async () => {
    const userId = await seedUser(1000n);
    const round = await insertRound(prisma);
    const key = randomKey('bet');
    const dto = { roundId: round.id, gameId: GAME_ID, items: [{ category: 'triples' as const, selection: 63, amountMinor: 250 }] };

    const ATTEMPTS = 8;
    const results = await Promise.all(Array.from({ length: ATTEMPTS }, () => bets.placeBet({ userId, idempotencyKey: key, dto })));

    const uniqueBetIds = new Set(results.map((r) => r.betId));
    expect(uniqueBetIds.size).toBe(1);
    expect(results.filter((r) => !r.replayed)).toHaveLength(1);
    expect(results.filter((r) => r.replayed)).toHaveLength(ATTEMPTS - 1);

    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(750n); // moved exactly once (1000 - 250), never ATTEMPTS times

    const betRows = await prisma.bet.findMany({ where: { userId, idempotencyKey: key } });
    expect(betRows).toHaveLength(1);
  }, 30000);

  // ─── 10. N concurrent DIFFERENT bets competing for one limited balance ────────
  it('10. N concurrent DIFFERENT bets against a balance that can only afford some of them never overdraw and never lose a write', async () => {
    const STARTING_BALANCE = 500n; // affords exactly 5 bets of 100
    const BET_AMOUNT = 100n;
    const ATTEMPTS = 10;
    const userId = await seedUser(STARTING_BALANCE);
    const round = await insertRound(prisma);

    const attempts = Array.from({ length: ATTEMPTS }, (_, i) =>
      bets.placeBet({
        userId,
        idempotencyKey: randomKey(`concurrent-${i}`), // DIFFERENT key per attempt — genuinely independent bets
        dto: { roundId: round.id, gameId: GAME_ID, items: [{ category: 'singles', selection: i % 10, amountMinor: Number(BET_AMOUNT) }] },
      }),
    );

    const results = await Promise.allSettled(attempts);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(5);
    expect(rejected).toHaveLength(5);
    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientPointsException);
    }

    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(0n); // exactly 500 - 5*100, never negative
    expect(account.balanceMinor).toBeGreaterThanOrEqual(0n);

    const betRows = await prisma.bet.findMany({ where: { userId } });
    expect(betRows).toHaveLength(5); // one row per SUCCESSFUL bet — no lost writes, no duplicates
  }, 30000);

  // ─── 11. Cross-user idempotency-key safety (the security fix) ────────────────
  it('11. Two DIFFERENT users using the identical raw Idempotency-Key string both succeed independently — no cross-user denial of service', async () => {
    const userA = await seedUser(1000n);
    const userB = await seedUser(1000n);
    const round = await insertRound(prisma);
    // Deliberately identical raw client string for both users. The `bets`
    // table's uniqueness is already per-user, so this alone would not prove
    // much; what actually matters is the GLOBAL points_transactions ledger
    // key, which is derived from each bet's own server-generated betId
    // (`bet-debit:{betId}`) — never from this raw string — so two different
    // betIds can never collide on it regardless of what the client sends.
    const sharedRawKey = 'bet:client-generated-identical-string';

    const resultA = await bets.placeBet({
      userId: userA,
      idempotencyKey: sharedRawKey,
      dto: { roundId: round.id, gameId: GAME_ID, items: [{ category: 'doubles', selection: 72, amountMinor: 400 }] },
    });
    const resultB = await bets.placeBet({
      userId: userB,
      idempotencyKey: sharedRawKey,
      dto: { roundId: round.id, gameId: GAME_ID, items: [{ category: 'doubles', selection: 72, amountMinor: 400 }] },
    });

    expect(resultA.replayed).toBe(false);
    expect(resultB.replayed).toBe(false); // NOT rejected as a false "key reused" conflict
    expect(resultA.betId).not.toBe(resultB.betId);

    const accountA = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId: userA } });
    const accountB = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId: userB } });
    expect(accountA.balanceMinor).toBe(600n);
    expect(accountB.balanceMinor).toBe(600n);

    // Ledger rows exist for both, under DIFFERENT keys — each derived from its own betId.
    const ledgerRows = await prisma.pointsTransaction.findMany({
      where: { referenceType: 'bet_placed', referenceId: { in: [resultA.betId, resultB.betId] } },
    });
    expect(ledgerRows).toHaveLength(2);
    expect(new Set(ledgerRows.map((r) => r.idempotencyKey)).size).toBe(2);
    expect(ledgerRows.map((r) => r.idempotencyKey).sort()).toEqual(
      [`bet-debit:${resultA.betId}`, `bet-debit:${resultB.betId}`].sort(),
    );
  });

  // ─── 11b. Ledger idempotency-key length safety (Fix 2) ────────────────────────
  it('11b. A full-length documented client Idempotency-Key is accepted, and the ledger key stays well within points_transactions.idempotency_key VARCHAR(120)', async () => {
    const userId = await seedUser(1000n);
    const round = await insertRound(prisma);
    // docs/API_V2.md §6's documented raw format: bet:{userId}:{roundId}:{clientRequestId}.
    // userId/roundId are real UUIDs (36 chars each); pad clientRequestId so
    // the WHOLE raw key sits close to the historical risk zone this fix
    // addresses, while still fitting `bets.idempotencyKey`'s own column.
    const longClientRequestId = 'r'.repeat(40);
    const fullLengthRawKey = `bet:${userId}:${round.id}:${longClientRequestId}`;

    const result = await bets.placeBet({
      userId,
      idempotencyKey: fullLengthRawKey,
      dto: { roundId: round.id, gameId: GAME_ID, items: [{ category: 'doubles', selection: 72, amountMinor: 400 }] },
    });

    expect(result.replayed).toBe(false);

    const betRow = await prisma.bet.findUniqueOrThrow({ where: { id: result.betId } });
    expect(betRow.idempotencyKey).toBe(fullLengthRawKey); // raw client key stored verbatim, unmodified

    const ledgerRow = await prisma.pointsTransaction.findFirstOrThrow({
      where: { referenceType: 'bet_placed', referenceId: result.betId },
    });
    expect(ledgerRow.idempotencyKey).toBe(`bet-debit:${result.betId}`); // short, betId-derived — NOT the raw key
    expect(ledgerRow.idempotencyKey.length).toBeLessThanOrEqual(120);

    // Replaying the SAME full-length key still causes exactly one debit.
    const replay = await bets.placeBet({
      userId,
      idempotencyKey: fullLengthRawKey,
      dto: { roundId: round.id, gameId: GAME_ID, items: [{ category: 'doubles', selection: 72, amountMinor: 400 }] },
    });
    expect(replay.replayed).toBe(true);
    expect(replay.betId).toBe(result.betId);

    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(600n); // moved exactly once (1000 - 400)

    const ledgerRows = await prisma.pointsTransaction.findMany({
      where: { referenceType: 'bet_placed', referenceId: result.betId },
    });
    expect(ledgerRows).toHaveLength(1); // replay caused no second debit
  });

  // ─── 11c. Oversized Idempotency-Key rejected deterministically, never a raw DB 500 ──
  it('11c. A header longer than 120 chars is rejected with a clean 400 BEFORE any transaction — never surfaces as a PostgreSQL varchar(120) error', async () => {
    const userId = await seedUser(1000n);
    const round = await insertRound(prisma);
    const oversizedKey = 'k'.repeat(121);

    await expect(
      bets.placeBet({
        userId,
        idempotencyKey: oversizedKey,
        dto: { roundId: round.id, gameId: GAME_ID, items: [{ category: 'doubles', selection: 72, amountMinor: 400 }] },
      }),
    ).rejects.toThrow(BetIdempotencyKeyTooLongException);

    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(1000n); // unchanged — rejected before opening a transaction

    const betRows = await prisma.bet.findMany({ where: { userId } });
    expect(betRows).toHaveLength(0); // no row was ever attempted, let alone truncated
  });

  // ─── 12. BIGINT / centipoint precision ────────────────────────────────────────
  it('12. A large, non-round centipoint amount round-trips with no precision loss', async () => {
    const oddAmount = 123456789n;
    const userId = await seedUser(oddAmount + 1n);
    const round = await insertRound(prisma);

    const result = await bets.placeBet({
      userId,
      idempotencyKey: randomKey('bet'),
      dto: { roundId: round.id, gameId: GAME_ID, items: [{ category: 'triples', selection: 63, amountMinor: Number(oddAmount) }] },
    });

    expect(result.totalAmountMinor).toBe(Number(oddAmount));
    expect(result.balanceMinor).toBe(1);

    const betRow = await prisma.bet.findUniqueOrThrow({ where: { id: result.betId } });
    expect(betRow.totalAmountMinor).toBe(oddAmount); // exact BigInt, not a rounded/coerced number
  });

  // ─── 13. Concurrency regression on an already-locked round ────────────────────
  it('13. Concurrent bet attempts on a round that is already BETTING_LOCKED are ALL rejected — none succeeds', async () => {
    const userId = await seedUser(1000n);
    const round = await insertRound(prisma, { state: RoundState.BETTING_LOCKED });

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, i) =>
        bets.placeBet({
          userId,
          idempotencyKey: randomKey(`locked-${i}`),
          dto: { roundId: round.id, gameId: GAME_ID, items: [{ category: 'singles', selection: 2, amountMinor: 100 }] },
        }),
      ),
    );

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    for (const r of results) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(RoundNotAcceptingException);
    }

    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(1000n);
    const betRows = await prisma.bet.findMany({ where: { userId } });
    expect(betRows).toHaveLength(0);
  }, 20000);
});
