/**
 * WebSocket event types for JITO INDIA GAMES — V2.
 *
 * Supersedes the Phase 1 shapes. See docs/WEBSOCKET_V2.md.
 *
 * Transport: Socket.IO over WSS, namespace /game.
 * Delivery: at-most-once. No event is required for correctness — clients
 * must recover from missed events via the REST snapshot endpoint.
 *
 * Key V2 changes (ADR-015, ADR-016, ADR-023):
 *   - game.result.started → game.result.pending (ADR-015)
 *   - wallet.updated      → points.updated       (ADR-014)
 *   - game.bet.place removed — bets are REST-only (ADR-016)
 *   - All round-state payloads carry stateVersion (ADR-023)
 *   - All payloads carry serverTime
 */

import type { BetCategory, BetStatus, RoundState } from './game';

// ---------------------------------------------------------------------------
// Server → Client events
// ---------------------------------------------------------------------------

/** Server → Client event names */
export enum ServerEvent {
  /** Full state snapshot — sent on join / resync */
  StateSnapshot = 'game.state.snapshot',
  RoundCreated = 'game.round.created',
  RoundStarted = 'game.round.started',
  TimerSync = 'game.timer.sync',
  BettingLocked = 'game.betting.locked',
  /** Awaiting draw — wheel spin begins (ADR-015: was game.result.started) */
  ResultPending = 'game.result.pending',
  ResultPublished = 'game.result.published',
  RoundSettling = 'game.round.settling',
  RoundCompleted = 'game.round.completed',
  /** Round voided; all accepted bets will be refunded (ADR-015) */
  RoundVoid = 'game.round.void',
  BetAccepted = 'game.bet.accepted',
  BetRejected = 'game.bet.rejected',
  SettlementCompleted = 'game.settlement.completed',
  /** Points balance changed — any cause (ADR-014: was wallet.updated) */
  PointsUpdated = 'points.updated',
  /** Access token is about to expire; client should refresh and reconnect */
  AuthExpired = 'auth.expired',
  ConnectionState = 'connection.state',
}

// ---------------------------------------------------------------------------
// Client → Server events
// ---------------------------------------------------------------------------

/**
 * Client → Server event names.
 * NOTE: game.bet.place is removed in V2 (ADR-016). Bets are REST-only.
 */
export enum ClientEvent {
  JoinGame = 'game.join',
  LeaveGame = 'game.leave',
  /** Client may request a fresh round-state snapshot */
  RequestState = 'game.state.request',
  RequestTimerSync = 'game.timer.request-sync',
}

// ---------------------------------------------------------------------------
// Base types
// ---------------------------------------------------------------------------

/** All server-sent payloads extend this. serverTime is ISO 8601 UTC. */
export interface BasePayload {
  /** Schema version — currently 2 */
  version: number;
  /** Authoritative server timestamp. Clients use this to maintain clock offset. */
  serverTime: string;
}

/**
 * Carried by every payload that conveys round state (ADR-023).
 * stateVersion is monotonic per round, incremented atomically on each transition.
 * Clients apply a payload only when stateVersion > lastAppliedVersion.
 * This resolves the join race, duplicate delivery, and out-of-order arrival.
 */
export interface RoundVersioned {
  roundId: string;
  stateVersion: number;
}

/**
 * Points are transmitted as integer centipoints (1 point = 100).
 * See docs/DATABASE_V2.md §3 and @jito/shared centipoints helpers.
 */
export type PointsMinor = number;

// ---------------------------------------------------------------------------
// Payload shapes (V2)
// ---------------------------------------------------------------------------

/**
 * Full round-state snapshot.
 * Sent immediately on game.join and on game.state.request.
 * stateVersion on the round resolves the join race (docs/WEBSOCKET_V2.md §2).
 */
export interface GameStateSnapshotPayload extends BasePayload {
  gameId: string;
  round: {
    roundId: string;
    /** Monotonic version; client resets lastAppliedVersion to this on adoption */
    stateVersion: number;
    roundNumber: number;
    displayCode: string;
    state: RoundState;
    opensAt: string;
    bettingDeadline: string;
    resultPublishedAt?: string;
  } | null;
  /** 0–999, present from RESULT_PUBLISHED */
  drawValue: number | null;
  myBets: Array<{
    betId: string;
    items: Array<{
      category: BetCategory;
      selection: number;
      amountMinor: PointsMinor;
    }>;
    totalAmountMinor: PointsMinor;
    status: BetStatus;
  }>;
  balanceMinor: PointsMinor;
  recentResults: Array<{
    displayCode: string;
    drawValue: number;
    completedAt: string;
  }>;
}

export interface RoundCreatedPayload extends BasePayload, RoundVersioned {
  gameId: string;
  roundNumber: number;
  displayCode: string;
  opensAt: string;
  bettingDeadline: string;
}

export interface RoundStartedPayload extends BasePayload, RoundVersioned {
  gameId: string;
  roundNumber: number;
  displayCode: string;
  opensAt: string;
  bettingDeadline: string;
}

export interface TimerSyncPayload extends BasePayload, RoundVersioned {
  state: RoundState;
  bettingDeadline: string;
  /** Server's remaining ms — advisory only; client derives from deadline */
  remainingMs: number;
}

export interface BettingLockedPayload extends BasePayload, RoundVersioned {
  lockedAt: string;
}

export interface ResultPendingPayload extends BasePayload, RoundVersioned {
  /** Engine awaiting draw — wheel should start spinning */
}

export interface ResultPublishedPayload extends BasePayload, RoundVersioned {
  /** THE authoritative draw: one 3-digit number, 0–999 */
  drawValue: number;
  /**
   * Server-computed derived views. Sent so every client renders identically.
   * Win-determination rule NEEDS CLIENT CONFIRMATION — see docs/GAME_ENGINE_V2.md §6.
   */
  derived: {
    triple: number;  // 0–999
    double: number;  // 0–99
    single: number;  // 0–9
  };
}

export interface RoundSettlingPayload extends BasePayload, RoundVersioned {}

export interface RoundCompletedPayload extends BasePayload, RoundVersioned {
  nextRoundId?: string;
}

export interface RoundVoidPayload extends BasePayload, RoundVersioned {
  reason: string;
  refundedBetIds: string[];
}

export interface BetAcceptedPayload extends BasePayload {
  betId: string;
  roundId: string;
  totalAmountMinor: PointsMinor;
  /** Authoritative post-bet balance */
  balanceMinor: PointsMinor;
}

export interface BetRejectedPayload extends BasePayload {
  roundId: string;
  clientRequestId?: string;
  reason: BetRejectionReason;
  message: string;
}

export type BetRejectionReason =
  | 'ROUND_NOT_ACCEPTING'
  | 'ROUND_MISMATCH'
  | 'DEADLINE_PASSED'
  | 'INSUFFICIENT_POINTS'
  | 'INVALID_SELECTION'
  | 'LIMIT_EXCEEDED'
  | 'USER_NOT_ELIGIBLE';

export interface SettlementCompletedPayload extends BasePayload {
  roundId: string;
  betId: string;
  totalBetMinor: PointsMinor;
  totalWinMinor: PointsMinor;
  netMinor: PointsMinor;
  balanceMinor: PointsMinor;
  items: Array<{
    category: BetCategory;
    selection: number;
    amountMinor: PointsMinor;
    isWinner: boolean;
    payoutMinor: PointsMinor;
  }>;
}

export interface PointsUpdatedPayload extends BasePayload {
  balanceMinor: PointsMinor;
  change: {
    direction: 'credit' | 'debit';
    amountMinor: PointsMinor;
    referenceType: string;
  };
}

// ---------------------------------------------------------------------------
// Phase 1 backward-compatibility aliases
// DEPRECATED — do not use in new Phase 2 code.
// ---------------------------------------------------------------------------

/** @deprecated Use ServerEvent. Phase 1 compat alias only. */
export const ServerEventV1 = {
  RoundStarted: 'game.round.started',
  TimerSync: 'game.timer.sync',
  BetAccepted: 'game.bet.accepted',
  BetRejected: 'game.bet.rejected',
  BettingLocked: 'game.betting.locked',
  ResultStarted: 'game.result.started',
  ResultPublished: 'game.result.published',
  SettlementCompleted: 'game.settlement.completed',
  RoundCompleted: 'game.round.completed',
  WalletUpdated: 'wallet.updated',
  ConnectionState: 'connection.state',
} as const;

/** @deprecated Use ClientEvent. Phase 1 compat alias only. */
export const ClientEventV1 = {
  JoinGame: 'game.join',
  LeaveGame: 'game.leave',
  PlaceBet: 'game.bet.place', // REMOVED in V2 (ADR-016) — kept for Phase 1 compat only
  RequestTimerSync: 'game.timer.request-sync',
} as const;

/** @deprecated Use RoundStartedPayload (V2). Phase 1 compat alias only. */
export interface RoundStartedPayloadV1 extends BasePayload {
  roundId: string;
  gameId: string;
  startTime: string;
  deadline: string;
  roundNumber: number;
}

/** @deprecated Use TimerSyncPayload (V2). Phase 1 compat alias only. */
export interface TimerSyncPayloadV1 extends BasePayload {
  roundId: string;
  serverTime: string;
  deadline: string;
}

/** @deprecated Use PointsUpdatedPayload. Phase 1 compat alias only. */
export interface WalletUpdatedPayload extends BasePayload {
  balance: number;
  lastTransaction: {
    type: string;
    amount: number;
    description?: string;
  };
}

/** @deprecated Use RoundCompletedPayload (V2). Phase 1 compat alias only. */
export interface RoundCompletedPayloadV1 extends BasePayload {
  roundId: string;
  nextRoundId?: string;
}
