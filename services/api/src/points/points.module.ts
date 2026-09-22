/**
 * PointsModule — points ledger foundation (Phase 2C, step 5 of the
 * approved implementation plan).
 *
 * Implements:
 *   GET /api/v1/points/balance
 *   GET /api/v1/points/transactions
 *
 * Exports PointsLedgerService and PointsReconciliationService so AdminModule
 * (points adjustment) and future modules (bet debit, settlement credit) can
 * compose the SAME mutation primitive rather than writing the ledger
 * directly — see points-ledger.service.ts.
 *
 * Guards imported from AuthModule (PlayerJwtGuard, UserStatusGuard) —
 * same pattern as UsersModule.
 *
 * NOT IN PHASE 2C: bet placement, settlement, round lifecycle. This module
 * only implements the ledger primitive and the two read-only player
 * endpoints already approved in docs/API_V2.md §4.
 */
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { PointsLedgerService } from './points-ledger.service';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { PointsReconciliationService } from './reconciliation.service';

@Module({
  imports: [AuthModule],
  controllers: [PointsController],
  providers: [PointsService, PointsLedgerService, PointsReconciliationService],
  exports: [PointsLedgerService, PointsReconciliationService],
})
export class PointsModule {}
