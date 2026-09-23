/**
 * PointsService — player-facing READ-ONLY points endpoints.
 *
 * Points are only mutated by placing a bet, by settlement, or by an audited
 * admin adjustment — never by a player-facing write endpoint
 * (docs/API_V2.md §4). This service has no mutating methods.
 */
import { centipointsToNumber } from '@jito/shared';
import { Injectable } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../database/prisma.service'; // DI token — must be value import

import type { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';

export interface BalanceResponse {
  /**
   * Centipoints as a JS number via centipointsToNumber() — matches the
   * documented docs/API_V2.md §4 example payload exactly. Safe for any
   * realistic balance (loses precision only above 2^53 centipoints, ≈90
   * trillion display points — see packages/shared/src/centipoints.ts).
   */
  balanceMinor: number;
  updatedAt: Date;
}

export interface TransactionListItem {
  id: string;
  direction: string;
  amountMinor: number;
  balanceBeforeMinor: number;
  balanceAfterMinor: number;
  referenceType: string;
  referenceId: string | null;
  description: string | null;
  createdAt: Date;
}

export interface TransactionListResponse {
  data: TransactionListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /points/balance — current balance for the authenticated user only. */
  async getBalance(userId: string): Promise<BalanceResponse> {
    const account = await this.prisma.pointsAccount.findUniqueOrThrow({
      where: { userId },
      select: { balanceMinor: true, updatedAt: true },
    });

    return {
      balanceMinor: centipointsToNumber(account.balanceMinor),
      updatedAt: account.updatedAt,
    };
  }

  /**
   * GET /points/transactions — the authenticated user's own ledger only.
   * Scoped by accountId derived from the authenticated userId — there is no
   * code path here that can read another user's transactions (a caller
   * cannot pass an arbitrary accountId).
   */
  async listTransactions(
    userId: string,
    query: ListTransactionsQueryDto,
  ): Promise<TransactionListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const account = await this.prisma.pointsAccount.findUniqueOrThrow({
      where: { userId },
      select: { id: true },
    });

    const where = {
      accountId: account.id,
      ...(query.referenceType ? { referenceType: query.referenceType } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.pointsTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pointsTransaction.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        direction: row.direction,
        amountMinor: centipointsToNumber(row.amountMinor),
        balanceBeforeMinor: centipointsToNumber(row.balanceBeforeMinor),
        balanceAfterMinor: centipointsToNumber(row.balanceAfterMinor),
        referenceType: row.referenceType,
        referenceId: row.referenceId,
        description: row.description,
        createdAt: row.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }
}
