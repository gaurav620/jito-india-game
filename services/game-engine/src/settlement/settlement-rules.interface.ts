/**
 * SettlementRules interface — the ONLY place payout arithmetic may live.
 *
 * NOT IMPLEMENTED IN PHASE 2. Not even a stub implementation exists.
 *
 * Reason: implementing any concrete version now would require inventing
 * win-determination rules and payout multipliers that the client has not
 * confirmed. Getting this wrong means paying the wrong players — a trust
 * and financial integrity problem.
 *
 * NEEDS CLIENT CONFIRMATION (docs/CLIENT_REQUIREMENTS.md):
 *   Item 2: Payout multipliers per category (singles/doubles/triples)
 *   Item 3: Win-determination rule — does Doubles 72 win on draw 772?
 *   Item 4: Commission / rake structure
 *
 * The settlement envelope (transactions, idempotency, retry, ordering,
 * projection — docs/POINTS_SYSTEM.md §8) will be built in Phase 2B (step 10)
 * but the arithmetic inside this interface stays unimplemented until the
 * client confirms items 2–4.
 *
 * rulesVersion on every settlements row ensures that when rules are confirmed
 * and this is implemented, historical settlements are never retroactively
 * reinterpreted (DATABASE_V2.md §4.9).
 *
 * See: docs/GAME_ENGINE_V2.md §7, ADR-018.
 */

import type { BetCategory } from '@jito/types';

import type { DrawResult } from '../result/result-source.interface';

/** A single bet item for settlement input */
export interface SettlableBetItem {
  id: string;
  category: BetCategory;
  selection: number;
  amountMinor: bigint;
}

/** The server's determination of whether a bet item won */
export interface WinnerDecision {
  betItemId: string;
  isWinner: boolean;
}

/**
 * Settlement rules interface.
 * Implementations are versioned and stamped on every settlements row.
 * There are ZERO concrete implementations in Phase 2.
 */
export interface SettlementRules {
  /** Identifies this ruleset — stamped on every settlements row */
  readonly rulesVersion: string;

  /**
   * Which of this bet's items won, given the draw.
   * NOT IMPLEMENTED IN PHASE 2.
   * NEEDS CLIENT CONFIRMATION: win-determination rule (item 3).
   */
  determineWinners(items: SettlableBetItem[], draw: DrawResult): WinnerDecision[];

  /**
   * Payout for a winning bet item.
   * NOT IMPLEMENTED IN PHASE 2.
   * NEEDS CLIENT CONFIRMATION: payout multipliers per category (item 2).
   */
  calculatePayoutMinor(item: SettlableBetItem, decision: WinnerDecision): bigint;

  /**
   * Commission / rake, if any.
   * NOT IMPLEMENTED IN PHASE 2.
   * NEEDS CLIENT CONFIRMATION: commission / rake structure (item 4).
   */
  calculateCommissionMinor(totalBetMinor: bigint, totalWinMinor: bigint): bigint;
}
