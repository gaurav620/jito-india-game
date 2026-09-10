/**
 * @jito/types — Shared TypeScript types for JITO INDIA GAMES
 *
 * Phase 2 — Updated per docs/DATABASE_V2.md, ADRs 014–025.
 *
 * POINTS-ONLY PLATFORM. No payment gateway, deposit, withdrawal, or cashout
 * types exist or may be added without a new client-confirmed ADR (ADR-011).
 */

// Common
export type {
  ApiResponse,
  ApiErrorResponse,
  PaginationMeta,
  PaginationQuery,
  SortOrder,
} from './common';

// User
export { UserStatus, UserRole } from './user';
export type {
  User,
  UserProfile,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from './user';

// Game (Phase 2 types)
export {
  GameId,
  RoundState,
  BetCategory,
  BetStatus,
  ResultSource,
} from './game';
export type {
  Game,
  GameRound,
  RoundVersioned,
  BetItem,
  Bet,
  PlaceBetRequest,
  GameResult,
  Settlement,
  GameHistoryEntry,
  // Phase 1 compat aliases
  BetItemV1,
  BetV1,
  PlaceBetRequestV1,
  GameResultV1,
} from './game';

// Points / Wallet (Phase 2: PointsAccount replaces Wallet — ADR-014)
export { TxnDirection, TransactionRefType, TransactionType } from './wallet';
export type {
  PointsAccount,
  PointsTransaction,
  // Phase 1 compat aliases
  Wallet,
  WalletTransaction,
} from './wallet';

// WebSocket (Phase 2: V2 event names and payload shapes — ADR-015, 016, 023)
export { ServerEvent, ClientEvent } from './websocket';
export type {
  BasePayload,
  RoundVersioned as WsRoundVersioned,
  PointsMinor,
  GameStateSnapshotPayload,
  RoundCreatedPayload,
  RoundStartedPayload,
  TimerSyncPayload,
  BettingLockedPayload,
  ResultPendingPayload,
  ResultPublishedPayload,
  RoundSettlingPayload,
  RoundCompletedPayload,
  RoundVoidPayload,
  BetAcceptedPayload,
  BetRejectedPayload,
  BetRejectionReason,
  SettlementCompletedPayload,
  PointsUpdatedPayload,
  // Phase 1 compat aliases
  WalletUpdatedPayload,
  RoundStartedPayloadV1,
  TimerSyncPayloadV1,
  RoundCompletedPayloadV1,
} from './websocket';
