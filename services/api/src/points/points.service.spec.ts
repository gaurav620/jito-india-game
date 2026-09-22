/**
 * PointsService unit tests — read-only balance and transaction listing.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { PrismaService } from '../database/prisma.service';

import { PointsService } from './points.service';

const mockPrisma = {
  pointsAccount: {
    findUniqueOrThrow: vi.fn(),
  },
  pointsTransaction: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
} as unknown as PrismaService;

describe('PointsService', () => {
  let service: PointsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PointsService(mockPrisma);
  });

  describe('getBalance', () => {
    it('returns the balance for the authenticated user, serialized as a safe number', async () => {
      vi.mocked(mockPrisma.pointsAccount.findUniqueOrThrow).mockResolvedValue({
        balanceMinor: 6470700n,
        updatedAt: new Date('2026-09-09T10:15:00Z'),
      } as never);

      const result = await service.getBalance('user-1');

      expect(mockPrisma.pointsAccount.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { balanceMinor: true, updatedAt: true },
      });
      expect(result.balanceMinor).toBe(6470700);
      expect(typeof result.balanceMinor).toBe('number');
    });
  });

  describe('listTransactions', () => {
    it('scopes the query to the authenticated user\'s own account only', async () => {
      vi.mocked(mockPrisma.pointsAccount.findUniqueOrThrow).mockResolvedValue({
        id: 'account-1',
      } as never);
      vi.mocked(mockPrisma.$transaction).mockResolvedValue([[], 0]);

      await service.listTransactions('user-1', {});

      // The account is resolved from the AUTHENTICATED userId — there is no
      // code path here that accepts an arbitrary accountId from the caller.
      expect(mockPrisma.pointsAccount.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { id: true },
      });
    });

    it('applies pagination defaults (page=1, limit=20) and computes totalPages', async () => {
      vi.mocked(mockPrisma.pointsAccount.findUniqueOrThrow).mockResolvedValue({ id: 'account-1' } as never);
      vi.mocked(mockPrisma.$transaction).mockResolvedValue([[], 45]);

      const result = await service.listTransactions('user-1', {});

      expect(result.meta).toEqual({ page: 1, limit: 20, total: 45, totalPages: 3 });
    });

    it('filters by referenceType and date range when provided', async () => {
      vi.mocked(mockPrisma.pointsAccount.findUniqueOrThrow).mockResolvedValue({ id: 'account-1' } as never);
      vi.mocked(mockPrisma.$transaction).mockResolvedValue([[], 0]);

      await service.listTransactions('user-1', {
        referenceType: 'admin_credit' as never,
        from: '2026-09-01T00:00:00.000Z',
        to: '2026-09-09T23:59:59.000Z',
        page: 2,
        limit: 10,
      });

      // Inspect the actual `where` clause built for pointsTransaction.findMany
      // — proves the filters are genuinely applied, not just that a call
      // happened. (findMany/count are mocks — $transaction([...]) receives
      // whatever THEY return, so the arguments must be asserted at the
      // findMany/count mocks directly, not on $transaction's array.)
      const [findManyArgs] = vi.mocked(mockPrisma.pointsTransaction.findMany).mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(findManyArgs.where).toMatchObject({
        accountId: 'account-1',
        referenceType: 'admin_credit',
        createdAt: {
          gte: new Date('2026-09-01T00:00:00.000Z'),
          lte: new Date('2026-09-09T23:59:59.000Z'),
        },
      });
    });

    it('converts BIGINT ledger fields to safe numbers in the response', async () => {
      vi.mocked(mockPrisma.pointsAccount.findUniqueOrThrow).mockResolvedValue({ id: 'account-1' } as never);
      vi.mocked(mockPrisma.$transaction).mockResolvedValue([
        [
          {
            id: 'txn-1',
            direction: 'admin_credit',
            amountMinor: 500000n,
            balanceBeforeMinor: 0n,
            balanceAfterMinor: 500000n,
            referenceType: 'admin_credit',
            referenceId: 'log-1',
            description: 'Opening balance',
            createdAt: new Date(),
          },
        ],
        1,
      ]);

      const result = await service.listTransactions('user-1', {});

      expect(result.data[0]?.amountMinor).toBe(500000);
      expect(typeof result.data[0]?.amountMinor).toBe('number');
    });
  });
});
