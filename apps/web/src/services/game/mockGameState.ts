import type { GameCode, GameState, HistoryRow } from './types';

/**
 * Centralized Mock Game State
 *
 * Visual presentation matching reference game state.
 * When real WebSocket/REST backend services are wired up,
 * these initial values are replaced by server-sent snapshots.
 */

export const MOCK_HISTORY: HistoryRow[] = [
  {
    sno: 1,
    gameId: '745TC693',
    drawTime: '21:48',
    triple: '751',
    double: '51',
    single: '1',
    played: 120,
    won: 360,
  },
  {
    sno: 2,
    gameId: '745TC692',
    drawTime: '21:46',
    triple: '314',
    double: '14',
    single: '4',
    played: 50,
    won: 0,
  },
  {
    sno: 3,
    gameId: '745TC691',
    drawTime: '21:44',
    triple: '050',
    double: '50',
    single: '0',
    played: 200,
    won: 900,
  },
  {
    sno: 4,
    gameId: '745TC690',
    drawTime: '21:42',
    triple: '571',
    double: '71',
    single: '1',
    played: 80,
    won: 0,
  },
  {
    sno: 5,
    gameId: '745TC689',
    drawTime: '21:40',
    triple: '929',
    double: '29',
    single: '9',
    played: 100,
    won: 270,
  },
  {
    sno: 6,
    gameId: '745TC688',
    drawTime: '21:38',
    triple: '853',
    double: '53',
    single: '3',
    played: 40,
    won: 0,
  },
];

export function getInitialGameState(code: GameCode = 'TCT'): GameState {
  const isPro = code === 'TCPT';
  return {
    code,
    name: isPro ? 'Triple Chance Pro Timer' : 'Triple Chance Timer',
    gameId: isPro ? '625TCP412' : '745TC694',
    phase: 'BETTING',
    secondsLeft: 37,
    pointsBalance: 167249.0,
    playStake: 0,
    winAmount: 0,
    selectedChip: 2,
    availableChips: isPro
      ? [2, 5, 10, 30, 40, 50, 100, 500]
      : [2, 5, 10, 20, 30, 40, 50, 100, 500],
    bets: {},
    previousBets: {},
    triplesTab: 0, // starts on 000-099
    drawResult: null,
    recentHistory: MOCK_HISTORY,
    statusMessage: 'Place your chips',
  };
}

export const WIN_HISTORY: HistoryRow[] = [
  {
    sno: 1,
    gameId: '745TC694',
    drawTime: '21:50',
    triple: '131',
    double: '31',
    single: '1',
    played: 56,
    won: 18,
  },
  ...MOCK_HISTORY.slice(0, 5),
];

export function getWinGameState(code: GameCode = 'TCT'): GameState {
  const isPro = code === 'TCPT';
  return {
    code,
    name: isPro ? 'Triple Chance Pro Timer' : 'Triple Chance Timer',
    gameId: isPro ? '625TCP412' : '745TC694',
    phase: 'RESULT',
    secondsLeft: 0,
    pointsBalance: 167193.0,
    playStake: 56,
    winAmount: 18,
    selectedChip: 2,
    availableChips: isPro
      ? [2, 5, 10, 30, 40, 50, 100, 500]
      : [2, 5, 10, 20, 30, 40, 50, 100, 500],
    bets: {
      'double:4': 10,
      'double:6': 10,
      'double:31': 10,
      'double:36': 10,
      'double:51': 10,
      'double:53': 10,
      'single:1': 2,
    },
    previousBets: {},
    triplesTab: 1, // 100-199 range tab showing 131
    drawResult: {
      triple: 131,
      double: 31,
      single: 1,
    },
    recentHistory: WIN_HISTORY,
    statusMessage: 'YOU WIN',
  };
}
