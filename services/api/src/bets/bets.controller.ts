/**
 * BetsController — player-facing bet placement (docs/API_V2.md §6).
 *
 * Only `POST /bets` is implemented — the two GET endpoints documented
 * alongside it (`GET /bets/round/:roundId`, `GET /bets/:betId`) are out of
 * this step's scope and are not added.
 *
 * Status code varies by outcome, per the documented contract: a fresh bet
 * is `201 Created`; a replayed idempotency key is `200 OK` with an
 * `Idempotency-Replayed: true` header (not a body field) — `@Res({passthrough:true})`
 * is required here because NestJS's `@HttpCode` decorator is static and
 * cannot vary per request.
 *
 * `userId` always comes from the authenticated JWT (`@CurrentUser()`),
 * never from the request body — the DTO has no such field.
 */
import { Body, Controller, Headers, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlayerJwtGuard } from '../auth/guards/player-jwt.guard';
import { UserStatusGuard } from '../auth/guards/user-status.guard';
import type { JwtPayload } from '../auth/strategies/jwt-payload.interface';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { BetsService } from './bets.service'; // DI token — must be value import
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PlaceBetDto } from './dto/place-bet.dto'; // @Body() — needs runtime metadata

@Controller('bets')
@UseGuards(PlayerJwtGuard, UserStatusGuard)
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  /** POST /api/v1/bets */
  @Post()
  async placeBet(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PlaceBetDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.betsService.placeBet({ userId: user.sub, idempotencyKey, dto });

    res.status(result.replayed ? HttpStatus.OK : HttpStatus.CREATED);
    if (result.replayed) {
      res.set('Idempotency-Replayed', 'true');
    }

    return {
      success: true,
      data: {
        betId: result.betId,
        roundId: result.roundId,
        totalAmountMinor: result.totalAmountMinor,
        balanceMinor: result.balanceMinor,
        status: result.status,
        acceptedAt: result.acceptedAt,
      },
    };
  }
}
