/**
 * Points ledger integration tests — run against REAL PostgreSQL.
 *
 * GATE (docs/PHASE_2_IMPLEMENTATION_PLAN.md Step 5): "concurrency tests — N
 * parallel debits on one account never overdraw and never lose a write; a
 * replayed idempotency key returns the original result without a second
 * ledger row. This is the highest-risk step; do not proceed until these
 * tests are convincing." Mocks alone are NOT sufficient for this — every
 * scenario below exercises the real FOR UPDATE row lock and the real
 * UNIQUE(idempotency_key) constraint against a live database.
 *
 * They are skipped when INTEGRATION_DB_URL is not set. Skipped tests are
 * NOT reported as PASS in the handoff (see MEMORY.md Phase 2B precedent).
 *
 * Coverage:
 *   1. N parallel debits on one account never overdraw it.
 *   2. Concurrent requests never lose a balance update (every successful
 *      debit is individually accounted for in the final balance).
 *   3. Reusing an idempotency key does not insert a second ledger row and
 *      does not mutate the balance twice — returns the original result.
 *   4. Two DIFFERENT idempotency keys produce two independent mutations.
 *   5. A failed mutation (insufficient balance) leaves no partial balance
 *      change, no orphan ledger row, and — for the admin path — no
 *      partial admin_logs record.
 *   6. PointsService.getBalance returns the authenticated user's own
 *      balance only (proven against two real users in the same database).
 *   7. PointsService.listTransactions cannot expose another user's ledger.
 *   8. BIGINT values round-trip through the FOR UPDATE raw query as a
 *      genuine JS `bigint`, not a string (arithmetic would throw otherwise).
 *   9. (Phase 2C hardening) Reusing the SAME idempotency key across two
 *      DIFFERENT users' accounts is rejected 409, not treated as a replay —
 *      UNIQUE(idempotency_key) is global, not scoped per-user.
 *  10. (Phase 2C hardening) Reusing an admin adjustment's idempotency key
 *      with a DIFFERENT admin actor is rejected 409 and mutates neither the
 *      balance nor the audit log.
 *
 * Run with:
 *   INTEGRATION_DB_URL=postgresql://user:pass@localhost:5432/jito_test npm run test
 */
import { randomBytes } from 'crypto';

import { PrismaClient } from '@prisma/client';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { AdminPointsService } from '../admin/points/admin-points.service';

import { IdempotencyKeyReusedException, InsufficientPointsException, PointsLedgerService } from './points-ledger.service';
import { PointsService } from './points.service';
import { PointsReconciliationService } from './reconciliation.service';

const INTEGRATION_DB_URL = process.env['INTEGRATION_DB_URL'];

function randomUsername(): string {
  return `points_test_${randomBytes(6).toString('hex')}`;
}

function randomKey(prefix: string): string {
  return `${prefix}:${randomBytes(8).toString('hex')}`;
}

/**
 * Create a user + points_accounts row, then seed the starting balance
 * THROUGH the ledger (a real admin_credit mutation) rather than writing
 * `balanceMinor` directly.
 *
 * This matters: a real account always starts at 0 (docs/AUTH_V2.md §2 —
 * registration creates the account at balance 0) and every subsequent
 * change goes through the ledger, so `SUM(credits) - SUM(debits)` always
 * equals the balance. Seeding a non-zero `balanceMinor` directly (bypassing
 * the ledger) creates an account whose ledger genuinely does NOT explain
 * its balance — reconciliation.service.ts correctly reports that as a
 * mismatch, because it would be one. Seeding through `ledger.applyMutation`
 * keeps every fixture in this suite consistent with how balances are
 * created in production, everywhere.
 */
async function createUserWithBalance(
  prisma: PrismaClient,
  ledger: PointsLedgerService,
  startingBalanceMinor: bigint,
): Promise<{ userId: string }> {
  const username = randomUsername();
  const user = await prisma.user.create({
    data: { username, email: `${username}@test.com`, passwordHash: 'x', status: 'active' },
  });
  await prisma.pointsAccount.create({
    data: { userId: user.id, balanceMinor: 0n, version: 0n },
  });

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

/**
 * Best-effort test fixture cleanup.
 *
 * `points_transactions` is APPEND-ONLY — enforced by BOTH the
 * `trg_points_transactions_append_only` DB trigger AND
 * `account_id`'s `ON DELETE RESTRICT` foreign key. This is by design, and
 * deliberately so: several tests in this suite exist specifically to prove
 * that guarantee. Once a test creates a real ledger row, deleting it is
 * therefore both impossible and WRONG to attempt.
 *
 * If the account has any transactions, this function leaves the
 * user/account/transactions in place rather than deleting them. They are
 * harmless, uniquely named (`points_test_*`), local-dev-database-only
 * fixtures — the disposable Docker volume (`docker compose down -v`) is the
 * actual cleanup mechanism, consistent with how this data behaves in every
 * real environment.
 */
async function cleanupTestUser(prisma: PrismaClient, userId: string): Promise<void> {
  const account = await prisma.pointsAccount.findUnique({ where: { userId }, select: { id: true } });
  if (account) {
    const txnCount = await prisma.pointsTransaction.count({ where: { accountId: account.id } });
    if (txnCount > 0) {
      return; // append-only — nothing to clean up, and nothing that CAN be
    }
  }
  await prisma.pointsAccount.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

/**
 * Best-effort admin fixture cleanup.
 *
 * `admin_logs` is APPEND-ONLY too (same trigger pattern as
 * `points_transactions` — see `cleanupTestUser` above). Earlier fixtures in
 * this suite never hit this because their admin_logs write always rolled
 * back with the rest of the failing transaction (test 5b); a real,
 * COMMITTED admin_logs row (e.g. test 10's successful first adjustment)
 * cannot be deleted, so skip cleanup entirely once one exists — same
 * disposable-Docker-volume reasoning as `cleanupTestUser`.
 */
async function deleteAdminWithRelations(prisma: PrismaClient, adminId: string): Promise<void> {
  const logCount = await prisma.adminLog.count({ where: { adminId } });
  if (logCount > 0) {
    return;
  }
  await prisma.session.deleteMany({ where: { adminId } });
  await prisma.adminUser.delete({ where: { id: adminId } });
}

describe.skipIf(!INTEGRATION_DB_URL)('Points Ledger Integration Tests [requires PostgreSQL]', () => {
  let prisma: PrismaClient;
  let ledger: PointsLedgerService;
  let pointsService: PointsService;
  let reconciliation: PointsReconciliationService;

  beforeAll(async () => {
    if (!INTEGRATION_DB_URL) return;
    prisma = new PrismaClient({ datasources: { db: { url: INTEGRATION_DB_URL } } });
    await prisma.$connect();
    // PrismaService extends PrismaClient — structurally identical at runtime,
    // so the real service classes can be constructed directly (same pattern
    // as auth.integration.spec.ts's buildRealAuthService).
    ledger = new PointsLedgerService(prisma as never);
    pointsService = new PointsService(prisma as never);
    reconciliation = new PointsReconciliationService(prisma as never);
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.$disconnect();
  });

  // ─── 1 & 2. N parallel debits: never overdraw, never lose a write ─────────────
  it('1+2. N parallel debits on one account never overdraw it and never lose a write', async () => {
    const STARTING_BALANCE = 500n; // enough for exactly 5 debits of 100
    const DEBIT_AMOUNT = 100n;
    const ATTEMPTS = 10; // 5 must succeed, 5 must fail — never more, never fewer

    const { userId } = await createUserWithBalance(prisma, ledger, STARTING_BALANCE);

    const attempts = Array.from({ length: ATTEMPTS }, (_, i) =>
      ledger.applyMutation({
        userId,
        direction: 'debit',
        amountMinor: DEBIT_AMOUNT,
        referenceType: 'admin_debit',
        referenceId: null,
        idempotencyKey: randomKey(`parallel-debit-${i}`), // DIFFERENT key per attempt — genuinely independent mutations
        description: `parallel debit ${i}`,
      }),
    );

    const results = await Promise.allSettled(attempts);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 5 could be afforded from a starting balance of 500 at 100 each.
    expect(fulfilled.length).toBe(5);
    expect(rejected.length).toBe(5);
    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientPointsException);
    }

    // INVARIANT: balance never negative, and exactly accounts for the
    // successful debits — proves no lost update AND no overdraw.
    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(STARTING_BALANCE - DEBIT_AMOUNT * BigInt(fulfilled.length));
    expect(account.balanceMinor).toBeGreaterThanOrEqual(0n);
    expect(account.balanceMinor).toBe(0n); // exactly 500 - 5*100

    // Exactly one ledger row per SUCCESSFUL debit (+1 for the fixture's own
    // seed credit) — no lost writes, no duplicates.
    const txnCount = await prisma.pointsTransaction.count({ where: { account: { userId } } });
    expect(txnCount).toBe(1 + 5);

    // Re-derive the balance fresh from the ledger — must agree with the projection.
    const check = await reconciliation.verifyAccount(userId);
    expect(check.matches).toBe(true);

    await cleanupTestUser(prisma, userId);
  }, 30000);

  // ─── 3. Idempotency: same key never double-inserts / double-mutates ───────────
  it('3. Reusing the same idempotency key returns the original result without a second ledger row', async () => {
    const { userId } = await createUserWithBalance(prisma, ledger, 1000n);
    const key = randomKey('replay-test');

    const first = await ledger.applyMutation({
      userId,
      direction: 'debit',
      amountMinor: 300n,
      referenceType: 'admin_debit',
      referenceId: null,
      idempotencyKey: key,
      description: 'first attempt',
    });
    expect(first.replayed).toBe(false);

    // Replay with the SAME key and SAME parameters — fired 5 times to also
    // prove repeated replays are all safe, not just a single retry.
    const replays = await Promise.all(
      Array.from({ length: 5 }, () =>
        ledger.applyMutation({
          userId,
          direction: 'debit',
          amountMinor: 300n,
          referenceType: 'admin_debit',
          referenceId: null,
          idempotencyKey: key,
          description: 'first attempt',
        }),
      ),
    );

    for (const replay of replays) {
      expect(replay.replayed).toBe(true);
      expect(replay.transactionId).toBe(first.transactionId);
      expect(replay.balanceAfterMinor).toBe(700n);
    }

    // Balance moved exactly ONCE (1000 - 300 = 700), not six times.
    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(700n);

    // Exactly one row for this key.
    const rows = await prisma.pointsTransaction.findMany({ where: { idempotencyKey: key } });
    expect(rows).toHaveLength(1);

    await cleanupTestUser(prisma, userId);
  }, 20000);

  // ─── 3b. TRUE concurrent replay (race window) ─────────────────────────────────
  it('3b. Concurrent requests with the SAME idempotency key never produce two ledger rows', async () => {
    const { userId } = await createUserWithBalance(prisma, ledger, 1000n);
    const key = randomKey('concurrent-replay');

    // Fire 8 genuinely concurrent attempts with the IDENTICAL key. At most
    // one may create a new row; the rest must resolve to the SAME row via
    // the pre-check OR the P2002 race-catch path in applyMutation.
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        ledger.applyMutation({
          userId,
          direction: 'debit',
          amountMinor: 250n,
          referenceType: 'admin_debit',
          referenceId: null,
          idempotencyKey: key,
          description: 'concurrent replay',
        }),
      ),
    );

    const fulfilled = results
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof ledger.applyMutation>>> => r.status === 'fulfilled')
      .map((r) => r.value);

    // Every concurrent caller must succeed (idempotent replay, not an error).
    expect(fulfilled).toHaveLength(8);
    // Every one of them must resolve to the SAME transaction id.
    const uniqueTxnIds = new Set(fulfilled.map((r) => r.transactionId));
    expect(uniqueTxnIds.size).toBe(1);

    // Balance moved exactly once (1000 - 250 = 750), regardless of 8 callers.
    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(750n);

    const rows = await prisma.pointsTransaction.findMany({ where: { idempotencyKey: key } });
    expect(rows).toHaveLength(1);

    await cleanupTestUser(prisma, userId);
  }, 30000);

  // ─── 4. Different keys → independent mutations ────────────────────────────────
  it('4. Two DIFFERENT idempotency keys produce two independent mutations', async () => {
    const { userId } = await createUserWithBalance(prisma, ledger, 1000n);

    const a = await ledger.applyMutation({
      userId,
      direction: 'debit',
      amountMinor: 100n,
      referenceType: 'admin_debit',
      referenceId: null,
      idempotencyKey: randomKey('key-a'),
      description: 'mutation A',
    });
    const b = await ledger.applyMutation({
      userId,
      direction: 'debit',
      amountMinor: 200n,
      referenceType: 'admin_debit',
      referenceId: null,
      idempotencyKey: randomKey('key-b'),
      description: 'mutation B',
    });

    expect(a.transactionId).not.toBe(b.transactionId);
    expect(a.replayed).toBe(false);
    expect(b.replayed).toBe(false);

    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(700n); // 1000 - 100 - 200

    // +1 for the fixture's own seed credit.
    const count = await prisma.pointsTransaction.count({ where: { account: { userId } } });
    expect(count).toBe(1 + 2);

    await cleanupTestUser(prisma, userId);
  }, 20000);

  // ─── 5. Failed mutation leaves no partial state (player path + admin path) ────
  it('5a. A failed debit (insufficient balance) leaves no partial balance change or orphan row', async () => {
    const { userId } = await createUserWithBalance(prisma, ledger, 50n);
    const key = randomKey('failed-debit');

    await expect(
      ledger.applyMutation({
        userId,
        direction: 'debit',
        amountMinor: 999n,
        referenceType: 'admin_debit',
        referenceId: null,
        idempotencyKey: key,
        description: 'should fail',
      }),
    ).rejects.toThrow(InsufficientPointsException);

    // Balance completely unchanged.
    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(50n);

    // No orphan ledger row for the failed attempt's key.
    const orphan = await prisma.pointsTransaction.findUnique({ where: { idempotencyKey: key } });
    expect(orphan).toBeNull();

    await cleanupTestUser(prisma, userId);
  }, 20000);

  it('5b. A failed ADMIN adjustment leaves no partial audit log, ledger row, or balance change', async () => {
    const { userId } = await createUserWithBalance(prisma, ledger, 50n);
    const adminUsername = `points_admin_${randomBytes(6).toString('hex')}`;
    const admin = await prisma.adminUser.create({
      data: { username: adminUsername, passwordHash: 'x', role: 'operator', status: 'active' },
    });

    const adminPointsService = new AdminPointsService(prisma as never, ledger);
    const key = randomKey('failed-admin-debit');

    await expect(
      adminPointsService.adjust({
        adminId: admin.id,
        targetUserId: userId,
        dto: { direction: 'debit', amountMinor: 999, reason: 'should fail — insufficient balance' },
        idempotencyKey: key,
        ip: '127.0.0.1',
      }),
    ).rejects.toThrow();

    // Balance unchanged.
    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(50n);

    // No orphan ledger row.
    const orphanTxn = await prisma.pointsTransaction.findUnique({ where: { idempotencyKey: key } });
    expect(orphanTxn).toBeNull();

    // No orphan admin_logs row — the create() ran inside the SAME
    // transaction as the ledger mutation, so the rollback must have undone
    // BOTH. If admin_logs.create had run outside the transaction (a bug),
    // this row would exist despite the ledger failing.
    const orphanLog = await prisma.adminLog.findFirst({
      where: { adminId: admin.id, targetId: userId, action: 'points_adjust' },
    });
    expect(orphanLog).toBeNull();

    await cleanupTestUser(prisma, userId);
    await deleteAdminWithRelations(prisma, admin.id);
  }, 20000);

  // ─── 6 & 7. Scoping: a user only ever sees their own balance/ledger ───────────
  it('6+7. getBalance and listTransactions never expose another user\'s data', async () => {
    const { userId: userA } = await createUserWithBalance(prisma, ledger, 1000n);
    const { userId: userB } = await createUserWithBalance(prisma, ledger, 2000n);

    await ledger.applyMutation({
      userId: userA,
      direction: 'debit',
      amountMinor: 100n,
      referenceType: 'admin_debit',
      referenceId: null,
      idempotencyKey: randomKey('scope-a'),
      description: 'user A private transaction',
    });
    await ledger.applyMutation({
      userId: userB,
      direction: 'debit',
      amountMinor: 500n,
      referenceType: 'admin_debit',
      referenceId: null,
      idempotencyKey: randomKey('scope-b'),
      description: 'user B private transaction',
    });

    const balanceA = await pointsService.getBalance(userA);
    const balanceB = await pointsService.getBalance(userB);
    expect(balanceA.balanceMinor).toBe(900); // 1000 - 100 — NOT affected by B's debit
    expect(balanceB.balanceMinor).toBe(1500); // 2000 - 500

    const ledgerA = await pointsService.listTransactions(userA, {});
    const ledgerB = await pointsService.listTransactions(userB, {});

    // 2 rows each: the fixture's seed credit + the debit above. Ordered
    // newest-first, so [0] is the debit just placed.
    expect(ledgerA.data).toHaveLength(2);
    expect(ledgerA.data[0]?.description).toBe('user A private transaction');
    expect(ledgerA.data.some((t) => t.description === 'user B private transaction')).toBe(false);

    expect(ledgerB.data).toHaveLength(2);
    expect(ledgerB.data[0]?.description).toBe('user B private transaction');
    expect(ledgerB.data.some((t) => t.description === 'user A private transaction')).toBe(false);

    await cleanupTestUser(prisma, userA);
    await cleanupTestUser(prisma, userB);
  }, 20000);

  // ─── 8. BIGINT round-trips through the raw FOR UPDATE query as a real bigint ──
  it('8. balance_minor from the raw FOR UPDATE query is a genuine JS bigint, not a string', async () => {
    const { userId } = await createUserWithBalance(prisma, ledger, 123456789n);

    const rows = await prisma.$queryRaw<Array<{ id: string; balance_minor: unknown }>>`
      SELECT pa.id, pa.balance_minor
        FROM points_accounts pa
       WHERE pa.user_id = ${userId}::uuid`;

    expect(rows).toHaveLength(1);
    // If Prisma ever returned this as a string (a regression in a future
    // Prisma version), the arithmetic inside mutateWithinTransaction
    // (`balanceBefore + params.amountMinor`) would throw TypeError:
    // "Cannot mix BigInt and other types" — proven directly here instead.
    expect(typeof rows[0]?.balance_minor).toBe('bigint');
    expect(rows[0]?.balance_minor).toBe(123456789n);

    await cleanupTestUser(prisma, userId);
  }, 15000);

  // ─── 9. Cross-user idempotency-key reuse (Phase 2C hardening, Item 1) ─────────
  it("9. Reusing the same idempotency key across TWO DIFFERENT users' accounts rejects 409 and mutates neither balance", async () => {
    const { userId: userA } = await createUserWithBalance(prisma, ledger, 1000n);
    const { userId: userB } = await createUserWithBalance(prisma, ledger, 1000n);
    const key = randomKey('cross-user-reuse');

    const first = await ledger.applyMutation({
      userId: userA,
      direction: 'debit',
      amountMinor: 100n,
      referenceType: 'admin_debit',
      referenceId: null,
      idempotencyKey: key,
      description: 'user A original mutation',
    });
    expect(first.replayed).toBe(false);

    // Same key, SAME direction/amount/referenceType/referenceId — but a
    // DIFFERENT user. UNIQUE(idempotency_key) is global, so without the
    // ownership check this would silently "replay" user A's transaction
    // for user B. Must be rejected instead.
    await expect(
      ledger.applyMutation({
        userId: userB,
        direction: 'debit',
        amountMinor: 100n,
        referenceType: 'admin_debit',
        referenceId: null,
        idempotencyKey: key,
        description: 'user A original mutation',
      }),
    ).rejects.toThrow(IdempotencyKeyReusedException);

    // Neither user's balance was affected by the rejected cross-user call:
    // A moved exactly once (its own original mutation), B is untouched.
    const accountA = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId: userA } });
    const accountB = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId: userB } });
    expect(accountA.balanceMinor).toBe(900n); // 1000 - 100
    expect(accountB.balanceMinor).toBe(1000n); // untouched

    // The key still resolves to exactly ONE row — owned by user A, not B.
    const rows = await prisma.pointsTransaction.findMany({ where: { idempotencyKey: key } });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.accountId).toBe(accountA.id);
    expect(rows[0]?.accountId).not.toBe(accountB.id);

    await cleanupTestUser(prisma, userA);
    await cleanupTestUser(prisma, userB);
  }, 20000);

  // ─── 10. Cross-admin adjustment-key reuse (Phase 2C hardening, Item 2) ────────
  it('10. Reusing an admin adjustment idempotency key with a DIFFERENT admin actor rejects 409 and mutates nothing', async () => {
    const { userId } = await createUserWithBalance(prisma, ledger, 1000n);
    const adminA = await prisma.adminUser.create({
      data: { username: `points_admin_${randomBytes(6).toString('hex')}`, passwordHash: 'x', role: 'operator', status: 'active' },
    });
    const adminB = await prisma.adminUser.create({
      data: { username: `points_admin_${randomBytes(6).toString('hex')}`, passwordHash: 'x', role: 'operator', status: 'active' },
    });

    const adminPointsService = new AdminPointsService(prisma as never, ledger);
    const key = randomKey('cross-admin-reuse');

    const first = await adminPointsService.adjust({
      adminId: adminA.id,
      targetUserId: userId,
      dto: { direction: 'credit', amountMinor: 500, reason: 'admin A grant' },
      idempotencyKey: key,
      ip: '127.0.0.1',
    });
    expect(first.replayed).toBe(false);

    // Same key, same target/direction/amount/reason — presented by a
    // DIFFERENT admin. The admin actor is authoritative (via the admin_logs
    // audit linkage) and must not be replayable across admins.
    await expect(
      adminPointsService.adjust({
        adminId: adminB.id,
        targetUserId: userId,
        dto: { direction: 'credit', amountMinor: 500, reason: 'admin A grant' },
        idempotencyKey: key,
        ip: '127.0.0.1',
      }),
    ).rejects.toThrow();

    // Balance moved exactly once — only admin A's original adjustment applied.
    const account = await prisma.pointsAccount.findUniqueOrThrow({ where: { userId } });
    expect(account.balanceMinor).toBe(1500n); // 1000 + 500

    // Exactly one ledger row for this key — admin B's rejected attempt
    // created no second row, and no admin_logs row of its own.
    const rows = await prisma.pointsTransaction.findMany({ where: { idempotencyKey: key } });
    expect(rows).toHaveLength(1);
    const adminBLog = await prisma.adminLog.findFirst({
      where: { adminId: adminB.id, targetId: userId, action: 'points_adjust' },
    });
    expect(adminBLog).toBeNull();

    await cleanupTestUser(prisma, userId);
    await deleteAdminWithRelations(prisma, adminA.id);
    await deleteAdminWithRelations(prisma, adminB.id);
  }, 20000);
});
