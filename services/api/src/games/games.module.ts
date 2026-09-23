/**
 * Games module.
 *
 * Phase 2D / Step 6 implements:
 *   GET /api/v1/games/:gameId/current-round    — current round state (REST snapshot)
 *
 * Also the reconnect/cold-start path and the polling fallback when
 * WebSockets are unavailable (docs/API_V2.md §5).
 *
 * Not yet implemented (not required by Step 6, not invented ahead of need):
 *   GET /api/v1/games                          — list active games
 *   GET /api/v1/games/:gameId                  — game details + limits
 *   GET /api/v1/games/:gameId/recent-results   — last N draws (history strip)
 *
 * AuthModule is imported for PlayerJwtGuard/UserStatusGuard, same pattern
 * as PointsModule.
 */
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { GamesController } from './games.controller';
import { GamesService } from './games.service';

@Module({
  imports: [AuthModule],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
