/**
 * ResultSource interface — the ONLY way a draw value enters the system.
 *
 * Phase 2 implements ONLY ManualResultSource (admin enters the draw via API).
 * CertifiedRngResultSource is deliberately NOT implemented (ADR-018):
 *   requires client confirmation of RNG algorithm, certification, seeding, and
 *   attestation design before any code is written.
 *
 * Math.random() is NEVER acceptable here or anywhere in the codebase.
 * The wheel renderer already accepts a result as input, so the client-side
 * implementation requires no changes when an RNG is eventually added.
 *
 * See: docs/GAME_ENGINE_V2.md §6, ADR-018.
 */

import type { GameId } from '@jito/types';

/** The single authoritative draw for a round */
export interface DrawResult {
  /** One 3-digit number, 0–999 */
  drawValue: number;
  /**
   * Audit handle: external draw id, operator user id, or RNG attestation.
   * Stored in game_results.source_reference.
   */
  sourceReference: string | null;
}

/**
 * Contract: the only way a draw value enters the system.
 * All implementations must be deterministic, auditable, and server-side only.
 */
export interface ResultSource {
  readonly kind: 'manual' | 'external_feed' | 'certified_rng';
  /**
   * Returns the authoritative draw for a round, or null if not yet available.
   * Called by the reconciling scheduler when a round is in RESULT_PENDING.
   */
  fetchResult(roundId: string, gameId: GameId): Promise<DrawResult | null>;
}

/**
 * ManualResultSource stub.
 *
 * Phase 2 ships manual-only result entry — an authenticated admin submits
 * the draw via POST /api/v1/admin/rounds/:id/result.
 *
 * This stub deliberately throws because no production result source
 * implementation exists yet. Callers must not silently receive null.
 *
 * NOT IMPLEMENTED IN PHASE 2A. The scaffold exists so the interface boundary
 * is in place before the round lifecycle is built.
 */
export class ManualResultSource implements ResultSource {
  readonly kind = 'manual' as const;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchResult(_roundId: string, _gameId: GameId): Promise<DrawResult | null> {
    // Phase 2A review fix #17: previous comment said "returns null to satisfy
    // the interface" but the implementation THROWS (intentionally — this is not
    // yet implemented and callers must not silently receive null).
    // Phase 2B: query game_results WHERE round_id = $roundId and return the result.
    throw new Error(
      'ManualResultSource.fetchResult is not implemented in Phase 2A. ' +
        'Implement in Phase 2B (step 9) after round lifecycle is in place.',
    );
  }
}
