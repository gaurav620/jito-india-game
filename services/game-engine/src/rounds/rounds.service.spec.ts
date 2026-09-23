/**
 * RoundsService unit tests.
 *
 * Mocks Prisma entirely — concurrency/atomicity guarantees against REAL
 * PostgreSQL row/constraint behaviour are covered separately by
 * rounds.integration.spec.ts (same "mocks alone are NOT sufficient for
 * concurrency correctness" principle established in Phase 2C, points.integration.spec.ts).
 */
import { GameId } from '@jito/types';
import { RoundState } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { EngineConfigService } from '../config/engine-config.service';
import type { EnginePrismaService } from '../database/prisma.service';

import { RoundsService } from './rounds.service';

const mockPrisma = {
  gameRound: {
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    aggregate: vi.fn(),
  },
  $executeRaw: vi.fn(),
} as unknown as EnginePrismaService;

const mockConfig = {
  roundBettingWindowMs: 30000,
} as unknown as EngineConfigService;

function makeRound(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'round-1',
    gameId: GameId.TripleChanceTimer,
    roundNumber: 5n,
    displayCode: 'TC5',
    state: RoundState.BETTING_OPEN,
    stateVersion: 1n,
    opensAt: new Date('2026-09-23T00:00:00Z'),
    bettingDeadline: new Date('2026-09-23T00:00:30Z'),
    lockedAt: null,
    resultPublishedAt: null,
    settledAt: null,
    completedAt: null,
    createdAt: new Date('2026-09-23T00:00:00Z'),
    updatedAt: new Date('2026-09-23T00:00:00Z'),
    ...overrides,
  };
}

describe('RoundsService', () => {
  let service: RoundsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RoundsService(mockPrisma, mockConfig);
  });

  describe('tryCreateRound', () => {
    it('creates a round in ROUND_CREATED, stamping opensAt/bettingDeadline from config', async () => {
      vi.mocked(mockPrisma.gameRound.aggregate).mockResolvedValue({ _max: { roundNumber: 3n } } as never);
      vi.mocked(mockPrisma.gameRound.create).mockResolvedValue(makeRound({ roundNumber: 4n, displayCode: 'TC4' }) as never);

      const result = await service.tryCreateRound(GameId.TripleChanceTimer);

      expect(mockPrisma.gameRound.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          gameId: GameId.TripleChanceTimer,
          roundNumber: 4n,
          displayCode: 'TC4',
          state: RoundState.ROUND_CREATED,
        }),
      });
      const call = vi.mocked(mockPrisma.gameRound.create).mock.calls[0]?.[0] as {
        data: { opensAt: Date; bettingDeadline: Date };
      };
      expect(call.data.bettingDeadline.getTime() - call.data.opensAt.getTime()).toBe(30000);
      expect(result?.roundNumber).toBe(4n);
    });

    it('starts round numbering at 1 when no prior round exists for the game', async () => {
      vi.mocked(mockPrisma.gameRound.aggregate).mockResolvedValue({ _max: { roundNumber: null } } as never);
      vi.mocked(mockPrisma.gameRound.create).mockResolvedValue(makeRound({ roundNumber: 1n }) as never);

      await service.tryCreateRound(GameId.TripleChanceTimer);

      expect(mockPrisma.gameRound.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ roundNumber: 1n }),
      });
    });

    it('returns null (not an error) when creation races a unique constraint (P2002)', async () => {
      vi.mocked(mockPrisma.gameRound.aggregate).mockResolvedValue({ _max: { roundNumber: 0n } } as never);
      vi.mocked(mockPrisma.gameRound.create).mockRejectedValue(
        new PrismaClientKnownRequestError('unique violation', { code: 'P2002', clientVersion: '5.22.0' }),
      );

      const result = await service.tryCreateRound(GameId.TripleChanceTimer);

      expect(result).toBeNull();
    });

    it('re-throws an unrelated database error rather than swallowing it', async () => {
      vi.mocked(mockPrisma.gameRound.aggregate).mockResolvedValue({ _max: { roundNumber: 0n } } as never);
      vi.mocked(mockPrisma.gameRound.create).mockRejectedValue(new Error('connection reset'));

      await expect(service.tryCreateRound(GameId.TripleChanceTimer)).rejects.toThrow('connection reset');
    });
  });

  describe('openRound', () => {
    it('transitions ROUND_CREATED -> BETTING_OPEN, incrementing stateVersion', async () => {
      vi.mocked(mockPrisma.gameRound.updateMany).mockResolvedValue({ count: 1 });

      const result = await service.openRound('round-1');

      expect(mockPrisma.gameRound.updateMany).toHaveBeenCalledWith({
        where: { id: 'round-1', state: RoundState.ROUND_CREATED },
        data: { state: RoundState.BETTING_OPEN, stateVersion: { increment: 1n } },
      });
      expect(result).toBe(true);
    });

    it('is a no-op (returns false) when the round is not in ROUND_CREATED — invalid/stale transition rejected', async () => {
      vi.mocked(mockPrisma.gameRound.updateMany).mockResolvedValue({ count: 0 });

      const result = await service.openRound('round-1');

      expect(result).toBe(false);
    });
  });

  describe('lockIfDeadlinePassed', () => {
    it('locks via a single guarded raw UPDATE gated on state AND the database clock', async () => {
      vi.mocked(mockPrisma.$executeRaw).mockResolvedValue(1);

      const result = await service.lockIfDeadlinePassed('round-1');

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
      const [sql] = vi.mocked(mockPrisma.$executeRaw).mock.calls[0] as [TemplateStringsArray];
      const text = sql.join('');
      expect(text).toContain("SET state = 'BETTING_LOCKED'::round_state");
      expect(text).toContain('state_version = state_version + 1');
      expect(text).toContain("state IN ('BETTING_OPEN'::round_state, 'BETTING_ACTIVE'::round_state)");
      expect(text).toContain('betting_deadline <= now()');
      expect(result).toBe(true);
    });

    it('returns false when zero rows matched (wrong state, or deadline not yet passed)', async () => {
      vi.mocked(mockPrisma.$executeRaw).mockResolvedValue(0);

      const result = await service.lockIfDeadlinePassed('round-1');

      expect(result).toBe(false);
    });
  });

  describe('reconcile', () => {
    it('creates a round when none is live for the game', async () => {
      vi.mocked(mockPrisma.gameRound.findFirst).mockResolvedValue(null);
      vi.mocked(mockPrisma.gameRound.aggregate).mockResolvedValue({ _max: { roundNumber: 0n } } as never);
      vi.mocked(mockPrisma.gameRound.create).mockResolvedValue(makeRound({ state: RoundState.ROUND_CREATED }) as never);

      await service.reconcile(GameId.TripleChanceTimer);

      expect(mockPrisma.gameRound.findFirst).toHaveBeenCalledWith({
        where: { gameId: GameId.TripleChanceTimer, state: { notIn: [RoundState.ROUND_COMPLETED, RoundState.ROUND_VOID] } },
        orderBy: { roundNumber: 'desc' },
      });
      expect(mockPrisma.gameRound.create).toHaveBeenCalledTimes(1);
      // Only ONE transition per reconcile call — open is NOT also attempted this same call.
      expect(mockPrisma.gameRound.updateMany).not.toHaveBeenCalled();
    });

    it('opens a round stuck in ROUND_CREATED — this is exactly the restart-recovery path', async () => {
      vi.mocked(mockPrisma.gameRound.findFirst).mockResolvedValue(makeRound({ state: RoundState.ROUND_CREATED }) as never);
      vi.mocked(mockPrisma.gameRound.updateMany).mockResolvedValue({ count: 1 });

      await service.reconcile(GameId.TripleChanceTimer);

      expect(mockPrisma.gameRound.updateMany).toHaveBeenCalledWith({
        where: { id: 'round-1', state: RoundState.ROUND_CREATED },
        data: { state: RoundState.BETTING_OPEN, stateVersion: { increment: 1n } },
      });
      expect(mockPrisma.gameRound.create).not.toHaveBeenCalled();
      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
    });

    it('attempts to lock a BETTING_OPEN round (deadline check happens inside the guarded UPDATE)', async () => {
      vi.mocked(mockPrisma.gameRound.findFirst).mockResolvedValue(makeRound({ state: RoundState.BETTING_OPEN }) as never);
      vi.mocked(mockPrisma.$executeRaw).mockResolvedValue(1);

      await service.reconcile(GameId.TripleChanceTimer);

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('attempts to lock a BETTING_ACTIVE round too (both open sub-states are lockable)', async () => {
      vi.mocked(mockPrisma.gameRound.findFirst).mockResolvedValue(makeRound({ state: RoundState.BETTING_ACTIVE }) as never);
      vi.mocked(mockPrisma.$executeRaw).mockResolvedValue(1);

      await service.reconcile(GameId.TripleChanceTimer);

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('does nothing for a round already in BETTING_LOCKED — out of Step 6 scope, no points/result code invoked', async () => {
      vi.mocked(mockPrisma.gameRound.findFirst).mockResolvedValue(makeRound({ state: RoundState.BETTING_LOCKED }) as never);

      await service.reconcile(GameId.TripleChanceTimer);

      expect(mockPrisma.gameRound.create).not.toHaveBeenCalled();
      expect(mockPrisma.gameRound.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
    });

    it('does nothing for a round in RESULT_PENDING or later — Step 6 never touches post-lock states', async () => {
      vi.mocked(mockPrisma.gameRound.findFirst).mockResolvedValue(makeRound({ state: RoundState.RESULT_PENDING }) as never);

      await service.reconcile(GameId.TripleChanceTimer);

      expect(mockPrisma.gameRound.create).not.toHaveBeenCalled();
      expect(mockPrisma.gameRound.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
    });
  });
});
