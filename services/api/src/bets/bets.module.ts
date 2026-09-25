/**
 * BetsModule — bet placement (Phase 2E, Step 7 of the approved implementation plan).
 *
 * Implements:
 *   POST /api/v1/bets — place a bet (idempotent, requires Idempotency-Key)
 *
 * NOT in this module (out of Step 7 scope):
 *   GET /bets/round/:id, GET /bets/:betId — documented but not required yet.
 *
 * PointsModule is imported to reuse PointsLedgerService — the same
 * transactional debit primitive used by admin adjustment (ADR-028).
 * AuthModule is imported for PlayerJwtGuard/UserStatusGuard, same pattern
 * as PointsModule/GamesModule.
 */
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PointsModule } from '../points/points.module';

import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';

@Module({
  imports: [AuthModule, PointsModule],
  controllers: [BetsController],
  providers: [BetsService],
})
export class BetsModule {}
