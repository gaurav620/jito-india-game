/**
 * Game-related types for JITO INDIA GAMES.
 *
 * NOTE: Payout rates, timing values, and number ranges are marked as
 * placeholder constants. Actual values NEED CLIENT CONFIRMATION.
 */

/** Available game identifiers */
export enum GameId {
  TripleChanceTimer = 'triple-chance-timer',
  TripleChanceProTimer = 'triple-chance-pro-timer',
}

/** Game round lifecycle states */
export enum RoundState {
  Created = 'ROUND_CREATED',
  BettingOpen = 'BETTING_OPEN',
  BettingActive = 'BETTING_ACTIVE',
  BettingLocked = 'BETTING_LOCKED',
  ResultGeneration = 'RESULT_GENERATION',
  ResultPublished = 'RESULT_PUBLISHED',
  Settlement = 'SETTLEMENT',
  Completed = 'ROUND_COMPLETED',
}

/** Betting categories */
export enum BetCategory {
  Singles = 'singles',
  Doubles = 'doubles',
  Triples = 'triples',
}

/** Game definition */
export interface Game {
  id: GameId;
  name: string;
  description: string;
  isActive: boolean;
  minBet: number;
  maxBet: number;
}

/** Game round */
export interface GameRound {
  id: string;
  gameId: GameId;
  roundNumber: number;
  state: RoundState;
  startTime: string;
  bettingDeadline: string;
  lockTime?: string;
  resultTime?: string;
  completedAt?: string;
  createdAt: string;
}

/** Individual bet item */
export interface BetItem {
  id: string;
  category: BetCategory;
  selection: number[];
  amount: number;
  isWinner?: boolean;
  payout?: number;
}

/** Bet (collection of bet items for a round) */
export interface Bet {
  id: string;
  userId: string;
  roundId: string;
  items: BetItem[];
  totalAmount: number;
  status: BetStatus;
  createdAt: string;
}

/** Bet status */
export enum BetStatus {
  Pending = 'pending',
  Settled = 'settled',
  Cancelled = 'cancelled',
}

/** Place bet request */
export interface PlaceBetRequest {
  roundId: string;
  gameId: GameId;
  items: Array<{
    category: BetCategory;
    selection: number[];
    amount: number;
  }>;
}

/** Game result */
export interface GameResult {
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

/** Settlement record */
export interface Settlement {
  id: string;
  roundId: string;
  userId: string;
  betId: string;
  totalBet: number;
  totalWin: number;
  netAmount: number;
  settledAt: string;
}

/** Game history entry (player-facing) */
export interface GameHistoryEntry {
  roundId: string;
  gameId: GameId;
  roundNumber: number;
  result: GameResult;
  playerBets: Bet[];
  totalBet: number;
  totalWin: number;
  completedAt: string;
}
