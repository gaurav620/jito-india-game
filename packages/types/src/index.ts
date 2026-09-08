/**
 * @jito/types — Shared TypeScript types for JITO INDIA GAMES
 *
 * This package contains all shared type definitions used across
 * the monorepo: frontend, backend, game engine, and admin.
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

// Game
export { GameId, RoundState, BetCategory, BetStatus } from './game';
export type {
  Game,
  GameRound,
  BetItem,
  Bet,
  PlaceBetRequest,
  GameResult,
  Settlement,
  GameHistoryEntry,
} from './game';

// Wallet
export { TransactionType, TransactionRefType } from './wallet';
export type { Wallet, WalletTransaction } from './wallet';

// WebSocket
export { ServerEvent, ClientEvent } from './websocket';
export type {
  BasePayload,
  RoundStartedPayload,
  TimerSyncPayload,
  BetAcceptedPayload,
  BetRejectedPayload,
  BettingLockedPayload,
  ResultPublishedPayload,
  SettlementCompletedPayload,
  RoundCompletedPayload,
  WalletUpdatedPayload,
} from './websocket';
