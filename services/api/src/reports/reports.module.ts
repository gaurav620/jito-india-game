/**
 * Reports module — scaffold for Phase 2A.
 *
 * Full implementation deferred to Phase 2B (step 11 of the implementation plan).
 * Gated on client confirmation of END / COMMI POINT / NTP POINT formulas.
 * See: NEEDS CLIENT CONFIRMATION items 2–4, DATABASE_V2.md §5.2.
 *
 * Will implement:
 *   GET /api/v1/reports/daily?from=&to=   — Report modal data
 *     Reads from report_daily_aggregates read model.
 *     Columns END / COMMI POINT / NTP POINT return null until formulas confirmed.
 *
 * The aggregation job that populates report_daily_aggregates is also gated
 * on client confirmation of the commission / rake formula (item 4).
 */
import { Module } from '@nestjs/common';

@Module({})
export class ReportsModule {}
