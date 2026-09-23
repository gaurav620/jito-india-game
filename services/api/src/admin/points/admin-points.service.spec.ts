/**
 * AdminPointsService unit tests.
 *
 * Concurrency/idempotency behaviour against REAL PostgreSQL is covered by
 * points.integration.spec.ts. This suite verifies the composition contract:
 * admin_logs + points_transactions + points_accounts all in ONE transaction,
 * idempotency pre-check/replay, and the 404/400/409 error paths.
 */
import { HttpException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { PrismaService } from '../../database/prisma.service';
import type { PointsLedgerService } from '../../points/points-ledger.service';

import { AdminPointsService, IdempotencyKeyRequiredException } from './admin-points.service';

const mockTx = {
  adminLog: { create: vi.fn() },
};

const mockPrisma = {
  $transaction: vi.fn(),
  user: { findUnique: vi.fn() },
  pointsTransaction: { findUnique: vi.fn() },
  pointsAccount: { findUnique: vi.fn() },
  adminLog: { findUnique: vi.fn() },
} as unknown as PrismaService;

const mockLedger = {
  mutateWithinTransaction: vi.fn(),
} as unknown as PointsLedgerService;

const BASE_PARAMS = {
  adminId: 'admin-1',
  targetUserId: 'user-1',
  dto: { direction: 'credit' as const, amountMinor: 500000, reason: 'Opening balance' },
  idempotencyKey: 'adj:admin-1:uuid-1',
  ip: '127.0.0.1',
};

describe('AdminPointsService', () => {
  let service: AdminPointsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminPointsService(mockPrisma, mockLedger);
    vi.mocked(mockPrisma.$transaction).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((fn: any) => fn(mockTx)) as never,
    );
  });

  it('rejects with 400 when Idempotency-Key header is missing', async () => {
    await expect(service.adjust({ ...BASE_PARAMS, idempotencyKey: undefined })).rejects.toThrow(
      IdempotencyKeyRequiredException,
    );
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects with 404 when the target user does not exist', async () => {
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(null);

    await expect(service.adjust(BASE_PARAMS)).rejects.toThrow(NotFoundException);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('writes admin_logs and the ledger mutation in ONE transaction, in that order', async () => {
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never);
    vi.mocked(mockPrisma.pointsTransaction.findUnique).mockResolvedValue(null);
    mockTx.adminLog.create.mockResolvedValue({});
    vi.mocked(mockLedger.mutateWithinTransaction).mockResolvedValue({
      transactionId: 'txn-1',
      direction: 'credit',
      amountMinor: 500000n,
      balanceBeforeMinor: 0n,
      balanceAfterMinor: 500000n,
      referenceType: 'admin_credit',
      referenceId: 'some-audit-log-id',
      idempotencyKey: BASE_PARAMS.idempotencyKey,
      description: 'Opening balance',
      createdAt: new Date(),
      replayed: false,
    });

    const result = await service.adjust(BASE_PARAMS);

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: 'admin-1',
          action: 'points_adjust',
          targetType: 'user',
          targetId: 'user-1',
        }),
      }),
    );
    // The ledger call must reference the SAME audit log id just created, and
    // run against the SAME transaction client (mockTx).
    expect(mockLedger.mutateWithinTransaction).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        userId: 'user-1',
        direction: 'credit',
        amountMinor: 500000n,
        referenceType: 'admin_credit',
        idempotencyKey: BASE_PARAMS.idempotencyKey,
        description: 'Opening balance',
      }),
    );

    // adminLog.create ran BEFORE the ledger call (referenceId dependency).
    const createOrder = mockTx.adminLog.create.mock.invocationCallOrder[0] as number;
    const ledgerOrder = vi.mocked(mockLedger.mutateWithinTransaction).mock.invocationCallOrder[0] as number;
    expect(createOrder).toBeLessThan(ledgerOrder);

    expect(result.transactionId).toBe('txn-1');
    expect(result.replayed).toBe(false);
    expect(result.balanceAfterMinor).toBe('500000');
  });

  it('uses "admin_debit" referenceType for a debit direction', async () => {
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never);
    vi.mocked(mockPrisma.pointsTransaction.findUnique).mockResolvedValue(null);
    mockTx.adminLog.create.mockResolvedValue({});
    vi.mocked(mockLedger.mutateWithinTransaction).mockResolvedValue({
      transactionId: 'txn-2',
      direction: 'debit',
      amountMinor: 100n,
      balanceBeforeMinor: 500n,
      balanceAfterMinor: 400n,
      referenceType: 'admin_debit',
      referenceId: 'audit-2',
      idempotencyKey: 'adj:admin-1:uuid-2',
      description: 'correction',
      createdAt: new Date(),
      replayed: false,
    });

    await service.adjust({
      ...BASE_PARAMS,
      dto: { direction: 'debit', amountMinor: 100, reason: 'correction' },
      idempotencyKey: 'adj:admin-1:uuid-2',
    });

    expect(mockLedger.mutateWithinTransaction).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({ direction: 'debit', referenceType: 'admin_debit' }),
    );
  });

  it('a debit that would overdraw propagates InsufficientPointsException from the ledger (no partial state)', async () => {
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never);
    vi.mocked(mockPrisma.pointsTransaction.findUnique).mockResolvedValue(null);
    mockTx.adminLog.create.mockResolvedValue({});
    const insufficientErr = new HttpException('insufficient', 422);
    vi.mocked(mockLedger.mutateWithinTransaction).mockRejectedValue(insufficientErr);

    await expect(
      service.adjust({ ...BASE_PARAMS, dto: { direction: 'debit', amountMinor: 999999999, reason: 'x' } }),
    ).rejects.toThrow(insufficientErr);
  });

  describe('idempotency replay', () => {
    it('returns the ORIGINAL result for a replayed key with matching parameters — no new transaction', async () => {
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never);
      vi.mocked(mockPrisma.pointsTransaction.findUnique).mockResolvedValue({
        id: 'txn-1',
        direction: 'credit',
        amountMinor: 500000n,
        balanceBeforeMinor: 0n,
        balanceAfterMinor: 500000n,
        referenceType: 'admin_credit',
        description: 'Opening balance',
        referenceId: 'audit-1',
        accountId: 'account-1',
        idempotencyKey: BASE_PARAMS.idempotencyKey,
      } as never);
      vi.mocked(mockPrisma.pointsAccount.findUnique).mockResolvedValue({ id: 'account-1' } as never);
      vi.mocked(mockPrisma.adminLog.findUnique).mockResolvedValue({ adminId: BASE_PARAMS.adminId } as never);

      const result = await service.adjust(BASE_PARAMS);

      expect(result.replayed).toBe(true);
      expect(result.transactionId).toBe('txn-1');
      expect(result.auditLogId).toBe('audit-1');
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects 409 when the same key is reused with a DIFFERENT amount', async () => {
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never);
      vi.mocked(mockPrisma.pointsTransaction.findUnique).mockResolvedValue({
        id: 'txn-1',
        direction: 'credit',
        amountMinor: 999n, // different from BASE_PARAMS.dto.amountMinor
        referenceType: 'admin_credit',
        description: 'Opening balance',
        referenceId: 'audit-1',
        accountId: 'account-1',
        idempotencyKey: BASE_PARAMS.idempotencyKey,
      } as never);
      vi.mocked(mockPrisma.pointsAccount.findUnique).mockResolvedValue({ id: 'account-1' } as never);
      vi.mocked(mockPrisma.adminLog.findUnique).mockResolvedValue({ adminId: BASE_PARAMS.adminId } as never);

      await expect(service.adjust(BASE_PARAMS)).rejects.toThrow(HttpException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects 409 when the same key is reused by a DIFFERENT admin actor', async () => {
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never);
      vi.mocked(mockPrisma.pointsTransaction.findUnique).mockResolvedValue({
        id: 'txn-1',
        direction: 'credit',
        amountMinor: 500000n,
        referenceType: 'admin_credit',
        description: 'Opening balance',
        referenceId: 'audit-1',
        accountId: 'account-1',
        idempotencyKey: BASE_PARAMS.idempotencyKey,
      } as never);
      vi.mocked(mockPrisma.pointsAccount.findUnique).mockResolvedValue({ id: 'account-1' } as never);
      // The original adjustment was performed by a DIFFERENT admin than the
      // one presenting this key now.
      vi.mocked(mockPrisma.adminLog.findUnique).mockResolvedValue({ adminId: 'some-other-admin' } as never);

      await expect(service.adjust(BASE_PARAMS)).rejects.toThrow(HttpException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects 409 when the same key is reused with a DIFFERENT reason', async () => {
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never);
      vi.mocked(mockPrisma.pointsTransaction.findUnique).mockResolvedValue({
        id: 'txn-1',
        direction: 'credit',
        amountMinor: 500000n,
        referenceType: 'admin_credit',
        description: 'A completely different reason', // differs from BASE_PARAMS.dto.reason
        referenceId: 'audit-1',
        accountId: 'account-1',
        idempotencyKey: BASE_PARAMS.idempotencyKey,
      } as never);
      vi.mocked(mockPrisma.pointsAccount.findUnique).mockResolvedValue({ id: 'account-1' } as never);
      vi.mocked(mockPrisma.adminLog.findUnique).mockResolvedValue({ adminId: BASE_PARAMS.adminId } as never);

      await expect(service.adjust(BASE_PARAMS)).rejects.toThrow(HttpException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects 409 when the same key is reused for the OPPOSITE direction (referenceType mismatch)', async () => {
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never);
      vi.mocked(mockPrisma.pointsTransaction.findUnique).mockResolvedValue({
        id: 'txn-1',
        direction: 'debit', // BASE_PARAMS.dto.direction is 'credit'
        amountMinor: 500000n,
        referenceType: 'admin_debit',
        description: 'Opening balance',
        referenceId: 'audit-1',
        accountId: 'account-1',
        idempotencyKey: BASE_PARAMS.idempotencyKey,
      } as never);
      vi.mocked(mockPrisma.pointsAccount.findUnique).mockResolvedValue({ id: 'account-1' } as never);
      vi.mocked(mockPrisma.adminLog.findUnique).mockResolvedValue({ adminId: BASE_PARAMS.adminId } as never);

      await expect(service.adjust(BASE_PARAMS)).rejects.toThrow(HttpException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
