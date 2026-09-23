/**
 * Round lifecycle integration tests — run against REAL PostgreSQL.
 *
 * Phase 2D / Step 6 gate (docs/PHASE_2_IMPLEMENTATION_PLAN.md Step 6 exit
 * criteria): "a round advances through betting states on the DB clock;
 * killing and restarting the engine mid-round resumes correctly; two engine
 * instances cannot both act." Mocks alone cannot prove any of this — every
 * scenario below exercises the real guarded UPDATE, the real partial unique
 * index (uq_rounds_one_live_per_game), the real (game_id, round_number)
 * unique constraint, and PostgreSQL's own `now()`, against a live database
 * (same "mocks are NOT sufficient for concurrency correctness" principle
 * established in Phase 2C's points.integration.spec.ts).
 *
 * Skipped when INTEGRATION_DB_URL is not set. Skipped tests are NOT reported
 * as PASS in the handoff (MEMORY.md Phase 2B precedent).
 *
 * Coverage (docs/PHASE_2_IMPLEMENTATION_PLAN.md §11 / today's task list):
 *   1. Valid state transitions (ROUND_CREATED → BETTING_OPEN → BETTING_LOCKED)
 *   2. Invalid transition rejection (no-op, state unchanged)
 *   3. Duplicate transition idempotency
 *   4. Concurrent transition attempts — only one succeeds
 *   5. Round creation concurrency — no duplicate active round
 *   6. Monotonic stateVersion increments
 *   7. Restart/recovery from persisted round state
 *   8. Stale transition attempt cannot overwrite newer state
 *   9. Timing boundaries use server deadlines (PostgreSQL now(), not app clock)
 *  10. No points ledger mutation occurs during round-lifecycle-only reconciliation
 *
 * Run with:
 *   INTEGRATION_DB_URL=postgresql://user:pass@localhost:5432/jito_test npm run test
 */
import { randomBytes } from 'crypto';

import { GameId } from '@jito/types';
import { PrismaClient, RoundState } from '@prisma/client';
import { describe, expect, it, beforeAll, afterAll, afterEach } from 'vitest';

import type { EngineConfigService } from '../config/engine-config.service';

import { RoundsService } from './rounds.service';

const INTEGRATION_DB_URL = process.env['INTEGRATION_DB_URL'];

/** Short, deterministic betting window — this is TEST config, not a production value (see rounds.service.ts / env.schema.ts doc comments). */
const TEST_BETTING_WINDOW_MS = 300;

const TEST_GAME_IDS: readonly GameId[] = [GameId.TripleChanceTimer, GameId.TripleChanceProTimer];

function randomDisplayCode(): string {
  return `ZZ${randomBytes(6).toString('hex')}`;
}

async function cleanupRounds(prisma: PrismaClient): Promise<void> {
  // game_rounds is a normal mutable table (not append-only) — no child rows
  // exist for any round these tests create (no bets/results/settlements
  // module writes anything yet), so a hard delete is always safe.
  await prisma.gameRound.deleteMany({ where: { gameId: { in: [...TEST_GAME_IDS] } } });
}

/** Insert a round directly, bypassing the service, for tests that need a precise starting state. */
async function insertRound(
  prisma: PrismaClient,
  overrides: Partial<{
    gameId: GameId;
    state: RoundState;
    bettingDeadline: Date;
    opensAt: Date;
    stateVersion: bigint;
  }> = {},
) {
  const gameId = overrides.gameId ?? GameId.TripleChanceTimer;
  const agg = await prisma.gameRound.aggregate({ where: { gameId }, _max: { roundNumber: true } });
  const roundNumber = (agg._max.roundNumber ?? 0n) + 1n;

  return prisma.gameRound.create({
    data: {
      gameId,
      roundNumber,
      displayCode: randomDisplayCode(),
      state: overrides.state ?? RoundState.BETTING_OPEN,
      stateVersion: overrides.stateVersion ?? 0n,
      opensAt: overrides.opensAt ?? new Date(Date.now() - 60000),
      bettingDeadline: overrides.bettingDeadline ?? new Date(Date.now() - 1000),
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe.skipIf(!INTEGRATION_DB_URL)('Round Lifecycle Integration Tests [requires PostgreSQL]', () => {
  let prisma: PrismaClient;
  let rounds: RoundsService;

  beforeAll(async () => {
    if (!INTEGRATION_DB_URL) return;
    prisma = new PrismaClient({ datasources: { db: { url: INTEGRATION_DB_URL } } });
    await prisma.$connect();
    const testConfig = { roundBettingWindowMs: TEST_BETTING_WINDOW_MS } as unknown as EngineConfigService;
    // EnginePrismaService extends PrismaClient — structurally identical at
    // runtime, so the real service can be constructed directly (same
    // pattern as Phase 2C's points.integration.spec.ts).
    rounds = new RoundsService(prisma as never, testConfig);
  });

  afterEach(async () => {
    if (prisma) await cleanupRounds(prisma);
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.$disconnect();
  });

  // ─── 1. Valid state transitions ────────────────────────────────────────────────
  it('1. A round advances ROUND_CREATED -> BETTING_OPEN -> BETTING_LOCKED via reconcile, on the DB clock', async () => {
    // Tick 1: no live round -> create.
    await rounds.reconcile(GameId.TripleChanceTimer);
    let round = await rounds.findLiveRound(GameId.TripleChanceTimer);
    expect(round?.state).toBe(RoundState.ROUND_CREATED);
    expect(round?.stateVersion).toBe(0n);

    // Tick 2: CREATED -> OPEN.
    await rounds.reconcile(GameId.TripleChanceTimer);
    round = await rounds.findLiveRound(GameId.TripleChanceTimer);
    expect(round?.state).toBe(RoundState.BETTING_OPEN);
    expect(round?.stateVersion).toBe(1n);

    // Before the deadline: reconcile must NOT lock yet.
    await rounds.reconcile(GameId.TripleChanceTimer);
    round = await rounds.findLiveRound(GameId.TripleChanceTimer);
    expect(round?.state).toBe(RoundState.BETTING_OPEN);

    // After the deadline: reconcile locks it.
    await sleep(TEST_BETTING_WINDOW_MS + 100);
    await rounds.reconcile(GameId.TripleChanceTimer);
    round = await rounds.findLiveRound(GameId.TripleChanceTimer);
    expect(round?.state).toBe(RoundState.BETTING_LOCKED);
    expect(round?.stateVersion).toBe(2n);
    expect(round?.lockedAt).not.toBeNull();
  }, 15000);

  // ─── 2. Invalid transition rejection ───────────────────────────────────────────
  it('2. openRound is rejected (no-op) for a round not in ROUND_CREATED', async () => {
    const round = await insertRound(prisma, { state: RoundState.BETTING_OPEN });

    const opened = await rounds.openRound(round.id);

    expect(opened).toBe(false);
    const after = await prisma.gameRound.findUniqueOrThrow({ where: { id: round.id } });
    expect(after.state).toBe(RoundState.BETTING_OPEN);
    expect(after.stateVersion).toBe(0n);
  });

  // ─── 3. Duplicate transition idempotency ───────────────────────────────────────
  it('3. Locking the same round twice is idempotent — the second call is a no-op', async () => {
    const round = await insertRound(prisma, {
      state: RoundState.BETTING_OPEN,
      bettingDeadline: new Date(Date.now() - 1000), // already passed
    });

    const first = await rounds.lockIfDeadlinePassed(round.id);
    const second = await rounds.lockIfDeadlinePassed(round.id);

    expect(first).toBe(true);
    expect(second).toBe(false);

    const after = await prisma.gameRound.findUniqueOrThrow({ where: { id: round.id } });
    expect(after.state).toBe(RoundState.BETTING_LOCKED);
    expect(after.stateVersion).toBe(1n); // incremented exactly once, not twice
  });

  // ─── 4. Concurrent transition attempts — only one succeeds ────────────────────
  it('4. N concurrent lock attempts on the same round — exactly one succeeds, version increments by exactly 1', async () => {
    const round = await insertRound(prisma, {
      state: RoundState.BETTING_OPEN,
      bettingDeadline: new Date(Date.now() - 1000),
    });

    const ATTEMPTS = 10;
    const results = await Promise.all(
      Array.from({ length: ATTEMPTS }, () => rounds.lockIfDeadlinePassed(round.id)),
    );

    const successes = results.filter(Boolean);
    expect(successes).toHaveLength(1);

    const after = await prisma.gameRound.findUniqueOrThrow({ where: { id: round.id } });
    expect(after.state).toBe(RoundState.BETTING_LOCKED);
    expect(after.stateVersion).toBe(1n); // never N — the guarded UPDATE serializes at the DB
  }, 20000);

  // ─── 5. Round creation concurrency — no duplicate active round ────────────────
  it('5. N concurrent tryCreateRound calls for a game with no live round create exactly one round', async () => {
    const ATTEMPTS = 10;
    const results = await Promise.all(
      Array.from({ length: ATTEMPTS }, () => rounds.tryCreateRound(GameId.TripleChanceTimer)),
    );

    const created = results.filter((r) => r !== null);
    expect(created).toHaveLength(1);

    const rows = await prisma.gameRound.findMany({ where: { gameId: GameId.TripleChanceTimer } });
    expect(rows).toHaveLength(1);
  }, 20000);

  // ─── 6. Monotonic stateVersion increments ──────────────────────────────────────
  it('6. stateVersion increases monotonically across CREATED -> OPEN -> LOCKED, never skips or decreases', async () => {
    await rounds.reconcile(GameId.TripleChanceTimer); // create (version 0)
    const created = await rounds.findLiveRound(GameId.TripleChanceTimer);
    expect(created?.stateVersion).toBe(0n);

    await rounds.reconcile(GameId.TripleChanceTimer); // open (version 1)
    const opened = await rounds.findLiveRound(GameId.TripleChanceTimer);
    expect(opened?.stateVersion).toBe(1n);

    await sleep(TEST_BETTING_WINDOW_MS + 100);
    await rounds.reconcile(GameId.TripleChanceTimer); // lock (version 2)
    const locked = await rounds.findLiveRound(GameId.TripleChanceTimer);
    expect(locked?.stateVersion).toBe(2n);

    expect(created).not.toBeNull();
    expect(opened).not.toBeNull();
    expect(locked).not.toBeNull();
    expect((opened?.stateVersion ?? 0n) > (created?.stateVersion ?? 0n)).toBe(true);
    expect((locked?.stateVersion ?? 0n) > (opened?.stateVersion ?? 0n)).toBe(true);
  }, 15000);

  // ─── 7. Restart/recovery from persisted round state ────────────────────────────
  it('7. A round left in ROUND_CREATED (simulated crash between create and open) is opened by the next reconcile — the recovery path IS the normal path', async () => {
    // Simulates the engine crashing right after tryCreateRound committed but
    // before openRound ran — insert directly rather than via reconcile(),
    // which would perform both steps together in this process.
    const round = await insertRound(prisma, { state: RoundState.ROUND_CREATED });
    expect(round.stateVersion).toBe(0n);

    // "Restart" = nothing but a fresh call to reconcile() against whatever
    // is durably persisted — no in-memory state is required or consulted.
    await rounds.reconcile(GameId.TripleChanceTimer);

    const after = await prisma.gameRound.findUniqueOrThrow({ where: { id: round.id } });
    expect(after.state).toBe(RoundState.BETTING_OPEN);
    expect(after.stateVersion).toBe(1n);
  });

  // ─── 8. Stale transition attempt cannot overwrite newer state ─────────────────
  it('8. A stale openRound attempt against an already-progressed round cannot overwrite it', async () => {
    const round = await insertRound(prisma, {
      state: RoundState.BETTING_LOCKED,
      stateVersion: 5n,
    });

    // A delayed/stale caller still believes the round was ROUND_CREATED and
    // tries to open it — must be rejected, not silently "succeed" onto a
    // round that has already moved on.
    const opened = await rounds.openRound(round.id);
    expect(opened).toBe(false);

    const after = await prisma.gameRound.findUniqueOrThrow({ where: { id: round.id } });
    expect(after.state).toBe(RoundState.BETTING_LOCKED); // unchanged
    expect(after.stateVersion).toBe(5n); // unchanged — not overwritten to a lower value
  });

  // ─── 9. Timing boundaries use server deadlines ─────────────────────────────────
  it("9. Locking respects PostgreSQL's now(), not the moment the row was read — false before the deadline, true after", async () => {
    const round = await insertRound(prisma, {
      state: RoundState.BETTING_OPEN,
      bettingDeadline: new Date(Date.now() + TEST_BETTING_WINDOW_MS),
    });

    const before = await rounds.lockIfDeadlinePassed(round.id);
    expect(before).toBe(false);

    await sleep(TEST_BETTING_WINDOW_MS + 100);

    const after = await rounds.lockIfDeadlinePassed(round.id);
    expect(after).toBe(true);

    const row = await prisma.gameRound.findUniqueOrThrow({ where: { id: round.id } });
    expect(row.state).toBe(RoundState.BETTING_LOCKED);
  }, 10000);

  // ─── 10. No points ledger mutation during round-lifecycle reconciliation ──────
  it('10. A full reconcile cycle (create -> open -> lock) writes zero points_transactions rows', async () => {
    const before = await prisma.pointsTransaction.count();

    await rounds.reconcile(GameId.TripleChanceTimer); // create
    await rounds.reconcile(GameId.TripleChanceTimer); // open
    await sleep(TEST_BETTING_WINDOW_MS + 100);
    await rounds.reconcile(GameId.TripleChanceTimer); // lock

    const round = await rounds.findLiveRound(GameId.TripleChanceTimer);
    expect(round?.state).toBe(RoundState.BETTING_LOCKED);

    const after = await prisma.pointsTransaction.count();
    expect(after).toBe(before);
  }, 15000);
});
