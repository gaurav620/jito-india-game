/**
 * RoundSchedulerService — the reconciling tick (docs/GAME_ENGINE_V2.md §5, ADR-019).
 *
 * A tick is NOT a per-round timer. On every interval it re-reads current
 * state from PostgreSQL and advances whatever is due — a crash, deploy, or
 * restart loses nothing, because the next tick simply re-derives what
 * should happen from durable state (RoundsService.reconcile).
 *
 * Single-writer enforcement, layer 2 of 3 (ADR-017): only the Redis leader
 * lock holder acts. Layers 1 (ECS desired-count 1) and 3 (the partial
 * unique index on game_rounds, enforced inside RoundsService) are the other
 * two — this class alone does not guarantee correctness, the three together do.
 */
import { randomUUID } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { SchedulerRegistry } from '@nestjs/schedule'; // DI token — must be value import

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { EngineConfigService } from '../config/engine-config.service'; // DI token — must be value import
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { EngineRedisService } from '../redis/redis.service'; // DI token — must be value import

import { ACTIVE_GAME_IDS } from './active-games';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { RoundsService } from './rounds.service'; // DI token — must be value import

const TICK_INTERVAL_NAME = 'round-scheduler-tick';

@Injectable()
export class RoundSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RoundSchedulerService.name);
  /** Identifies THIS process instance as a lock holder — unique per process lifetime. */
  private readonly holderId = randomUUID();
  private isLeader = false;
  /** Reentrancy guard — a tick that outruns the interval must not overlap itself. */
  private tickInFlight = false;
  /** True once onModuleInit has actually registered the interval — guards onModuleDestroy against tearing down a registration that never happened (e.g. init failed, or never ran). */
  private tickRegistered = false;

  constructor(
    private readonly config: EngineConfigService,
    private readonly redis: EngineRedisService,
    private readonly rounds: RoundsService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const interval = setInterval(() => {
      void this.tick();
    }, this.config.tickIntervalMs);
    this.schedulerRegistry.addInterval(TICK_INTERVAL_NAME, interval);
    this.tickRegistered = true;
    this.logger.log(`Round scheduler tick registered (${this.config.tickIntervalMs}ms interval)`);
  }

  onModuleDestroy(): void {
    if (this.tickRegistered) {
      this.schedulerRegistry.deleteInterval(TICK_INTERVAL_NAME);
      this.tickRegistered = false;
    }
  }

  /**
   * One full reconciler pass across every active game. Exposed (not
   * private) so tests can invoke a single tick deterministically instead of
   * waiting on the real interval — round-lifecycle logic must be testable
   * independently of wall-clock time.
   */
  async tick(): Promise<void> {
    if (this.tickInFlight) {
      this.logger.warn('Previous tick is still running — skipping this interval to avoid overlap');
      return;
    }
    this.tickInFlight = true;
    try {
      const leader = await this.ensureLeader();
      if (!leader) {
        return;
      }

      for (const gameId of ACTIVE_GAME_IDS) {
        try {
          // Reconciled sequentially, deliberately: keeps each game's
          // transition simple to reason about within one tick.
          await this.rounds.reconcile(gameId);
        } catch (err: unknown) {
          this.logger.error(
            `Reconcile failed for ${gameId} — will retry next tick`,
            err instanceof Error ? err.stack : String(err),
          );
        }
      }
    } finally {
      this.tickInFlight = false;
    }
  }

  /**
   * Renew the lock if we believe we already hold it; otherwise attempt to
   * acquire it fresh. Renewing before re-acquiring matters: calling acquire
   * (SET NX) while already holding the key would fail against ourselves.
   *
   * Wrapped in try/catch: EngineRedisService's leader-lock methods propagate
   * ioredis errors uncaught (a deliberate choice there — other callers may
   * want to observe connectivity failures). This method is invoked as
   * `void this.tick()` from a bare setInterval callback with no `.catch()`,
   * so an uncaught rejection here would become an unhandled promise
   * rejection and crash the entire process on a transient Redis error —
   * directly contradicting docs/GAME_ENGINE_V2.md §9 ("Redis unavailable →
   * state transitions continue"). Treating a Redis error as "not leader this
   * tick" is the safe degradation: skip reconciling rather than either
   * crashing or assuming leadership without confirmation. `isLeader` is left
   * untouched on a thrown error (as opposed to a clean `renewed === false`
   * response, which DOES clear it) — an ambiguous network blip should not
   * force a redundant re-acquire once Redis recovers; the next successful
   * renew (or a clean "no longer ours" response) resolves it correctly.
   */
  private async ensureLeader(): Promise<boolean> {
    try {
      if (this.isLeader) {
        const renewed = await this.redis.renewLeaderLock(this.holderId);
        if (renewed) {
          return true;
        }
        this.isLeader = false;
      }

      const acquired = await this.redis.acquireLeaderLock(this.holderId);
      this.isLeader = acquired;
      return acquired;
    } catch (err: unknown) {
      this.logger.error(
        'Leader lock check failed (Redis unavailable?) — skipping this tick',
        err instanceof Error ? err.stack : String(err),
      );
      return false;
    }
  }
}
