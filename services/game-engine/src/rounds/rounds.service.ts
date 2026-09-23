/**
 * RoundsService — the round lifecycle state machine (docs/GAME_ENGINE_V2.md §2, §5).
 *
 * Phase 2D / Step 6 scope ONLY (docs/PHASE_2_IMPLEMENTATION_PLAN.md Step 6):
 *   ROUND_CREATED → BETTING_OPEN → BETTING_LOCKED, driven by the reconciling
 *   scheduler (ADR-019) reading PostgreSQL state on every tick.
 *
 * Deliberately NOT implemented here (later steps):
 *   - BETTING_OPEN → BETTING_ACTIVE (Step 7 — triggered by the first bet
 *     placed in a round; there is no bet-placement code yet to trigger it)
 *   - BETTING_LOCKED → RESULT_PENDING and beyond (Step 9 — result ingestion)
 *   - Any settlement, payout, or win-determination logic (Step 10, ADR-018)
 * A round that reaches BETTING_LOCKED under this service simply stays there
 * — this is the correct, intentional boundary of Step 6, not a bug.
 *
 * Every transition is a conditional, guarded UPDATE
 * (`WHERE id = $id AND state = $expected`), so:
 *   - a duplicated tick is a no-op (idempotent)
 *   - a stale/delayed transition attempt cannot overwrite newer state
 *     (the WHERE clause simply matches zero rows)
 *   - concurrent callers race safely at the database level — at most one
 *     UPDATE can ever affect the row for a given expected-state guard
 * `state_version` is incremented atomically in the same UPDATE as `state`
 * (ADR-023). All deadline comparisons use PostgreSQL's own `now()`, never
 * the application host's clock (ADR-019) — see `lockIfDeadlinePassed`.
 *
 * Round creation concurrency (no duplicate active round) is enforced by the
 * partial unique index `uq_rounds_one_live_per_game` at the database level
 * (ADR-017) — a racing `create()` fails with P2002, which is treated as
 * "another writer already won" rather than an error.
 *
 * This service touches ONLY `game_rounds`. No points ledger mutation occurs
 * anywhere in round-lifecycle code (canonical lock order round → account →
 * bet, ADR-022 — Phase 2D introduces no account → round path).
 */
import type { GameId } from '@jito/types';
import { Injectable, Logger } from '@nestjs/common';
import type { GameRound } from '@prisma/client';
import { RoundState } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { EngineConfigService } from '../config/engine-config.service'; // DI token — must be value import
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { EnginePrismaService } from '../database/prisma.service'; // DI token — must be value import

import { generateDisplayCode } from './display-code';

/** States still "live" — excluded from the one-live-round-per-game index. */
const TERMINAL_STATES: readonly RoundState[] = [RoundState.ROUND_COMPLETED, RoundState.ROUND_VOID];

/** States a round can be locked from — deadline passed while accepting bets. */
const LOCKABLE_STATES: readonly RoundState[] = [RoundState.BETTING_OPEN, RoundState.BETTING_ACTIVE];

@Injectable()
export class RoundsService {
  private readonly logger = new Logger(RoundsService.name);

  constructor(
    private readonly prisma: EnginePrismaService,
    private readonly config: EngineConfigService,
  ) {}

  /**
   * One reconciler step for one game (docs/GAME_ENGINE_V2.md §5 pseudocode,
   * Step 6 slice only). Advances AT MOST one transition per call — the next
   * tick (or the next direct call, in a test) picks up from wherever the
   * database says the round actually is. This is what makes engine restart
   * mid-round a no-op rather than a special case: recovery IS this method,
   * called again.
   */
  async reconcile(gameId: GameId): Promise<void> {
    const round = await this.findLiveRound(gameId);

    if (!round) {
      const created = await this.tryCreateRound(gameId);
      if (created) {
        this.logger.log(`Created round ${created.roundNumber} (${created.displayCode}) for ${gameId}`);
      }
      return;
    }

    if (round.state === RoundState.ROUND_CREATED) {
      const opened = await this.openRound(round.id);
      if (opened) {
        this.logger.log(`Opened round ${round.displayCode} for betting`);
      }
      return;
    }

    if (LOCKABLE_STATES.includes(round.state)) {
      const locked = await this.lockIfDeadlinePassed(round.id);
      if (locked) {
        this.logger.log(`Locked round ${round.displayCode} — betting deadline passed`);
      }
      return;
    }

    // BETTING_LOCKED and beyond: out of Step 6 scope (see class doc comment).
  }

  /** The current live (non-terminal) round for a game, if any. */
  async findLiveRound(gameId: GameId): Promise<GameRound | null> {
    return this.prisma.gameRound.findFirst({
      where: { gameId, state: { notIn: [...TERMINAL_STATES] } },
      orderBy: { roundNumber: 'desc' },
    });
  }

  /**
   * Create the next round for a game, in ROUND_CREATED. Returns null if a
   * concurrent writer already created the live round for this game
   * (benign — the partial unique index or the (game_id, round_number)
   * unique constraint caught it; the next reconcile observes the winner).
   */
  async tryCreateRound(gameId: GameId): Promise<GameRound | null> {
    const roundNumber = await this.nextRoundNumber(gameId);
    const displayCode = generateDisplayCode(gameId, roundNumber);
    const opensAt = new Date();
    const bettingDeadline = new Date(opensAt.getTime() + this.config.roundBettingWindowMs);

    try {
      return await this.prisma.gameRound.create({
        data: {
          gameId,
          roundNumber,
          displayCode,
          state: RoundState.ROUND_CREATED,
          opensAt,
          bettingDeadline,
        },
      });
    } catch (err: unknown) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        this.logger.debug(`Round creation raced for ${gameId} — another writer already created the live round`);
        return null;
      }
      throw err;
    }
  }

  /**
   * ROUND_CREATED → BETTING_OPEN. No deadline gate — the state diagram
   * triggers this "when the engine opens the round", i.e. as soon as the
   * reconciler observes it (docs/GAME_ENGINE_V2.md §2).
   * Returns false if the round was not in ROUND_CREATED (stale/duplicate
   * call — safe no-op).
   */
  async openRound(roundId: string): Promise<boolean> {
    const result = await this.prisma.gameRound.updateMany({
      where: { id: roundId, state: RoundState.ROUND_CREATED },
      data: { state: RoundState.BETTING_OPEN, stateVersion: { increment: 1n } },
    });
    return result.count > 0;
  }

  /**
   * BETTING_OPEN|BETTING_ACTIVE → BETTING_LOCKED, guarded on BOTH the
   * expected prior state AND PostgreSQL's own `now()` — never an
   * application-host clock (ADR-019). Raw SQL is required here because
   * Prisma's query builder has no way to compare a column against the
   * database's `now()`; comparing against a JS `Date.now()` value instead
   * would reintroduce exactly the host-clock trust ADR-019 forbids.
   * Returns false if the round was not lockable yet (wrong prior state,
   * or the deadline hasn't passed) — both are ordinary no-ops for this tick.
   */
  async lockIfDeadlinePassed(roundId: string): Promise<boolean> {
    const affected = await this.prisma.$executeRaw`
      UPDATE game_rounds
         SET state = 'BETTING_LOCKED'::round_state,
             state_version = state_version + 1,
             locked_at = now(),
             updated_at = now()
       WHERE id = ${roundId}::uuid
         AND state IN ('BETTING_OPEN'::round_state, 'BETTING_ACTIVE'::round_state)
         AND betting_deadline <= now()
    `;
    return affected > 0;
  }

  /** Next sequential round_number for a game — MAX+1, defaulting to 1. */
  private async nextRoundNumber(gameId: GameId): Promise<bigint> {
    const result = await this.prisma.gameRound.aggregate({
      where: { gameId },
      _max: { roundNumber: true },
    });
    return (result._max.roundNumber ?? 0n) + 1n;
  }
}
