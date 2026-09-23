/**
 * PointsController — player points endpoints.
 *
 * docs/API_V2.md §4:
 *   GET /points/balance
 *   GET /points/transactions
 *
 * Read-only. All routes require PlayerJwtGuard + UserStatusGuard (live
 * session revocation enforcement on every request, per AUTH_V2.md §9) —
 * same pattern as UsersController.
 *
 * Both handlers derive the target user from the authenticated JWT (`user.sub`)
 * — there is no `:userId` route parameter, so a player cannot request
 * another user's balance or ledger by construction.
 */
import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlayerJwtGuard } from '../auth/guards/player-jwt.guard';
import { UserStatusGuard } from '../auth/guards/user-status.guard';
import type { JwtPayload } from '../auth/strategies/jwt-payload.interface';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto'; // @Query() — needs runtime metadata
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PointsService } from './points.service'; // DI token — must be value import

@Controller('points')
@UseGuards(PlayerJwtGuard, UserStatusGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  /** GET /api/v1/points/balance */
  @Get('balance')
  async getBalance(@CurrentUser() user: JwtPayload) {
    const balance = await this.pointsService.getBalance(user.sub);
    return { success: true, data: balance };
  }

  /** GET /api/v1/points/transactions */
  @Get('transactions')
  async listTransactions(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListTransactionsQueryDto,
  ) {
    const result = await this.pointsService.listTransactions(user.sub, query);
    return { success: true, data: result.data, meta: result.meta };
  }
}
