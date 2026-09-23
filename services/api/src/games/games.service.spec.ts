/**
 * GamesService unit tests.
 *
 * Mocks Prisma — this service is read-only against a table only
 * services/game-engine ever writes, so no concurrency behaviour of its own
 * needs a real-database test (unlike RoundsService).
 */
import { GameId } from '@jito/types';
import { NotFoundException } from '@nestjs/common';
import { RoundState } from '@prisma/client';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { PrismaService } from '../database/prisma.service';

import { GamesService } from './games.service';

const mockPrisma = {
  gameRound: { findFirst: vi.fn() },
} as unknown as PrismaService;

describe('GamesService', () => {
  let service: GamesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GamesService(mockPrisma);
  });

  it('rejects an unknown gameId with 404 without querying the database', async () => {
    await expect(service.getCurrentRound('not-a-real-game')).rejects.toThrow(NotFoundException);
    expect(mockPrisma.gameRound.findFirst).not.toHaveBeenCalled();
  });

  it('returns 404 when no live round exists yet for a known game', async () => {
    vi.mocked(mockPrisma.gameRound.findFirst).mockResolvedValue(null);

    await expect(service.getCurrentRound(GameId.TripleChanceTimer)).rejects.toThrow(NotFoundException);
    expect(mockPrisma.gameRound.findFirst).toHaveBeenCalledWith({
      where: { gameId: GameId.TripleChanceTimer, state: { notIn: [RoundState.ROUND_COMPLETED, RoundState.ROUND_VOID] } },
      orderBy: { roundNumber: 'desc' },
    });
  });

  it('maps the live round to the documented response shape, with drawValue always null', async () => {
    vi.mocked(mockPrisma.gameRound.findFirst).mockResolvedValue({
      id: 'round-1',
      gameId: GameId.TripleChanceTimer,
      roundNumber: 658n,
      displayCode: 'TC658',
      state: RoundState.BETTING_ACTIVE,
      stateVersion: 2n,
      opensAt: new Date('2026-09-23T10:15:00Z'),
      bettingDeadline: new Date('2026-09-23T10:16:30Z'),
      lockedAt: null,
    } as never);

    const result = await service.getCurrentRound(GameId.TripleChanceTimer);

    expect(result.round).toEqual({
      roundId: 'round-1',
      roundNumber: 658,
      displayCode: 'TC658',
      state: RoundState.BETTING_ACTIVE,
      stateVersion: 2,
      opensAt: '2026-09-23T10:15:00.000Z',
      bettingDeadline: '2026-09-23T10:16:30.000Z',
    });
    expect(result.drawValue).toBeNull();
    expect(new Date(result.serverTime).getTime()).not.toBeNaN();
  });

  it('returns roundNumber and stateVersion as numbers, not strings — matches the documented GameStateSnapshotPayload.round type, and ADR-023 numeric comparison depends on it', async () => {
    vi.mocked(mockPrisma.gameRound.findFirst).mockResolvedValue({
      id: 'round-1',
      gameId: GameId.TripleChanceTimer,
      roundNumber: 658n,
      displayCode: 'TC658',
      state: RoundState.BETTING_ACTIVE,
      stateVersion: 2n,
      opensAt: new Date('2026-09-23T10:15:00Z'),
      bettingDeadline: new Date('2026-09-23T10:16:30Z'),
      lockedAt: null,
    } as never);

    const result = await service.getCurrentRound(GameId.TripleChanceTimer);

    expect(typeof result.round.roundNumber).toBe('number');
    expect(typeof result.round.stateVersion).toBe('number');
  });

  it('does not return lockedAt — not part of the documented GameStateSnapshotPayload.round shape', async () => {
    vi.mocked(mockPrisma.gameRound.findFirst).mockResolvedValue({
      id: 'round-1',
      gameId: GameId.TripleChanceTimer,
      roundNumber: 1n,
      displayCode: 'TC1',
      state: RoundState.BETTING_LOCKED,
      stateVersion: 3n,
      opensAt: new Date('2026-09-23T10:15:00Z'),
      bettingDeadline: new Date('2026-09-23T10:16:30Z'),
      lockedAt: new Date('2026-09-23T10:16:30Z'),
    } as never);

    const result = await service.getCurrentRound(GameId.TripleChanceTimer);

    expect(result.round).not.toHaveProperty('lockedAt');
  });
});
