/**
 * RoundSchedulerService unit tests.
 *
 * Calls `tick()` directly rather than waiting on the real interval — the
 * scheduler's own testability requirement (docs/GAME_ENGINE_V2.md §5:
 * "transition logic is testable independently from real wall-clock time").
 * Leader-lock arbitration across genuinely concurrent processes is a Redis
 * behaviour, not something this unit suite re-proves; EngineRedisService's
 * SET NX PX / Lua renew-release primitives are the actual guarantee and are
 * exercised directly against Redis where they were introduced (Phase 2A).
 */
import { GameId } from '@jito/types';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { EngineConfigService } from '../config/engine-config.service';
import type { EngineRedisService } from '../redis/redis.service';

import { RoundSchedulerService } from './round-scheduler.service';
import type { RoundsService } from './rounds.service';

const mockConfig = { tickIntervalMs: 250 } as unknown as EngineConfigService;

const mockRedis = {
  acquireLeaderLock: vi.fn(),
  renewLeaderLock: vi.fn(),
} as unknown as EngineRedisService;

const mockRounds = {
  reconcile: vi.fn(),
} as unknown as RoundsService;

const mockSchedulerRegistry = {
  addInterval: vi.fn(),
  deleteInterval: vi.fn(),
  doesExist: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe('RoundSchedulerService', () => {
  let service: RoundSchedulerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RoundSchedulerService(mockConfig, mockRedis, mockRounds, mockSchedulerRegistry);
  });

  describe('tick — leader arbitration', () => {
    it('reconciles every active game when it acquires the leader lock', async () => {
      vi.mocked(mockRedis.acquireLeaderLock).mockResolvedValue(true);
      vi.mocked(mockRounds.reconcile).mockResolvedValue(undefined);

      await service.tick();

      expect(mockRounds.reconcile).toHaveBeenCalledWith(GameId.TripleChanceTimer);
      expect(mockRounds.reconcile).toHaveBeenCalledWith(GameId.TripleChanceProTimer);
      expect(mockRounds.reconcile).toHaveBeenCalledTimes(2);
    });

    it('does nothing when it does not hold the leader lock — only one authoritative transition path acts', async () => {
      vi.mocked(mockRedis.acquireLeaderLock).mockResolvedValue(false);

      await service.tick();

      expect(mockRounds.reconcile).not.toHaveBeenCalled();
    });

    it('renews (not re-acquires) the lock on subsequent ticks once already leader', async () => {
      vi.mocked(mockRedis.acquireLeaderLock).mockResolvedValue(true);
      vi.mocked(mockRedis.renewLeaderLock).mockResolvedValue(true);
      vi.mocked(mockRounds.reconcile).mockResolvedValue(undefined);

      await service.tick(); // first tick: acquires
      await service.tick(); // second tick: should renew, not re-acquire

      expect(mockRedis.acquireLeaderLock).toHaveBeenCalledTimes(1);
      expect(mockRedis.renewLeaderLock).toHaveBeenCalledTimes(1);
    });

    it('falls back to acquiring fresh if renewal fails (lock lost — e.g. TTL expired under load)', async () => {
      vi.mocked(mockRedis.acquireLeaderLock).mockResolvedValueOnce(true).mockResolvedValueOnce(true);
      vi.mocked(mockRedis.renewLeaderLock).mockResolvedValue(false);
      vi.mocked(mockRounds.reconcile).mockResolvedValue(undefined);

      await service.tick(); // acquires
      await service.tick(); // renew fails -> re-acquires

      expect(mockRedis.acquireLeaderLock).toHaveBeenCalledTimes(2);
      expect(mockRounds.reconcile).toHaveBeenCalledTimes(4); // 2 games x 2 successful ticks
    });

    it('degrades safely (skips the tick, does not throw) when Redis errors during lock acquisition — must never crash the process via an unhandled rejection', async () => {
      vi.mocked(mockRedis.acquireLeaderLock).mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(service.tick()).resolves.toBeUndefined();

      expect(mockRounds.reconcile).not.toHaveBeenCalled();
    });

    it('degrades safely when Redis errors during lock renewal, and does not force isLeader false on an ambiguous failure', async () => {
      vi.mocked(mockRedis.acquireLeaderLock).mockResolvedValue(true);
      vi.mocked(mockRounds.reconcile).mockResolvedValue(undefined);
      await service.tick(); // becomes leader

      vi.mocked(mockRedis.renewLeaderLock).mockRejectedValue(new Error('read ETIMEDOUT'));
      await expect(service.tick()).resolves.toBeUndefined(); // renew throws -> this tick skips

      // Once Redis recovers, the next tick renews successfully rather than
      // needlessly re-acquiring — proving the ambiguous failure didn't reset isLeader.
      vi.mocked(mockRedis.renewLeaderLock).mockResolvedValue(true);
      await service.tick();

      expect(mockRedis.acquireLeaderLock).toHaveBeenCalledTimes(1);
    });
  });

  describe('tick — reentrancy and isolation', () => {
    it('skips a tick that starts while the previous one is still running', async () => {
      vi.mocked(mockRedis.acquireLeaderLock).mockResolvedValue(true);
      // A short real delay (not a manually-resolved promise) — keeps the
      // first tick genuinely "in flight" across both games without racing
      // the exact microtask ordering of when reconcile() gets invoked.
      vi.mocked(mockRounds.reconcile).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 30)),
      );

      const firstTick = service.tick();
      const secondTick = service.tick(); // fires synchronously — tickInFlight is already true

      await Promise.all([firstTick, secondTick]);

      // Second tick returned immediately without acquiring/reconciling again.
      expect(mockRedis.acquireLeaderLock).toHaveBeenCalledTimes(1);
      expect(mockRounds.reconcile).toHaveBeenCalledTimes(2); // only the first tick's 2 games
    });

    it("one game's reconcile failure does not prevent the other game from being reconciled", async () => {
      vi.mocked(mockRedis.acquireLeaderLock).mockResolvedValue(true);
      vi.mocked(mockRounds.reconcile).mockImplementation((gameId: GameId) => {
        if (gameId === GameId.TripleChanceTimer) {
          return Promise.reject(new Error('db blip'));
        }
        return Promise.resolve();
      });

      await expect(service.tick()).resolves.toBeUndefined();

      expect(mockRounds.reconcile).toHaveBeenCalledWith(GameId.TripleChanceProTimer);
    });
  });

  describe('lifecycle', () => {
    it('registers the interval via SchedulerRegistry on module init', () => {
      service.onModuleInit();

      expect(mockSchedulerRegistry.addInterval).toHaveBeenCalledWith(
        'round-scheduler-tick',
        expect.anything(),
      );

      // Clean up the real interval created by onModuleInit so it doesn't leak past this test.
      service.onModuleDestroy();
    });

    it('tears down the interval it registered on module destroy', () => {
      service.onModuleInit();
      service.onModuleDestroy();

      expect(mockSchedulerRegistry.deleteInterval).toHaveBeenCalledWith('round-scheduler-tick');
    });

    it('does nothing on module destroy if init never ran (defensive — must not crash)', () => {
      expect(() => service.onModuleDestroy()).not.toThrow();
      expect(mockSchedulerRegistry.deleteInterval).not.toHaveBeenCalled();
    });
  });
});
