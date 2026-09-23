/**
 * Game Service Type Definitions & Contracts
 *
 * Defines models for Triple Chance Timer (`TCT`) and Triple Chance Pro Timer (`TCPT`).
 * Pure frontend contract designed to decouple UI components from future backend APIs.
 */

export type GameCode = 'TCT' | 'TCPT';

export type BetType = 'single' | 'double' | 'triple';

export type GamePhase = 'BETTING' | 'DRAWING' | 'RESULT';

export interface DrawResult {
  triple: number; // 0–999
  double: number; // 0–99
  single: number; // 0–9
}

export interface HistoryRow {
  sno: number;
  gameId: string;
  drawTime: string;
  triple: string;
  double: string;
  single: string;
  played?: number;
  won?: number;
}

export interface ReportRow {
  date: string;
  sale: number;
  win: number;
  end: number;
  commission: number;
  ntp: number;
}

export interface GameState {
  code: GameCode;
  name: string;
  gameId: string;
  phase: GamePhase;
  secondsLeft: number;
  pointsBalance: number;
  playStake: number;
  winAmount: number;
  selectedChip: number;
  availableChips: number[];
  bets: Record<string, number>;
  previousBets: Record<string, number>;
  triplesTab: number; // 0..9 (representing hundreds: 000, 100, ..., 900)
  drawResult: DrawResult | null;
  recentHistory: HistoryRow[];
  statusMessage: string;
}

export interface PlaceBetRequest {
  type: BetType;
  value: number;
  amount: number;
}

export interface PlaceBetResult {
  success: boolean;
  error?: string;
  newBalance?: number;
  totalPlay?: number;
}
