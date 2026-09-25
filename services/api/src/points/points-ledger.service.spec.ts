/**
 * PointsLedgerService unit tests.
 *
 * Mocks Prisma entirely — concurrency/idempotency behaviour against REAL
 * PostgreSQL row locking is covered separately by points.integration.spec.ts
 * (docs/PHASE_2_IMPLEMENTATION_PLAN.md Step 5: "mocks alone are NOT
 * sufficient for concurrency correctness").
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { PrismaService } from '../database/prisma.service';

import {
  IdempotencyKeyReusedException,
  InsufficientPointsException,
  PointsLedgerService,
} from './points-ledger.service';

const mockTx = {
  $queryRaw: vi.fn(),
  pointsTransaction: { create: vi.fn(), findUnique: vi.fn() },
  pointsAccount: { update: vi.fn() },
};

const mockPrisma = {
  $transaction: vi.fn(),
  pointsTransaction: { findUnique: vi.fn() },
} as unknown as PrismaService;

const BASE_PARAMS = {
  userId: 'user-1',
  direction: 'debit' as const,
  amountMinor: 1000n,
  referenceType: 'admin_debit' as const,
  referenceId: 'admin-log-1',
  idempotencyKey: 'adj:admin-1:key-1',
  description: 'test adjustment',
};

describe('PointsLedgerService', () => {
  let service: PointsLedgerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PointsLedgerService(mockPrisma);
    // Default: run the transaction callback against mockTx.
    vi.mocked(mockPrisma.$transaction).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((fn: any) => fn(mockTx)) as never,
    );
  });

  describe('mutateWithinTransaction', () => {
    it('locks the account row via FOR UPDATE, debits, and updates the projection', async () => {
      mockTx.$queryRaw.mockResolvedValue([{ id: 'account-1', balance_minor: 5000n }]);
      mockTx.pointsTransaction.create.mockResolvedValue({
        id: 'txn-1',
        direction: 'debit',
        amountMinor: 1000n,
        balanceBeforeMinor: 5000n,
        balanceAfterMinor: 4000n,
        referenceType: 'admin_debit',
        referenceId: 'admin-log-1',
        idempotencyKey: BASE_PARAMS.idempotencyKey,
        description: 'test adjustment',
        createdAt: new Date(),
      });
      mockTx.pointsAccount.update.mockResolvedValue({});

      const result = await service.mutateWithinTransaction(mockTx as never, BASE_PARAMS);

      // FOR UPDATE lock was taken.
      const [sql] = mockTx.$queryRaw.mock.calls[0] as [TemplateStringsArray];
      expect(sql.join('')).toContain('FOR UPDATE');

      expect(mockTx.pointsTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'account-1',
          direction: 'debit',
          amountMinor: 1000n,
          balanceBeforeMinor: 5000n,
          balanceAfterMinor: 4000n,
        }),
      });
      expect(mockTx.pointsAccount.update).toHaveBeenCalledWith({
        where: { id: 'account-1' },
        data: { balanceMinor: 4000n, version: { increment: 1n } },
      });
      expect(result.balanceAfterMinor).toBe(4000n);
      expect(result.replayed).toBe(false);
    });

    it('rejects a debit that would drive the balance negative — no writes occur', async () => {
      mockTx.$queryRaw.mockResolvedValue([{ id: 'account-1', balance_minor: 500n }]);

      await expect(
        service.mutateWithinTransaction(mockTx as never, { ...BASE_PARAMS, amountMinor: 1000n }),
      ).rejects.toThrow(InsufficientPointsException);

      expect(mockTx.pointsTransaction.create).not.toHaveBeenCalled();
      expect(mockTx.pointsAccount.update).not.toHaveBeenCalled();
    });

    it('allows a credit regardless of current balance', async () => {
      mockTx.$queryRaw.mockResolvedValue([{ id: 'account-1', balance_minor: 0n }]);
      mockTx.pointsTransaction.create.mockResolvedValue({
        id: 'txn-2',
        direction: 'credit',
        amountMinor: 500n,
        balanceBeforeMinor: 0n,
        balanceAfterMinor: 500n,
        referenceType: 'admin_credit',
        referenceId: 'admin-log-2',
        idempotencyKey: 'adj:admin-1:key-2',
        description: null,
        createdAt: new Date(),
      });

      const result = await service.mutateWithinTransaction(mockTx as never, {
        ...BASE_PARAMS,
        direction: 'credit',
        amountMinor: 500n,
        idempotencyKey: 'adj:admin-1:key-2',
      });

      expect(result.balanceAfterMinor).toBe(500n);
    });

    it('throws when the account row does not exist (programming error, not user-facing)', async () => {
      mockTx.$queryRaw.mockResolvedValue([]);

      await expect(service.mutateWithinTransaction(mockTx as never, BASE_PARAMS)).rejects.toThrow(
        /no points_accounts row/,
      );
    });

    it('rejects a non-positive amount', async () => {
      await expect(
        service.mutateWithinTransaction(mockTx as never, { ...BASE_PARAMS, amountMinor: 0n }),
      ).rejects.toThrow(/must be > 0/);
    });
  });

  describe('lockAndValidateAccount + commitMutation — the split composition BetsService uses', () => {
    it('lockAndValidateAccount locks the row and returns a token WITHOUT writing anything', async () => {
      mockTx.$queryRaw.mockResolvedValue([{ id: 'account-1', balance_minor: 5000n }]);

      const locked = await service.lockAndValidateAccount(mockTx as never, BASE_PARAMS);

      const [sql] = mockTx.$queryRaw.mock.calls[0] as [TemplateStringsArray];
      expect(sql.join('')).toContain('FOR UPDATE');
      expect(mockTx.pointsTransaction.create).not.toHaveBeenCalled();
      expect(mockTx.pointsAccount.update).not.toHaveBeenCalled();
      expect(locked).toEqual({
        accountId: 'account-1',
        direction: 'debit',
        amountMinor: 1000n,
        balanceBeforeMinor: 5000n,
        balanceAfterMinor: 4000n,
      });
    });

    it('lockAndValidateAccount rejects an overdrawing debit without writing anything', async () => {
      mockTx.$queryRaw.mockResolvedValue([{ id: 'account-1', balance_minor: 500n }]);

      await expect(
        service.lockAndValidateAccount(mockTx as never, { ...BASE_PARAMS, amountMinor: 1000n }),
      ).rejects.toThrow(InsufficientPointsException);
      expect(mockTx.pointsTransaction.create).not.toHaveBeenCalled();
      expect(mockTx.pointsAccount.update).not.toHaveBeenCalled();
    });

    it('commitMutation writes the ledger row and updates the balance from a previously-locked token, allowing the caller to have written OTHER rows in between', async () => {
      mockTx.pointsTransaction.create.mockResolvedValue({
        id: 'txn-1',
        direction: 'debit',
        amountMinor: 1000n,
        balanceBeforeMinor: 5000n,
        balanceAfterMinor: 4000n,
        referenceType: 'bet_placed',
        referenceId: 'bet-1',
        idempotencyKey: 'bet-debit:bet-1',
        description: null,
        createdAt: new Date(),
      });

      const locked = {
        accountId: 'account-1',
        direction: 'debit' as const,
        amountMinor: 1000n,
        balanceBeforeMinor: 5000n,
        balanceAfterMinor: 4000n,
      };

      const result = await service.commitMutation(mockTx as never, locked, {
        referenceType: 'bet_placed',
        referenceId: 'bet-1',
        idempotencyKey: 'bet-debit:bet-1',
      });

      expect(mockTx.pointsTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'account-1',
          direction: 'debit',
          amountMinor: 1000n,
          balanceBeforeMinor: 5000n,
          balanceAfterMinor: 4000n,
          referenceType: 'bet_placed',
          referenceId: 'bet-1',
          idempotencyKey: 'bet-debit:bet-1',
        }),
      });
      expect(mockTx.pointsAccount.update).toHaveBeenCalledWith({
        where: { id: 'account-1' },
        data: { balanceMinor: 4000n, version: { increment: 1n } },
      });
      expect(result.balanceAfterMinor).toBe(4000n);
      expect(result.replayed).toBe(false);
    });

    it('mutateWithinTransaction composed from the two steps produces the IDENTICAL result as before the split (behaviour-preserving)', async () => {
      mockTx.$queryRaw.mockResolvedValue([{ id: 'account-1', balance_minor: 5000n }]);
      mockTx.pointsTransaction.create.mockResolvedValue({
        id: 'txn-1',
        direction: 'debit',
        amountMinor: 1000n,
        balanceBeforeMinor: 5000n,
        balanceAfterMinor: 4000n,
        referenceType: 'admin_debit',
        referenceId: 'admin-log-1',
        idempotencyKey: BASE_PARAMS.idempotencyKey,
        description: 'test adjustment',
        createdAt: new Date(),
      });

      const result = await service.mutateWithinTransaction(mockTx as never, BASE_PARAMS);

      expect(result.balanceAfterMinor).toBe(4000n);
      expect(result.replayed).toBe(false);
      // Exactly the same lock -> insert -> update sequence as before the split.
      expect(mockTx.$queryRaw).toHaveBeenCalledTimes(1);
      expect(mockTx.pointsTransaction.create).toHaveBeenCalledTimes(1);
      expect(mockTx.pointsAccount.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('applyMutation — idempotency', () => {
    it('pre-check finds an existing matching row — returns it WITHOUT opening a transaction', async () => {
      const existing = {
        id: 'txn-1',
        direction: 'debit',
        amountMinor: 1000n,
        balanceBeforeMinor: 5000n,
        balanceAfterMinor: 4000n,
        referenceType: 'admin_debit',
        referenceId: 'admin-log-1',
        idempotencyKey: BASE_PARAMS.idempotencyKey,
        description: 'test adjustment',
        createdAt: new Date(),
        account: { userId: BASE_PARAMS.userId },
      };
      vi.mocked(mockPrisma.pointsTransaction.findUnique).mockResolvedValue(existing as never);

      const result = await service.applyMutation(BASE_PARAMS);

      expect(result.replayed).toBe(true);
      expect(result.transactionId).toBe('txn-1');
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('pre-check finds a MISMATCHED row for the same key — rejects 409, no transaction opened', async () => {
      const existing = {
        id: 'txn-1',
        direction: 'debit',
        amountMinor: 9999n, // different amount — same key, different intent
        balanceBeforeMinor: 5000n,
        balanceAfterMinor: -4999n,
        referenceType: 'admin_debit',
        referenceId: 'admin-log-1',
        idempotencyKey: BASE_PARAMS.idempotencyKey,
        description: 'test adjustment',
        createdAt: new Date(),
        account: { userId: BASE_PARAMS.userId },
      };
      vi.mocked(mockPrisma.pointsTransaction.findUnique).mockResolvedValue(existing as never);

      await expect(service.applyMutation(BASE_PARAMS)).rejects.toThrow(IdempotencyKeyReusedException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('pre-check finds a row owned by a DIFFERENT user — rejects 409, no transaction opened', async () => {
      // Same key, same direction/amount/referenceType/referenceId — but the
      // existing row belongs to a different account. UNIQUE(idempotency_key)
      // is global, not scoped per-user, so this is the exact scenario the
      // ownership check exists to catch.
      const existing = {
        id: 'txn-1',
        direction: BASE_PARAMS.direction,
        amountMinor: BASE_PARAMS.amountMinor,
        balanceBeforeMinor: 5000n,
        balanceAfterMinor: 4000n,
        referenceType: BASE_PARAMS.referenceType,
        referenceId: BASE_PARAMS.referenceId,
        idempotencyKey: BASE_PARAMS.idempotencyKey,
        description: BASE_PARAMS.description,
        createdAt: new Date(),
        account: { userId: 'some-other-user' },
      };
      vi.mocked(mockPrisma.pointsTransaction.findUnique).mockResolvedValue(existing as never);

      await expect(service.applyMutation(BASE_PARAMS)).rejects.toThrow(IdempotencyKeyReusedException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('two DIFFERENT idempotency keys produce two independent mutations', async () => {
      vi.mocked(mockPrisma.pointsTransaction.findUnique).mockResolvedValue(null);
      mockTx.$queryRaw.mockResolvedValue([{ id: 'account-1', balance_minor: 5000n }]);
      mockTx.pointsTransaction.create
        .mockResolvedValueOnce({
          id: 'txn-a',
          direction: 'debit',
          amountMinor: 100n,
          balanceBeforeMinor: 5000n,
          balanceAfterMinor: 4900n,
          referenceType: 'admin_debit',
          referenceId: 'admin-log-1',
          idempotencyKey: 'key-a',
          description: null,
          createdAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'txn-b',
          direction: 'debit',
          amountMinor: 100n,
          balanceBeforeMinor: 4900n,
          balanceAfterMinor: 4800n,
          referenceType: 'admin_debit',
          referenceId: 'admin-log-2',
          idempotencyKey: 'key-b',
          description: null,
          createdAt: new Date(),
        });

      const resultA = await service.applyMutation({ ...BASE_PARAMS, amountMinor: 100n, idempotencyKey: 'key-a' });
      const resultB = await service.applyMutation({ ...BASE_PARAMS, amountMinor: 100n, idempotencyKey: 'key-b' });

      expect(resultA.transactionId).toBe('txn-a');
      expect(resultB.transactionId).toBe('txn-b');
      expect(mockTx.pointsTransaction.create).toHaveBeenCalledTimes(2);
    });
  });
});
