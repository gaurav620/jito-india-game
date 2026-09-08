/**
 * WebSocket event types for JITO INDIA GAMES.
 */

/** Server → Client events */
export enum ServerEvent {
  RoundStarted = 'game.round.started',
  TimerSync = 'game.timer.sync',
  BetAccepted = 'game.bet.accepted',
  BetRejected = 'game.bet.rejected',
  BettingLocked = 'game.betting.locked',
  ResultStarted = 'game.result.started',
  ResultPublished = 'game.result.published',
  SettlementCompleted = 'game.settlement.completed',
  RoundCompleted = 'game.round.completed',
  WalletUpdated = 'wallet.updated',
  ConnectionState = 'connection.state',
}

/** Client → Server events */
export enum ClientEvent {
  JoinGame = 'game.join',
  LeaveGame = 'game.leave',
  PlaceBet = 'game.bet.place',
  RequestTimerSync = 'game.timer.request-sync',
}

/** Base payload with version for forward compatibility */
export interface BasePayload {
  version: number;
}

/** Round started payload */
export interface RoundStartedPayload extends BasePayload {
  roundId: string;
  gameId: string;
  startTime: string;
  deadline: string;
  roundNumber: number;
}

/** Timer sync payload */
export interface TimerSyncPayload extends BasePayload {
  roundId: string;
  serverTime: string;
  deadline: string;
}

/** Bet accepted payload */
export interface BetAcceptedPayload extends BasePayload {
  betId: string;
  roundId: string;
  updatedBalance: number;
}

/** Bet rejected payload */
export interface BetRejectedPayload extends BasePayload {
  roundId: string;
  reason: string;
}

/** Betting locked payload */
export interface BettingLockedPayload extends BasePayload {
  roundId: string;
  lockTime: string;
}

/** Result published payload */
export interface ResultPublishedPayload extends BasePayload {
  roundId: string;
  result: {
    singles: number[];
    doubles: number[][];
    triples: number[][];
  };
  winningNumbers: number[];
}

/** Settlement completed payload */
export interface SettlementCompletedPayload extends BasePayload {
  roundId: string;
  settlements: Array<{
    betId: string;
    amount: number;
    payout: number;
    isWin: boolean;
  }>;
  balance: number;
  totalWin: number;
  totalLoss: number;
}

/** Round completed payload */
export interface RoundCompletedPayload extends BasePayload {
  roundId: string;
  nextRoundId?: string;
}

/** Wallet updated payload */
export interface WalletUpdatedPayload extends BasePayload {
  balance: number;
  lastTransaction: {
    type: string;
    amount: number;
    description?: string;
  };
}
