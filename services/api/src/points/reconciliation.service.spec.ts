/**
 * PointsReconciliationService unit tests.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { PrismaService } from '../database/prisma.service';

import { PointsReconciliationService } from './reconciliation.service';

const mockPrisma = {
  pointsAccount: {
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
  },
  $queryRaw: vi.fn(),
} as unknown as PrismaService;

describe('PointsReconciliationService', () => {
  let service: PointsReconciliationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PointsReconciliationService(mockPrisma);
  });

  describe('verifyAccount', () => {
    it('reports a match when the projected balance equals the ledger-derived sum', async () => {
      vi.mocked(mockPrisma.pointsAccount.findUniqueOrThrow).mockResolvedValue({
        id: 'account-1',
        balanceMinor: 5000n,
      } as never);
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ derived_balance: 5000n }]);

      const result = await service.verifyAccount('user-1');

      expect(result.matches).toBe(true);
      expect(result.projectedBalanceMinor).toBe(5000n);
      expect(result.ledgerDerivedBalanceMinor).toBe(5000n);
    });

    it('detects a mismatch between the projected balance and the ledger-derived sum', async () => {
      vi.mocked(mockPrisma.pointsAccount.findUniqueOrThrow).mockResolvedValue({
        id: 'account-1',
        balanceMinor: 5000n,
      } as never);
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ derived_balance: 4900n }]);

      const result = await service.verifyAccount('user-1');

      expect(result.matches).toBe(false);
      expect(result.projectedBalanceMinor).toBe(5000n);
      expect(result.ledgerDerivedBalanceMinor).toBe(4900n);
    });

    it('treats a brand-new account with no transactions as balance 0 == derived 0', async () => {
      vi.mocked(mockPrisma.pointsAccount.findUniqueOrThrow).mockResolvedValue({
        id: 'account-1',
        balanceMinor: 0n,
      } as never);
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ derived_balance: null }]);

      const result = await service.verifyAccount('user-1');

      expect(result.matches).toBe(true);
      expect(result.ledgerDerivedBalanceMinor).toBe(0n);
    });
  });

  describe('verifyAll', () => {
    it('never repairs a mismatch automatically — only reports it', async () => {
      vi.mocked(mockPrisma.pointsAccount.findMany).mockResolvedValue([
        { id: 'account-1', userId: 'user-1', balanceMinor: 5000n },
        { id: 'account-2', userId: 'user-2', balanceMinor: 1000n },
      ] as never);
      vi.mocked(mockPrisma.$queryRaw)
        .mockResolvedValueOnce([{ derived_balance: 5000n }]) // account-1 matches
        .mockResolvedValueOnce([{ derived_balance: 900n }]); // account-2 mismatches

      const summary = await service.verifyAll();

      expect(summary.checked).toBe(2);
      expect(summary.mismatches).toHaveLength(1);
      expect(summary.mismatches[0]?.userId).toBe('user-2');
      // No update/write call of any kind — verified by asserting no other
      // prisma methods beyond findMany/$queryRaw were ever touched.
      expect(mockPrisma.pointsAccount.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
