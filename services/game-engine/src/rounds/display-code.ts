/**
 * Player-facing round display code (game_rounds.display_code — UNIQUE, NOT NULL).
 *
 * NEEDS CLIENT CONFIRMATION: the exact display-code format. Reference
 * material (docs/UI_SPEC.md, docs/API_V2.md §5/§7) shows examples like
 * "736TC658" and "623TC2314", but the full encoding (what the leading/
 * trailing digits represent) is not documented anywhere and is not
 * derivable without guessing — so it is not reproduced here.
 *
 * This generates a simple, deterministic, collision-free placeholder
 * instead: `{gamePrefix}{roundNumber}`. It is provably globally unique:
 * `round_number` is unique per `game_id` (uq_game_rounds_game_number), and
 * the two prefixes never alias (`TCP...` can never equal `TC` + digits,
 * since `P` is not a digit) — so no cross-game collision is possible either.
 */
import { GameId } from '@jito/types';

const GAME_DISPLAY_PREFIX: Record<GameId, string> = {
  [GameId.TripleChanceTimer]: 'TC',
  [GameId.TripleChanceProTimer]: 'TCP',
};

export function generateDisplayCode(gameId: GameId, roundNumber: bigint): string {
  return `${GAME_DISPLAY_PREFIX[gameId]}${roundNumber.toString()}`;
}
