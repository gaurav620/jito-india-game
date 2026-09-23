/**
 * PointsLedgerService — the ONE authoritative primitive for mutating points.
 *
 * Implements the transaction shape specified in docs/POINTS_SYSTEM.md §6:
 *   BEGIN
 *     SELECT balance_minor FROM points_accounts WHERE user_id = $1 FOR UPDATE
 *     validate INSIDE the lock
 *     INSERT points_transactions (idempotency_key UNIQUE — anti-replay)
 *     UPDATE points_accounts SET balance_minor = $new
 *   COMMIT
 *
 * This service is the SOLE writer of points_transactions / points_accounts
 * rows outside a migration. Every future points-affecting feature (bet
 * placement debit, settlement credit, round-void refund) must call through
 * this primitive rather than writing the ledger directly (ADR-028).
 *
 * Lock ordering (docs/POINTS_SYSTEM.md §6, ADR-022): canonical order is
 * round → account → bet. This service only ever locks the account — it is
 * used standalone (admin adjustment: no round/bet involved) or composed
 * into a caller's transaction (future bet debit) where the caller has
 * ALREADY locked the round before calling `mutateWithinTransaction`. This
 * service never acquires a round lock itself, so it cannot introduce a
 * reverse account → round path.
 *
 * Idempotency (docs/POINTS_SYSTEM.md §5):
 *   1. Pre-check by idempotency_key OUTSIDE any lock — a replay never
 *      touches the account row at all.
 *   2. If not found, open a transaction, lock the account, validate, insert.
 *   3. If the insert races another request with the SAME key (both passed
 *      the pre-check before either committed), the INSERT fails on the
 *      UNIQUE(idempotency_key) constraint. Postgres aborts the transaction
 *      on that error — no partial write survives. Re-read by key outside
 *      the aborted transaction and return the winner's row as a replay.
 *   4. If the key matches an existing row but the request parameters
 *      differ, reject 409 (client bug — must be surfaced, not silently
 *      resolved).
 *
 * Every failure path (insufficient balance, key-mismatch conflict, any
 * unexpected error) rejects the Prisma interactive transaction, which rolls
 * it back automatically — there is no code path that can leave a balance
 * update without its ledger row, or a ledger row without its balance update.
 */
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import type { Prisma, PointsTransaction, TxnDirection, TxnRefType } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { AppErrorCode } from '../common/errors';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../database/prisma.service'; // DI token — must be value import

/** Either the root Prisma client or an interactive-transaction client. */
export type PrismaExecutor = PrismaService | Prisma.TransactionClient;

export interface ApplyLedgerMutationParams {
  userId: string;
  direction: TxnDirection;
  /** Always positive — direction carries the sign (docs/DATABASE_V2.md §4.4). */
  amountMinor: bigint;
  referenceType: TxnRefType;
  /** FK to the row that justifies this entry (bet / settlement / admin_log). */
  referenceId: string | null;
  idempotencyKey: string;
  description?: string | null;
  /**
   * If false (default), a debit that would drive the balance below zero is
   * REJECTED, not clamped (docs/POINTS_SYSTEM.md §9). No caller in Phase 2C
   * sets this true — reserved for a future, explicitly-confirmed use case.
   */
  allowOverdraw?: boolean;
}

export interface LedgerMutationResult {
  transactionId: string;
  direction: TxnDirection;
  amountMinor: bigint;
  balanceBeforeMinor: bigint;
  balanceAfterMinor: bigint;
  referenceType: TxnRefType;
  referenceId: string | null;
  idempotencyKey: string;
  description: string | null;
  createdAt: Date;
  /** true if this call returned an EXISTING ledger row rather than creating one. */
  replayed: boolean;
}

/** A debit that would drive the balance below zero. 422 — semantically invalid given current state. */
export class InsufficientPointsException extends HttpException {
  constructor(
    public readonly requiredMinor: bigint,
    public readonly availableMinor: bigint,
  ) {
    super(
      {
        code: AppErrorCode.INSUFFICIENT_POINTS,
        message: 'Insufficient points balance for this operation.',
        requiredMinor: requiredMinor.toString(),
        availableMinor: availableMinor.toString(),
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/** Same idempotency key reused with different parameters — a client bug, surfaced loudly. */
export class IdempotencyKeyReusedException extends HttpException {
  constructor() {
    super(
      {
        code: AppErrorCode.IDEMPOTENCY_KEY_REUSED,
        message: 'This idempotency key was already used with different parameters.',
      },
      HttpStatus.CONFLICT,
    );
  }
}

@Injectable()
export class PointsLedgerService {
  private readonly logger = new Logger(PointsLedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Standalone entry point — opens and commits its OWN transaction.
   *
   * Use `mutateWithinTransaction` directly instead when this mutation must
   * be composed into a larger transaction that writes other rows atomically
   * (e.g. AdminPointsService, which must also insert an admin_logs row in
   * the SAME transaction as the ledger effect).
   */
  async applyMutation(params: ApplyLedgerMutationParams): Promise<LedgerMutationResult> {
    this.assertPositiveAmount(params.amountMinor);

    const existing = await this.findByIdempotencyKey(this.prisma, params.idempotencyKey);
    if (existing) {
      this.assertReplayMatches(existing, params);
      return this.toResult(existing, true);
    }

    try {
      return await this.prisma.$transaction((tx) => this.mutateWithinTransaction(tx, params));
    } catch (err: unknown) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        // Race window: another request with the SAME key committed between
        // our pre-check and our insert. The insert failed the UNIQUE
        // constraint and Prisma rolled the whole transaction back — no
        // partial state was written by THIS call. Re-read the winner's row.
        const raced = await this.findByIdempotencyKey(this.prisma, params.idempotencyKey);
        if (raced) {
          this.assertReplayMatches(raced, params);
          return this.toResult(raced, true);
        }
      }
      throw err;
    }
  }

  /**
   * Core lock → validate → insert → project logic, given an executor.
   *
   * The caller is responsible for idempotency pre-check / P2002-replay
   * handling when composing this into a larger transaction — see
   * AdminPointsService.adjust() for the reference composition.
   */
  async mutateWithinTransaction(
    tx: Prisma.TransactionClient,
    params: ApplyLedgerMutationParams,
  ): Promise<LedgerMutationResult> {
    this.assertPositiveAmount(params.amountMinor);

    // Lock the account row for the rest of THIS transaction. Any concurrent
    // mutation against the same account blocks here until this transaction
    // commits or rolls back (docs/POINTS_SYSTEM.md §4.3, §6).
    //
    // ::uuid cast is required: Prisma's tagged-template $queryRaw sends JS
    // string parameters as PostgreSQL `text`, and Postgres has no implicit
    // `uuid = text` operator — omitting the cast fails with
    // "operator does not exist: uuid = text" (42883), caught by
    // points.integration.spec.ts against a real database).
    const rows = await tx.$queryRaw<Array<{ id: string; balance_minor: bigint }>>`
      SELECT id, balance_minor
        FROM points_accounts
       WHERE user_id = ${params.userId}::uuid
         FOR UPDATE`;

    const account = rows[0];
    if (!account) {
      // Every user is created with a points_accounts row in the same
      // transaction as registration (AUTH_V2.md §2) — this can only mean a
      // caller passed a userId with no account, which is a programming
      // error, not a user-facing condition.
      throw new Error(`PointsLedgerService: no points_accounts row for user ${params.userId}`);
    }

    const balanceBefore = account.balance_minor;
    const balanceAfter =
      params.direction === 'credit' ? balanceBefore + params.amountMinor : balanceBefore - params.amountMinor;

    // Validate INSIDE the lock — a check performed before acquiring it
    // proves nothing about the balance at write time.
    if (!params.allowOverdraw && balanceAfter < 0n) {
      throw new InsufficientPointsException(params.amountMinor, balanceBefore);
    }

    const txnRow = await tx.pointsTransaction.create({
      data: {
        accountId: account.id,
        direction: params.direction,
        amountMinor: params.amountMinor,
        balanceBeforeMinor: balanceBefore,
        balanceAfterMinor: balanceAfter,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        idempotencyKey: params.idempotencyKey,
        description: params.description ?? null,
      },
    });

    await tx.pointsAccount.update({
      where: { id: account.id },
      data: { balanceMinor: balanceAfter, version: { increment: 1n } },
    });

    return this.toResult(txnRow, false);
  }

  private async findByIdempotencyKey(
    executor: PrismaExecutor,
    idempotencyKey: string,
  ): Promise<(PointsTransaction & { account: { userId: string } }) | null> {
    // account.userId is fetched in the SAME query (not a follow-up lookup)
    // so assertReplayMatches can prove ownership without a second round-trip
    // or a separate race window against the row it's validating.
    return executor.pointsTransaction.findUnique({
      where: { idempotencyKey },
      include: { account: { select: { userId: true } } },
    });
  }

  /**
   * A replayed key must describe the SAME mutation FOR THE SAME ACCOUNT. If
   * any of these differ, the client reused a key for a different intent — a
   * bug that must be surfaced (409), never silently resolved
   * (docs/POINTS_SYSTEM.md §5.3).
   *
   * The account-ownership check is mandatory: UNIQUE(idempotency_key) is
   * global, not scoped per-user, so without it a key collision (accidental
   * or malicious) across two different users' accounts would let the second
   * caller silently "replay" — and receive the result of — a transaction
   * that was never theirs.
   */
  private assertReplayMatches(
    existing: PointsTransaction & { account: { userId: string } },
    params: ApplyLedgerMutationParams,
  ): void {
    const matches =
      existing.account.userId === params.userId &&
      existing.direction === params.direction &&
      existing.amountMinor === params.amountMinor &&
      existing.referenceType === params.referenceType &&
      (existing.referenceId ?? null) === (params.referenceId ?? null);

    if (!matches) {
      this.logger.warn(`Idempotency key reused with different parameters or owner: ${params.idempotencyKey}`);
      throw new IdempotencyKeyReusedException();
    }
  }

  private assertPositiveAmount(amountMinor: bigint): void {
    if (amountMinor <= 0n) {
      throw new Error('PointsLedgerService: amountMinor must be > 0');
    }
  }

  private toResult(row: PointsTransaction, replayed: boolean): LedgerMutationResult {
    return {
      transactionId: row.id,
      direction: row.direction,
      amountMinor: row.amountMinor,
      balanceBeforeMinor: row.balanceBeforeMinor,
      balanceAfterMinor: row.balanceAfterMinor,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      idempotencyKey: row.idempotencyKey,
      description: row.description,
      createdAt: row.createdAt,
      replayed,
    };
  }
}
