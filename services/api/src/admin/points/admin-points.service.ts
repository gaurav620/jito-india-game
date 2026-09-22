/**
 * AdminPointsService — the only inflow of points into the platform
 * (docs/POINTS_SYSTEM.md §9). Not a payment, deposit, or purchase — an
 * operator-granted amusement balance adjustment (ADR-011).
 *
 * docs/API_V2.md §8.2:
 *   POST /admin/users/:id/points/adjust
 *   Headers: Idempotency-Key: adj:{adminId}:{uuid}   (REQUIRED)
 *   { "direction": "credit"|"debit", "amountMinor": 500000, "reason": "…" }
 *
 * Requirements from docs/POINTS_SYSTEM.md §9, implemented here:
 *   - Writes the admin_logs row and the points_transactions row in the
 *     SAME transaction — an adjustment without an audit trail is
 *     structurally impossible (composed via PointsLedgerService.
 *     mutateWithinTransaction, ADR-028).
 *   - Requires a non-empty reason (enforced by AdjustPointsDto).
 *   - Subject to the same FOR UPDATE lock and idempotency key as any other
 *     mutation (PointsLedgerService owns the lock).
 *   - A debit that would drive the balance below zero is rejected
 *     (InsufficientPointsException), never clamped.
 *
 * Role requirement: NEEDS CLIENT CONFIRMATION (AUTH_V2.md Open Item #5 —
 * the admin role/permission matrix is not yet confirmed). This service does
 * not decide roles; the controller applies the EXISTING approved guard
 * chain (AdminJwtGuard, AdminStatusGuard, RolesGuard) with
 * `@Roles(AdminRole.operator, AdminRole.super_admin)`, matching
 * docs/API_V2.md §8.2's documented "operator+" requirement. If the client
 * later confirms a different matrix, only the `@Roles(...)` call on the
 * controller needs to change — this service has no role logic to touch.
 */
import { randomUUID } from 'crypto';

import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { AppErrorCode } from '../../common/errors';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../database/prisma.service'; // DI token — must be value import
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PointsLedgerService } from '../../points/points-ledger.service'; // DI token — must be value import

import type { AdjustPointsDirection, AdjustPointsDto } from './dto/adjust-points.dto';

export class IdempotencyKeyRequiredException extends HttpException {
  constructor() {
    super(
      { code: AppErrorCode.IDEMPOTENCY_KEY_REQUIRED, message: 'Idempotency-Key header is required.' },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class IdempotencyKeyReusedException extends HttpException {
  constructor() {
    super(
      {
        code: AppErrorCode.IDEMPOTENCY_KEY_REUSED,
        message: 'This idempotency key was already used with a different adjustment.',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export interface AdjustPointsParams {
  adminId: string;
  targetUserId: string;
  dto: AdjustPointsDto;
  idempotencyKey: string | undefined;
  ip: string;
}

export interface AdjustPointsResult {
  transactionId: string;
  balanceBeforeMinor: string;
  balanceAfterMinor: string;
  auditLogId: string;
  replayed: boolean;
}

@Injectable()
export class AdminPointsService {
  private readonly logger = new Logger(AdminPointsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: PointsLedgerService,
  ) {}

  async adjust(params: AdjustPointsParams): Promise<AdjustPointsResult> {
    if (!params.idempotencyKey) {
      throw new IdempotencyKeyRequiredException();
    }
    const idempotencyKey = params.idempotencyKey;

    const targetUser = await this.prisma.user.findUnique({
      where: { id: params.targetUserId },
      select: { id: true },
    });
    if (!targetUser) {
      throw new NotFoundException(AppErrorCode.NOT_FOUND);
    }

    const replay = await this.findReplay(idempotencyKey, params);
    if (replay) return replay;

    try {
      return await this.runAdjustmentTransaction(idempotencyKey, params);
    } catch (err: unknown) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        // Race: another request with the SAME key committed between our
        // pre-check and our insert. Prisma rolled our transaction back —
        // no admin_log or ledger row from THIS call survives. Re-read.
        const raced = await this.findReplay(idempotencyKey, params);
        if (raced) return raced;
      }
      throw err;
    }
  }

  private async runAdjustmentTransaction(
    idempotencyKey: string,
    params: AdjustPointsParams,
  ): Promise<AdjustPointsResult> {
    const { adminId, targetUserId, dto, ip } = params;
    const amountMinor = BigInt(dto.amountMinor);

    return this.prisma.$transaction(async (tx) => {
      // Pre-generate the audit log id so the ledger row's referenceId can
      // point at it directly — one write each, no second UPDATE needed.
      const auditLogId = randomUUID();

      await tx.adminLog.create({
        data: {
          id: auditLogId,
          adminId,
          action: 'points_adjust',
          targetType: 'user',
          targetId: targetUserId,
          ipAddress: ip,
          afterState: {
            direction: dto.direction,
            amountMinor: dto.amountMinor.toString(),
            reason: dto.reason,
          },
        },
      });

      const ledgerResult = await this.ledger.mutateWithinTransaction(tx, {
        userId: targetUserId,
        direction: dto.direction,
        amountMinor,
        referenceType: dto.direction === 'credit' ? 'admin_credit' : 'admin_debit',
        referenceId: auditLogId,
        idempotencyKey,
        description: dto.reason,
      });

      return {
        transactionId: ledgerResult.transactionId,
        balanceBeforeMinor: ledgerResult.balanceBeforeMinor.toString(),
        balanceAfterMinor: ledgerResult.balanceAfterMinor.toString(),
        auditLogId,
        replayed: false,
      };
    });
  }

  /**
   * Idempotency pre-check. Returns the original result if this key was
   * already used with the SAME parameters; throws 409 if used with
   * different parameters; returns undefined if the key is genuinely new.
   *
   * "Same parameters" is checked against every field that identifies THIS
   * adjustment's intent, not just the financial ones:
   *   - target account (existing.accountId)
   *   - direction + amount
   *   - referenceType — must match the admin_credit/admin_debit implied by
   *     direction, so a key can never "replay" onto an unrelated row of a
   *     different origin that happens to share direction/amount/account
   *   - reason — part of the request body (AdjustPointsDto), stored
   *     verbatim as points_transactions.description by
   *     runAdjustmentTransaction, so a replay with a different reason is a
   *     different request, not the same one repeated
   *   - admin actor — the admin_logs row is the authoritative record of WHO
   *     performed the original adjustment (existing.referenceId points at
   *     it); a different admin presenting the same key must not be able to
   *     inherit someone else's adjustment
   */
  private async findReplay(
    idempotencyKey: string,
    params: AdjustPointsParams,
  ): Promise<AdjustPointsResult | undefined> {
    const existing = await this.prisma.pointsTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (!existing) return undefined;

    const expectedDirection: AdjustPointsDirection = params.dto.direction;
    const expectedAmount = BigInt(params.dto.amountMinor);
    const expectedReferenceType = expectedDirection === 'credit' ? 'admin_credit' : 'admin_debit';

    const account = await this.prisma.pointsAccount.findUnique({
      where: { userId: params.targetUserId },
      select: { id: true },
    });

    // points_transactions has no direct relation to admin_logs (referenceId
    // is a polymorphic FK — bet/settlement/admin_log depending on
    // referenceType), so the admin actor requires a separate lookup rather
    // than a Prisma `include`.
    const adminLog = existing.referenceId
      ? await this.prisma.adminLog.findUnique({
          where: { id: existing.referenceId },
          select: { adminId: true },
        })
      : null;

    const matches =
      existing.accountId === account?.id &&
      existing.direction === expectedDirection &&
      existing.amountMinor === expectedAmount &&
      existing.referenceType === expectedReferenceType &&
      (existing.description ?? '') === params.dto.reason &&
      adminLog?.adminId === params.adminId;

    if (!matches) {
      this.logger.warn(`Admin points idempotency key reused with different parameters: ${idempotencyKey}`);
      throw new IdempotencyKeyReusedException();
    }

    return {
      transactionId: existing.id,
      balanceBeforeMinor: existing.balanceBeforeMinor.toString(),
      balanceAfterMinor: existing.balanceAfterMinor.toString(),
      auditLogId: existing.referenceId ?? '',
      replayed: true,
    };
  }
}
