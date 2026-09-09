/**
 * Bets module — scaffold for Phase 2A.
 *
 * Full implementation deferred to Phase 2B (step 7 of the implementation plan).
 *
 * Will implement:
 *   POST /api/v1/bets              — place a bet (idempotent, requires Idempotency-Key)
 *   GET  /api/v1/bets/round/:id   — own bets for a round
 *   GET  /api/v1/bets/:betId      — own bet detail
 *
 * Key design decisions already approved (ADR-016, ADR-025):
 *   - Bets are REST-only (no WebSocket game.bet.place event)
 *   - Idempotency-Key header is MANDATORY (400 IDEMPOTENCY_KEY_REQUIRED if missing)
 *   - Duplicate (category, selection) pairs are merged by summing amountMinor
 *   - Rate limit: 240/min per user (sized for per-chip worst case — ADR-025)
 *   - Lock order: round → account → bet (ADR-022)
 *
 * NOT IN PHASE 2: final validation against confirmed bet limits (NEEDS CLIENT
 * CONFIRMATION item 9 — min/max bet per selection and per round).
 */
import { Module } from '@nestjs/common';

@Module({})
export class BetsModule {}
