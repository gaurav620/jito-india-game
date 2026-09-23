import type {
  PlaceBetRequest,
  PlaceBetResult,
  GameState,
  HistoryRow,
  ReportRow,
} from './types';

/**
 * Game Service Integration Point
 *
 * Backend Status: PENDING IMPLEMENTATION
 *
 * Defines the contract for game state synchronization, bet placement,
 * draw history, and report queries.
 *
 * When the real WebSocket / Server-Sent Events / REST endpoints are available,
 * replace the placeholder methods below without needing to modify the UI components.
 */

/**
 * Validates and dispatches a bet placement.
 * Currently records bets in frontend UI state.
 */
export async function placeBet(
  request: PlaceBetRequest,
  currentState: GameState,
): Promise<PlaceBetResult> {
  if (currentState.phase !== 'BETTING') {
    return {
      success: false,
      error: 'Betting is currently closed for this round.',
    };
  }

  if (request.amount <= 0) {
    return {
      success: false,
      error: 'Invalid bet amount.',
    };
  }

  if (currentState.pointsBalance < request.amount) {
    return {
      success: false,
      error: 'Insufficient points balance.',
    };
  }

  // Simulate network dispatch delay for realistic UI state testing
  await new Promise((resolve) => setTimeout(resolve, 80));

  // Local frontend representation
  const newBalance = currentState.pointsBalance - request.amount;
  const newPlay = currentState.playStake + request.amount;

  return {
    success: true,
    newBalance,
    totalPlay: newPlay,
  };
}

/**
 * Future WebSocket / SSE Round Subscription
 *
 * Connects to live server timer, draw result announcements, and round settlements.
 */
export function subscribeToGame(
  _gameCode: string,
  _onStateChange: (patch: Partial<GameState>) => void,
): () => void {
  // Backend pending: real WebSocket subscription will go here.
  // const socket = new WebSocket(`/ws/games/${_gameCode}`);
  // socket.onmessage = ...

  return () => {
    // unsubscribe
  };
}

/**
 * Fetch draw history records for the INFO panel's RESULT tab.
 */
export async function fetchDrawHistory(_dateIso?: string): Promise<HistoryRow[]> {
  // Backend pending: replace with GET /api/v1/games/draws?date={_dateIso}
  await new Promise((resolve) => setTimeout(resolve, 150));
  return [];
}

/**
 * Fetch daily amusement account report for the REPORT tab.
 */
export async function fetchDailyReport(
  fromDateIso: string,
  toDateIso: string,
): Promise<ReportRow[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Format date as DD-MM-YYYY for display
  const formatDisplayDate = (iso: string) => {
    const parts = iso.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return iso;
  };

  // If valid date range, return a default report row (matches reference client and screenshot)
  if (fromDateIso <= toDateIso) {
    return [
      {
        date: formatDisplayDate(fromDateIso),
        sale: 0.0,
        win: 0.0,
        end: 0.0,
        commission: 0.0,
        ntp: 0.0,
      },
    ];
  }

  return [];
}
