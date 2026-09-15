/**
 * Points module — scaffold for Phase 2A.
 *
 * Full implementation deferred to Phase 2B (step 5 of the implementation plan).
 *
 * Will implement:
 *   GET /api/v1/points/balance      — current balance (BIGINT centipoints)
 *   GET /api/v1/points/transactions — own ledger, paginated, filterable
 *
 * Read-only. Points are only mutated by:
 *   1. Bet placement (debit)
 *   2. Settlement (credit — NOT IMPLEMENTED, needs client confirmation)
 *   3. Round void refund (credit)
 *   4. Admin adjustment (credit or debit)
 * There is no player-facing write endpoint (docs/API_V2.md §4).
 *
 * All amounts are BIGINT centipoints (_minor suffix) per ADR-014.
 */
import { Module } from '@nestjs/common';

@Module({})
export class PointsModule {}
