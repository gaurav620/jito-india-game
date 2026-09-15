/**
 * Game-related types for JITO INDIA GAMES.
 *
 * Phase 2 — Updated per docs/DATABASE_V2.md, docs/GAME_ENGINE_V2.md, and ADRs 014–025.
 *
 * NOTE: Payout rates, timing values, win-determination rules, and commission
 * structure are NOT implemented — these remain NEEDS CLIENT CONFIRMATION.
 * See docs/CLIENT_REQUIREMENTS.md items 1–9.
 */

/** Available game identifiers */
export enum GameId {
  TripleChanceTimer = 'triple-chance-timer',
  TripleChanceProTimer = 'triple-chance-pro-timer',
}

/**
 * Game round lifecycle states.
 *
 * Phase 2 naming (ADR-015):
 *   ResultGeneration → ResultPending (engine awaits draw, does not generate)
 *   Settlement       → SettlementPending
 *   Added: Void      (terminal state when round cannot complete — ADR-015)
 */
export enum RoundState {
  Created = 'ROUND_CREATED',
  BettingOpen = 'BETTING_OPEN',
  BettingActive = 'BETTING_ACTIVE',
  BettingLocked = 'BETTING_LOCKED',
  /** Engine awaits a draw value from a controlled source. No RNG in Phase 2. */
  ResultPending = 'RESULT_PENDING',
  ResultPublished = 'RESULT_PUBLISHED',
  SettlementPending = 'SETTLEMENT_PENDING',
  Completed = 'ROUND_COMPLETED',
  /** Terminal state for rounds that cannot complete. Zero settlements required. */
  Void = 'ROUND_VOID',
}

/** Betting categories */
export enum BetCategory {
  Singles = 'singles',
  Doubles = 'doubles',
  Triples = 'triples',
}

/**
 * Bet status.
 * NOTE: `rejected` is NOT used — bets are only inserted when accepted;
 * rejected requests are refused before any DB write (M2 — dead value removed).
 */
export enum BetStatus {
  Accepted = 'accepted',
  Settled = 'settled',
  Refunded = 'refunded',
}

/** Source from which a draw value enters the system. No RNG in Phase 2 (ADR-018). */
export enum ResultSource {
  Manual = 'manual',
  ExternalFeed = 'external_feed',
  CertifiedRng = 'certified_rng',
}

/** Game definition */
export interface Game {
  id: GameId;
  name: string;
  description: string;
  isActive: boolean;
  /** NEEDS CLIENT CONFIRMATION: min/max bet limits */
  minBetMinor: number | null;
  maxBetMinor: number | null;
}

/**
 * Monotonic version counter carried by every round-state payload (ADR-023).
 * Clients apply a payload only when stateVersion > lastAppliedVersion.
 */
export interface RoundVersioned {
  roundId: string;
  stateVersion: number;
}

/** Game round (V2 — all monetary values are BIGINT centipoints) */
export interface GameRound {
  id: string;
  gameId: GameId;
  roundNumber: number;
  /** Player-facing human-readable round code, e.g. '736TC658' */
  displayCode: string;
  state: RoundState;
  /** Monotonic; incremented atomically on every state transition (ADR-023) */
  stateVersion: number;
  opensAt: string;
  /** The ONE authoritative deadline — never set or trusted from the client */
  bettingDeadline: string;
  lockedAt: string | null;
  resultPublishedAt: string | null;
  settledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Individual bet item (one cell on the betting grid).
 * Phase 2: selection is a single integer, not an array.
 * Phase 1 compat: the old array shape is kept on the legacy BetItemV1 alias.
 */
export interface BetItem {
  id: string;
  betId: string;
  category: BetCategory;
  /** singles: 0–9, doubles: 0–99, triples: 0–999 */
  selection: number;
  /** Amount staked — BIGINT centipoints (ADR-014) */
  amountMinor: bigint;
  /** NULL until settled */
  isWinner: boolean | null;
  /** NULL until settled; always >= 0 when set */
  payoutMinor: bigint | null;
  createdAt: string;
}

/** Bet (one POST /bets request — may contain multiple items) */
export interface Bet {
  id: string;
  userId: string;
  roundId: string;
  /** Sum of all bet_items.amount_minor */
  totalAmountMinor: bigint;
  status: BetStatus;
  /** Mandatory on all Phase 2 bets (ADR-025) */
  idempotencyKey: string;
  acceptedAt: string;
  createdAt: string;
}

/** Place bet request (V2) */
export interface PlaceBetRequest {
  roundId: string;
  gameId: GameId;
  items: Array<{
    category: BetCategory;
    /** singles: 0–9, doubles: 0–99, triples: 0–999 */
    selection: number;
    amountMinor: number;
  }>;
}

/**
 * Game result.
 * Phase 2: one 3-digit draw (0–999). Doubles/singles are derived, not drawn
 * separately. Win-determination rule NEEDS CLIENT CONFIRMATION (ADR-018).
 */
export interface GameResult {
  id: string;
  roundId: string;
  /** Single authoritative draw: 0–999 */
  drawValue: number;
  source: ResultSource;
  /** External draw id, operator user id, or RNG attestation handle */
  sourceReference: string | null;
  publishedAt: string;
  createdAt: string;
}

/**
 * Settlement record (one per bet).
 * UNIQUE (bet_id) — a bet can be settled exactly once (prevents duplicate settlement).
 * Phase 2: no payout arithmetic implemented (ADR-018).
 */
export interface Settlement {
  id: string;
  roundId: string;
  betId: string;
  userId: string;
  totalBetMinor: bigint;
  totalWinMinor: bigint;
  /** net_minor = total_win_minor - total_bet_minor */
  netMinor: bigint;
  /** Stamps which ruleset produced this row — no retroactive reinterpretation */
  rulesVersion: string;
  settledAt: string;
}

/**
 * Game history entry (player-facing read model — V2 shape).
 * One row per user per settled round, projected at ROUND_COMPLETED (ADR-024).
 * Aggregates all of that user's bets in the round.
 */
export interface GameHistoryEntry {
  id: string;
  userId: string;
  roundId: string;
  gameId: GameId;
  displayCode: string;
  drawValue: number;
  /** SUM of that user's bets.total_amount_minor */
  playedMinor: bigint;
  /** SUM of that user's settlements.total_win_minor */
  wonMinor: bigint;
  completedAt: string;
}

// ---------------------------------------------------------------------------
// Phase 1 backward-compatibility aliases (used by apps/web and apps/admin)
// These SHOULD NOT be used in new Phase 2 code.
// ---------------------------------------------------------------------------

/** @deprecated Use BetItem. Phase 1 compat alias only. */
export interface BetItemV1 {
  id: string;
  category: BetCategory;
  selection: number[];
  amount: number;
  isWinner?: boolean;
  payout?: number;
}

/** @deprecated Use Bet with amountMinor. Phase 1 compat alias only. */
export interface BetV1 {
  id: string;
  userId: string;
  roundId: string;
  items: BetItemV1[];
  totalAmount: number;
  status: BetStatus;
  createdAt: string;
}

/** @deprecated Use PlaceBetRequest (Phase 2). Phase 1 compat alias only. */
export interface PlaceBetRequestV1 {
  roundId: string;
  gameId: GameId;
  items: Array<{
    category: BetCategory;
    selection: number[];
    amount: number;
  }>;
}

/** @deprecated Use GameResult with drawValue. Phase 1 compat alias only. */
export interface GameResultV1 {
  id: string;
  roundId: string;
  resultData: {
    singles: number[];
    doubles: number[][];
    triples: number[][];
  };
  winningNumbers: number[];
  generatedAt: string;
}
