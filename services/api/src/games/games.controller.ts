/**
 * GamesController — player-facing read-only round state (docs/API_V2.md §5).
 *
 * Phase 2D / Step 6 scope: only `GET /games/:gameId/current-round` is
 * implemented — the read endpoint Step 6 needs so a client can render round
 * identity, state, authoritative deadlines, and stateVersion. The other
 * §5 endpoints (`GET /games`, `GET /games/:gameId`, `GET /games/:gameId/recent-results`)
 * are NOT implemented here — they are not required by Step 6 and are not
 * invented ahead of the module that would need them.
 *
 * Same guard pattern as PointsController: PlayerJwtGuard + UserStatusGuard
 * (live session revocation enforcement on every request, AUTH_V2.md §9).
 */
import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { PlayerJwtGuard } from '../auth/guards/player-jwt.guard';
import { UserStatusGuard } from '../auth/guards/user-status.guard';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { GamesService } from './games.service'; // DI token — must be value import

@Controller('games')
@UseGuards(PlayerJwtGuard, UserStatusGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  /** GET /api/v1/games/:gameId/current-round */
  @Get(':gameId/current-round')
  async getCurrentRound(@Param('gameId') gameId: string) {
    const data = await this.gamesService.getCurrentRound(gameId);
    return { success: true, data };
  }
}
