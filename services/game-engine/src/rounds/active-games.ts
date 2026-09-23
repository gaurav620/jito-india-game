/**
 * Games the round-lifecycle reconciler manages (docs/GAME_ENGINE_V2.md §5).
 *
 * Both variants currently share identical, UNCONFIRMED timing
 * (docs/CLIENT_REQUIREMENTS.md items 1 and 4) — no Timer vs Pro Timer
 * difference is invented here. If the client confirms a real difference,
 * this is the single place a per-game override would be introduced.
 */
import { GameId } from '@jito/types';

export const ACTIVE_GAME_IDS: readonly GameId[] = [GameId.TripleChanceTimer, GameId.TripleChanceProTimer];
