/**
 * BetsService unit tests.
 *
 * Concurrency/lock-order/idempotency-race behaviour against REAL PostgreSQL
 * is covered by bets.integration.spec.ts. This suite verifies the
 * composition contract: round validation, item merging, selection-range
 * validation, numeric-safety validation, the ledger key derivation, lock
 * ORDER (account locked/validated before bet/bet_items are persisted, ledger
 * committed after), and the 400/404/409/422 error paths — all with mocked
 * Prisma + PointsLedgerService.
 */
import { NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { PrismaService } from '../database/prisma.service';
import type { LockedAccountMutation, PointsLedgerService } from '../points/points-ledger.service';

import {
  BetIdempotencyKeyRequiredException,
  BetIdempotencyKeyReusedException,
  BetIdempotencyKeyTooLongException,
  BetsService,
  DeadlinePassedException,
  InvalidSelectionException,
  RoundMismatchException,
  RoundNotAcceptingException,
  UnsafeAmountException,
} from './bets.service';
import { PlaceBetItemDto } from './dto/place-bet.dto';

const mockTx = {
  $queryRaw: vi.fn(),
  bet: { create: vi.fn() },
  betItem: { createMany: vi.fn() },
};

const mockPrisma = {
  $transaction: vi.fn(),
  bet: { findFirst: vi.fn() },
  pointsTransaction: { findFirst: vi.fn() },
} as unknown as PrismaService;

const mockLedger = {
  lockAndValidateAccount: vi.fn(),
  commitMutation: vi.fn(),
} as unknown as PointsLedgerService;

const BASE_DTO = {
  roundId: 'round-1',
  gameId: 'triple-chance-timer',
  items: [{ category: 'doubles' as const, selection: 72, amountMinor: 400 }],
};

const BASE_PARAMS = {
  userId: 'user-1',
  idempotencyKey: 'bet:user-1:round-1:client-req-1',
  dto: BASE_DTO,
};

function mockRoundRow(overrides: Partial<{ id: string; game_id: string; state: string; deadline_passed: boolean }> = {}) {
  return [
    {
      id: 'round-1',
      game_id: 'triple-chance-timer',
      state: 'BETTING_OPEN',
      deadline_passed: false,
      ...overrides,
    },
  ];
}

function mockLockedToken(overrides: Partial<LockedAccountMutation> = {}): LockedAccountMutation {
  return {
    accountId: 'account-1',
    direction: 'debit',
    amountMinor: 400n,
    balanceBeforeMinor: 10000n,
    balanceAfterMinor: 9600n,
    ...overrides,
  };
}

function capturedBetId(): string {
  const createCall = mockTx.bet.create.mock.calls[0]?.[0] as { data: { id: string } };
  return createCall.data.id;
}

/** `mock.invocationCallOrder[0]` is `number | undefined` by type — this asserts the call actually happened rather than silencing the type with `!`. */
function firstCallOrder(fn: { mock: { invocationCallOrder: number[] } }): number {
  const order = fn.mock.invocationCallOrder[0];
  expect(order).toEqual(expect.any(Number));
  return order as number;
}

describe('BetsService', () => {
  let service: BetsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BetsService(mockPrisma, mockLedger);
    vi.mocked(mockPrisma.$transaction).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((fn: any) => fn(mockTx)) as never,
    );
    vi.mocked(mockPrisma.bet.findFirst).mockResolvedValue(null);
  });

  it('rejects with 400 when Idempotency-Key header is missing', async () => {
    await expect(service.placeBet({ ...BASE_PARAMS, idempotencyKey: undefined })).rejects.toThrow(
      BetIdempotencyKeyRequiredException,
    );
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  describe('Idempotency-Key contract (opaque, per the contract audit)', () => {
    it('rejects a header longer than 120 chars deterministically, before any DB access (bets.idempotency_key is VARCHAR(120))', async () => {
      const oversizedKey = 'k'.repeat(121);
      await expect(
        service.placeBet({ ...BASE_PARAMS, idempotencyKey: oversizedKey }),
      ).rejects.toThrow(BetIdempotencyKeyTooLongException);
      expect(mockPrisma.bet.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('accepts a header exactly AT the 120-char boundary (inclusive, not off-by-one)', async () => {
      const boundaryKey = 'k'.repeat(120);
      mockTx.$queryRaw.mockResolvedValue(mockRoundRow());
      mockTx.bet.create.mockResolvedValue({ status: 'accepted', acceptedAt: new Date() });
      mockTx.betItem.createMany.mockResolvedValue({ count: 1 });
      vi.mocked(mockLedger.lockAndValidateAccount).mockResolvedValue(mockLockedToken());
      vi.mocked(mockLedger.commitMutation).mockResolvedValue({
        transactionId: 'txn-1',
        direction: 'debit',
        amountMinor: 400n,
        balanceBeforeMinor: 10000n,
        balanceAfterMinor: 9600n,
        referenceType: 'bet_placed',
        referenceId: 'bet-1',
        idempotencyKey: 'bet-debit:whatever',
        description: null,
        createdAt: new Date(),
        replayed: false,
      });

      await expect(
        service.placeBet({ ...BASE_PARAMS, idempotencyKey: boundaryKey }),
      ).resolves.toMatchObject({ replayed: false });
      expect(mockTx.bet.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ idempotencyKey: boundaryKey }),
      });
    });

    it('never parses or validates internal structure of the key — an arbitrary opaque string unrelated to userId/roundId is accepted as-is', async () => {
      // Deliberately NOT of the form bet:{userId}:{roundId}:{clientRequestId}
      // — proves the server does not require, parse, or match that shape
      // (see the contract-audit doc comment in bets.service.ts).
      const opaqueKey = 'totally-unstructured-opaque-token-xyz-123';
      mockTx.$queryRaw.mockResolvedValue(mockRoundRow());
      mockTx.bet.create.mockResolvedValue({ status: 'accepted', acceptedAt: new Date() });
      mockTx.betItem.createMany.mockResolvedValue({ count: 1 });
      vi.mocked(mockLedger.lockAndValidateAccount).mockResolvedValue(mockLockedToken());
      vi.mocked(mockLedger.commitMutation).mockResolvedValue({
        transactionId: 'txn-1',
        direction: 'debit',
        amountMinor: 400n,
        balanceBeforeMinor: 10000n,
        balanceAfterMinor: 9600n,
        referenceType: 'bet_placed',
        referenceId: 'bet-1',
        idempotencyKey: 'bet-debit:whatever',
        description: null,
        createdAt: new Date(),
        replayed: false,
      });

      await expect(
        service.placeBet({ ...BASE_PARAMS, idempotencyKey: opaqueKey }),
      ).resolves.toMatchObject({ replayed: false });
    });
  });

  describe('DTO-level numeric validation (class-validator, docs/API_V2.md §6)', () => {
    it('rejects NaN as a class-validator error, never reaching the service', async () => {
      const dto = plainToInstance(PlaceBetItemDto, { category: 'doubles', selection: 72, amountMinor: NaN });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'amountMinor')).toBe(true);
    });

    it('rejects Infinity as a class-validator error', async () => {
      const dto = plainToInstance(PlaceBetItemDto, { category: 'doubles', selection: 72, amountMinor: Infinity });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'amountMinor')).toBe(true);
    });

    it('rejects a non-integer (fractional) amount as a class-validator error', async () => {
      const dto = plainToInstance(PlaceBetItemDto, { category: 'doubles', selection: 72, amountMinor: 400.5 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'amountMinor')).toBe(true);
    });

    it('accepts a valid positive safe integer with no errors (control case)', async () => {
      const dto = plainToInstance(PlaceBetItemDto, { category: 'doubles', selection: 72, amountMinor: 400 });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('BigInt-conversion safety at the service boundary (defense in depth)', () => {
    it('rejects a non-integer amountMinor with the controlled UnsafeAmountException, never an uncaught BigInt RangeError, even if a caller bypasses DTO validation', async () => {
      await expect(
        service.placeBet({
          ...BASE_PARAMS,
          dto: { ...BASE_DTO, items: [{ category: 'doubles', selection: 72, amountMinor: 400.5 }] },
        }),
      ).rejects.toThrow(UnsafeAmountException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects NaN reaching the service directly (bypassing DTO validation) with UnsafeAmountException, not a silent NaN propagating into BigInt', async () => {
      await expect(
        service.placeBet({
          ...BASE_PARAMS,
          dto: { ...BASE_DTO, items: [{ category: 'doubles', selection: 72, amountMinor: NaN }] },
        }),
      ).rejects.toThrow(UnsafeAmountException);
    });
  });

  describe('successful placement', () => {
    it('locks the round, locks+validates the account BEFORE persisting the bet, persists bet + items, commits the ledger debit LAST, and returns the accepted-bet shape', async () => {
      mockTx.$queryRaw.mockResolvedValue(mockRoundRow());
      mockTx.bet.create.mockResolvedValue({
        status: 'accepted',
        acceptedAt: new Date('2026-09-26T00:00:00Z'),
      });
      mockTx.betItem.createMany.mockResolvedValue({ count: 1 });
      vi.mocked(mockLedger.lockAndValidateAccount).mockResolvedValue(mockLockedToken());
      vi.mocked(mockLedger.commitMutation).mockResolvedValue({
        transactionId: 'txn-1',
        direction: 'debit',
        amountMinor: 400n,
        balanceBeforeMinor: 10000n,
        balanceAfterMinor: 9600n,
        referenceType: 'bet_placed',
        referenceId: 'bet-1',
        idempotencyKey: 'bet-debit:whatever',
        description: null,
        createdAt: new Date(),
        replayed: false,
      });

      const result = await service.placeBet(BASE_PARAMS);

      // Round locked via a single guarded raw SELECT ... FOR UPDATE.
      const [sql] = mockTx.$queryRaw.mock.calls[0] as [TemplateStringsArray];
      expect(sql.join('')).toContain('FOR UPDATE');

      const betId = capturedBetId();
      expect(betId).toEqual(expect.any(String));

      // ORDER (ADR-022, round → account → bet): lockAndValidateAccount must
      // run BEFORE bet.create/betItem.createMany, and commitMutation must
      // run AFTER them.
      const lockOrder = firstCallOrder(vi.mocked(mockLedger.lockAndValidateAccount));
      const betCreateOrder = firstCallOrder(mockTx.bet.create);
      const itemsCreateOrder = firstCallOrder(mockTx.betItem.createMany);
      const commitOrder = firstCallOrder(vi.mocked(mockLedger.commitMutation));
      expect(lockOrder).toBeLessThan(betCreateOrder);
      expect(betCreateOrder).toBeLessThan(itemsCreateOrder);
      expect(itemsCreateOrder).toBeLessThan(commitOrder);

      expect(mockLedger.lockAndValidateAccount).toHaveBeenCalledWith(
        mockTx,
        expect.objectContaining({ userId: 'user-1', direction: 'debit', amountMinor: 400n }),
      );

      expect(mockTx.bet.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: betId,
          userId: 'user-1',
          roundId: 'round-1',
          totalAmountMinor: 400n,
          idempotencyKey: BASE_PARAMS.idempotencyKey,
        }),
      });
      expect(mockTx.betItem.createMany).toHaveBeenCalledWith({
        data: [{ betId, category: 'doubles', selection: 72, amountMinor: 400n }],
      });

      // Ledger idempotency key is derived SOLELY from the server-generated
      // betId — short, and never contains the raw client key (Fix 2).
      expect(mockLedger.commitMutation).toHaveBeenCalledWith(
        mockTx,
        expect.objectContaining({ accountId: 'account-1' }),
        expect.objectContaining({
          referenceType: 'bet_placed',
          referenceId: betId,
          idempotencyKey: `bet-debit:${betId}`,
        }),
      );

      expect(result).toEqual({
        betId,
        roundId: 'round-1',
        totalAmountMinor: 400,
        balanceMinor: 9600,
        status: 'accepted',
        acceptedAt: '2026-09-26T00:00:00.000Z',
        replayed: false,
      });
    });

    it('merges duplicate (category, selection) items by summing amountMinor rather than rejecting', async () => {
      mockTx.$queryRaw.mockResolvedValue(mockRoundRow());
      mockTx.bet.create.mockResolvedValue({ status: 'accepted', acceptedAt: new Date() });
      mockTx.betItem.createMany.mockResolvedValue({ count: 1 });
      vi.mocked(mockLedger.lockAndValidateAccount).mockResolvedValue(mockLockedToken({ amountMinor: 700n, balanceAfterMinor: 9300n }));
      vi.mocked(mockLedger.commitMutation).mockResolvedValue({
        transactionId: 'txn-1',
        direction: 'debit',
        amountMinor: 700n,
        balanceBeforeMinor: 10000n,
        balanceAfterMinor: 9300n,
        referenceType: 'bet_placed',
        referenceId: 'bet-1',
        idempotencyKey: 'x',
        description: null,
        createdAt: new Date(),
        replayed: false,
      });

      await service.placeBet({
        ...BASE_PARAMS,
        dto: {
          ...BASE_DTO,
          items: [
            { category: 'doubles', selection: 72, amountMinor: 400 },
            { category: 'doubles', selection: 72, amountMinor: 300 },
          ],
        },
      });

      const betId = capturedBetId();

      expect(mockTx.betItem.createMany).toHaveBeenCalledWith({
        data: [{ betId, category: 'doubles', selection: 72, amountMinor: 700n }],
      });
      expect(mockTx.bet.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ totalAmountMinor: 700n }) }),
      );
      expect(mockLedger.lockAndValidateAccount).toHaveBeenCalledWith(
        mockTx,
        expect.objectContaining({ amountMinor: 700n }),
      );
    });

    it('accepts a full-length documented client Idempotency-Key and still derives a short ledger key from betId alone (Fix 2)', async () => {
      // docs/API_V2.md §6's documented format: bet:{userId}:{roundId}:{clientRequestId}.
      // Pad the clientRequestId so the whole raw key sits close to (but does
      // not need to fit under) points_transactions.idempotency_key's
      // VARCHAR(120) — the ledger key must NEVER embed this string.
      const longClientRequestId = 'c'.repeat(90);
      const longRawKey = `bet:user-1:round-1:${longClientRequestId}`;
      expect(longRawKey.length).toBeGreaterThan(100);

      mockTx.$queryRaw.mockResolvedValue(mockRoundRow());
      mockTx.bet.create.mockResolvedValue({ status: 'accepted', acceptedAt: new Date() });
      mockTx.betItem.createMany.mockResolvedValue({ count: 1 });
      vi.mocked(mockLedger.lockAndValidateAccount).mockResolvedValue(mockLockedToken());
      vi.mocked(mockLedger.commitMutation).mockResolvedValue({
        transactionId: 'txn-1',
        direction: 'debit',
        amountMinor: 400n,
        balanceBeforeMinor: 10000n,
        balanceAfterMinor: 9600n,
        referenceType: 'bet_placed',
        referenceId: 'bet-1',
        idempotencyKey: 'bet-debit:whatever',
        description: null,
        createdAt: new Date(),
        replayed: false,
      });

      await service.placeBet({ ...BASE_PARAMS, idempotencyKey: longRawKey });

      const betId = capturedBetId();
      expect(mockTx.bet.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ idempotencyKey: longRawKey }),
      });
      const commitCall = vi.mocked(mockLedger.commitMutation).mock.calls[0]?.[2] as { idempotencyKey: string };
      expect(commitCall.idempotencyKey).toBe(`bet-debit:${betId}`);
      expect(commitCall.idempotencyKey.length).toBeLessThan(120);
    });
  });

  describe('validation rejections', () => {
    it('rejects an out-of-range selection for its category before opening a transaction', async () => {
      await expect(
        service.placeBet({
          ...BASE_PARAMS,
          dto: { ...BASE_DTO, items: [{ category: 'singles', selection: 42, amountMinor: 100 }] },
        }),
      ).rejects.toThrow(InvalidSelectionException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a merged per-selection amount that exceeds Number.MAX_SAFE_INTEGER, before opening a transaction (Fix 3)', async () => {
      await expect(
        service.placeBet({
          ...BASE_PARAMS,
          dto: {
            ...BASE_DTO,
            items: [
              { category: 'doubles', selection: 72, amountMinor: Number.MAX_SAFE_INTEGER },
              { category: 'doubles', selection: 72, amountMinor: Number.MAX_SAFE_INTEGER },
            ],
          },
        }),
      ).rejects.toThrow(UnsafeAmountException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a total amount that exceeds Number.MAX_SAFE_INTEGER even when every individual/merged item is within range (Fix 3)', async () => {
      await expect(
        service.placeBet({
          ...BASE_PARAMS,
          dto: {
            ...BASE_DTO,
            items: [
              { category: 'doubles', selection: 72, amountMinor: Number.MAX_SAFE_INTEGER },
              { category: 'doubles', selection: 73, amountMinor: Number.MAX_SAFE_INTEGER },
            ],
          },
        }),
      ).rejects.toThrow(UnsafeAmountException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('accepts an amount exactly AT Number.MAX_SAFE_INTEGER (boundary is inclusive, not off-by-one)', async () => {
      mockTx.$queryRaw.mockResolvedValue(mockRoundRow());
      mockTx.bet.create.mockResolvedValue({ status: 'accepted', acceptedAt: new Date() });
      mockTx.betItem.createMany.mockResolvedValue({ count: 1 });
      vi.mocked(mockLedger.lockAndValidateAccount).mockResolvedValue(
        mockLockedToken({ amountMinor: BigInt(Number.MAX_SAFE_INTEGER) }),
      );
      vi.mocked(mockLedger.commitMutation).mockResolvedValue({
        transactionId: 'txn-1',
        direction: 'debit',
        amountMinor: BigInt(Number.MAX_SAFE_INTEGER),
        balanceBeforeMinor: 0n,
        balanceAfterMinor: 0n,
        referenceType: 'bet_placed',
        referenceId: 'bet-1',
        idempotencyKey: 'bet-debit:whatever',
        description: null,
        createdAt: new Date(),
        replayed: false,
      });

      await expect(
        service.placeBet({
          ...BASE_PARAMS,
          dto: { ...BASE_DTO, items: [{ category: 'doubles', selection: 72, amountMinor: Number.MAX_SAFE_INTEGER }] },
        }),
      ).resolves.toMatchObject({ replayed: false });
    });

    it('rejects when the round does not exist', async () => {
      mockTx.$queryRaw.mockResolvedValue([]);
      await expect(service.placeBet(BASE_PARAMS)).rejects.toThrow(NotFoundException);
    });

    it('rejects when the round belongs to a different game (ROUND_MISMATCH)', async () => {
      mockTx.$queryRaw.mockResolvedValue(mockRoundRow({ game_id: 'triple-chance-pro-timer' }));
      await expect(service.placeBet(BASE_PARAMS)).rejects.toThrow(RoundMismatchException);
      expect(mockTx.bet.create).not.toHaveBeenCalled();
    });

    it('rejects when the round is not in an accepting state (ROUND_NOT_ACCEPTING)', async () => {
      mockTx.$queryRaw.mockResolvedValue(mockRoundRow({ state: 'BETTING_LOCKED' }));
      await expect(service.placeBet(BASE_PARAMS)).rejects.toThrow(RoundNotAcceptingException);
      expect(mockTx.bet.create).not.toHaveBeenCalled();
    });

    it('rejects when the database clock says the deadline has passed, even if state still says accepting (DEADLINE_PASSED)', async () => {
      mockTx.$queryRaw.mockResolvedValue(mockRoundRow({ deadline_passed: true }));
      await expect(service.placeBet(BASE_PARAMS)).rejects.toThrow(DeadlinePassedException);
      expect(mockTx.bet.create).not.toHaveBeenCalled();
    });

    it('propagates InsufficientPointsException from lockAndValidateAccount BEFORE any bet/item row is persisted (transaction rolls back)', async () => {
      mockTx.$queryRaw.mockResolvedValue(mockRoundRow());
      const insufficientErr = new Error('insufficient') as Error & { name: string };
      vi.mocked(mockLedger.lockAndValidateAccount).mockRejectedValue(insufficientErr);

      await expect(service.placeBet(BASE_PARAMS)).rejects.toThrow(insufficientErr);
      expect(mockTx.bet.create).not.toHaveBeenCalled();
      expect(mockTx.betItem.createMany).not.toHaveBeenCalled();
      expect(mockLedger.commitMutation).not.toHaveBeenCalled();
    });
  });

  describe('idempotency replay', () => {
    it('returns the ORIGINAL result for a replayed key with the same payload — no new transaction', async () => {
      vi.mocked(mockPrisma.bet.findFirst).mockResolvedValue({
        id: 'bet-1',
        roundId: 'round-1',
        totalAmountMinor: 400n,
        status: 'accepted',
        acceptedAt: new Date('2026-09-26T00:00:00Z'),
        items: [{ category: 'doubles', selection: 72, amountMinor: 400n }],
      } as never);
      vi.mocked(mockPrisma.pointsTransaction.findFirst).mockResolvedValue({ balanceAfterMinor: 9600n } as never);

      const result = await service.placeBet(BASE_PARAMS);

      expect(result.replayed).toBe(true);
      expect(result.betId).toBe('bet-1');
      expect(result.balanceMinor).toBe(9600);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects 409 when the same key is reused with a DIFFERENT payload (different amount)', async () => {
      vi.mocked(mockPrisma.bet.findFirst).mockResolvedValue({
        id: 'bet-1',
        roundId: 'round-1',
        totalAmountMinor: 999n, // different from BASE_DTO's 400
        status: 'accepted',
        acceptedAt: new Date(),
        items: [{ category: 'doubles', selection: 72, amountMinor: 999n }],
      } as never);

      await expect(service.placeBet(BASE_PARAMS)).rejects.toThrow(BetIdempotencyKeyReusedException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects 409 when the same key is reused for a DIFFERENT round', async () => {
      vi.mocked(mockPrisma.bet.findFirst).mockResolvedValue({
        id: 'bet-1',
        roundId: 'some-other-round',
        totalAmountMinor: 400n,
        status: 'accepted',
        acceptedAt: new Date(),
        items: [{ category: 'doubles', selection: 72, amountMinor: 400n }],
      } as never);

      await expect(service.placeBet(BASE_PARAMS)).rejects.toThrow(BetIdempotencyKeyReusedException);
    });

    it('rejects 409 when the same key is reused with a different item set (different selection)', async () => {
      vi.mocked(mockPrisma.bet.findFirst).mockResolvedValue({
        id: 'bet-1',
        roundId: 'round-1',
        totalAmountMinor: 400n,
        status: 'accepted',
        acceptedAt: new Date(),
        items: [{ category: 'doubles', selection: 73, amountMinor: 400n }], // different selection
      } as never);

      await expect(service.placeBet(BASE_PARAMS)).rejects.toThrow(BetIdempotencyKeyReusedException);
    });

    it('re-checks for a replay after a P2002 race and returns the winner instead of erroring', async () => {
      mockTx.$queryRaw.mockResolvedValue(mockRoundRow());
      vi.mocked(mockLedger.lockAndValidateAccount).mockResolvedValue(mockLockedToken());
      mockTx.bet.create.mockRejectedValue(
        new PrismaClientKnownRequestError('unique violation', { code: 'P2002', clientVersion: '5.22.0' }),
      );
      vi.mocked(mockPrisma.bet.findFirst)
        .mockResolvedValueOnce(null) // initial pre-check: genuinely new
        .mockResolvedValueOnce({
          id: 'bet-1',
          roundId: 'round-1',
          totalAmountMinor: 400n,
          status: 'accepted',
          acceptedAt: new Date('2026-09-26T00:00:00Z'),
          items: [{ category: 'doubles', selection: 72, amountMinor: 400n }],
        } as never); // post-race re-check: the winner's row
      vi.mocked(mockPrisma.pointsTransaction.findFirst).mockResolvedValue({ balanceAfterMinor: 9600n } as never);

      const result = await service.placeBet(BASE_PARAMS);

      expect(result.replayed).toBe(true);
      expect(result.betId).toBe('bet-1');
      expect(mockLedger.commitMutation).not.toHaveBeenCalled();
    });
  });
});
