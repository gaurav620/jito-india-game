import type { GameCode, GameState, HistoryRow } from './types';

/**
 * Centralized Mock Game State
 *
 * For development and visual presentation only.
 * When real WebSocket/REST backend services are wired up,
 * these initial values are replaced by server-sent snapshots.
 */

export const MOCK_HISTORY: HistoryRow[] = [
  {
    sno: 1,
    gameId: '739TC356',
    drawTime: '19:42',
    triple: '772',
    double: '72',
    single: '2',
    played: 120,
    won: 360,
  },
  {
    sno: 2,
    gameId: '739TC355',
    drawTime: '19:40',
    triple: '285',
    double: '85',
    single: '5',
    played: 50,
    won: 0,
  },
  {
    sno: 3,
    gameId: '739TC354',
    drawTime: '19:38',
    triple: '925',
    double: '25',
    single: '5',
    played: 200,
    won: 900,
  },
  {
    sno: 4,
    gameId: '739TC353',
    drawTime: '19:36',
    triple: '633',
    double: '33',
    single: '3',
    played: 80,
    won: 0,
  },
  {
    sno: 5,
    gameId: '739TC352',
    drawTime: '19:34',
    triple: '793',
    double: '93',
    single: '3',
    played: 100,
    won: 270,
  },
  {
    sno: 6,
    gameId: '739TC351',
    drawTime: '19:32',
    triple: '355',
    double: '55',
    single: '5',
    played: 40,
    won: 0,
  },
];

export function getInitialGameState(code: GameCode = 'TCT'): GameState {
  const isPro = code === 'TCPT';
  return {
    code,
    name: isPro ? 'Triple Chance Pro Timer' : 'Triple Chance Timer',
    gameId: isPro ? '625TCP412' : '739TC357',
    phase: 'BETTING',
    secondsLeft: 73,
    pointsBalance: 62933.0,
    playStake: 0,
    winAmount: 0,
    selectedChip: 10,
    availableChips: isPro
      ? [2, 5, 10, 30, 40, 50, 100, 500]
      : [2, 5, 10, 20, 30, 40, 50, 100],
    bets: {},
    previousBets: {},
    triplesTab: 0, // starts on 000-099
    drawResult: null,
    recentHistory: MOCK_HISTORY,
    statusMessage: 'Place your chips',
  };
}
