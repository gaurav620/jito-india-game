/**
 * Games module — scaffold for Phase 2A.
 *
 * Full implementation deferred to Phase 2B (step 6 of the implementation plan).
 *
 * Will implement:
 *   GET /api/v1/games                          — list active games
 *   GET /api/v1/games/:gameId                  — game details + limits
 *   GET /api/v1/games/:gameId/current-round    — current round state (REST snapshot)
 *   GET /api/v1/games/:gameId/recent-results   — last N draws (history strip)
 *
 * /games/:gameId/current-round is also the reconnect/cold-start path and the
 * polling fallback when WebSockets are unavailable (docs/API_V2.md §5).
 */
import { Module } from '@nestjs/common';

@Module({})
export class GamesModule {}
