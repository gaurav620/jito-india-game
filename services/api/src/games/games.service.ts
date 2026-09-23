/**
 * GamesService — read-only round-state access for services/api.
 *
 * services/api NEVER transitions a round (ADR-017) — it only reads state
 * that services/game-engine's RoundsService (the sole writer) has already
 * persisted. This is the REST equivalent of the WebSocket join snapshot
 * (docs/API_V2.md §5), and the reconnect / cold-start / no-WebSocket
 * fallback path.
 *
 * Phase 2D / Step 6 scope only: returns round identity, state, authoritative
 * timestamps, and stateVersion. `myBets` and `balanceMinor` from the full
 * documented response shape are deliberately omitted — bet placement
 * (Step 7) does not exist yet, so there is nothing truthful to return for
 * them. `drawValue` is included as always-null: no result can exist before
 * Step 9 (result ingestion), so `null` is not a guess, it is the only
 * correct value today.
 *
 * Field shape verified against docs/WEBSOCKET_V2.md's `GameStateSnapshotPayload.round`
 * (the schema `docs/API_V2.md` §5 says this endpoint mirrors) — every field
 * returned here (`roundId`, `roundNumber`, `displayCode`, `state`,
 * `stateVersion`, `opensAt`, `bettingDeadline`) is documented there.
 * `lockedAt` was REMOVED (2026-09-23 runtime-hardening pass): it is not part
 * of that round-state shape — the docs only expose it via a separate,
 * discrete WebSocket event (`BettingLockedPayload`), not as a round-state
 * field. Returning it here would be an undocumented, invented field.
 *
 * `roundNumber`/`stateVersion` are returned as plain JS numbers (2026-09-23
 * fix), not strings: `GameStateSnapshotPayload.round.roundNumber`/
 * `stateVersion` are documented as `number`, and ADR-023's whole mechanism
 * depends on `stateVersion` being numerically comparable
 * (`payload.stateVersion > lastAppliedVersion`) — returning it as a string
 * would silently break that comparison (`"10" > "9"` is false
 * lexicographically). Unlike points centipoints (genuine BIGINT financial
 * values, converted via `centipointsToNumber()` with a documented 2^53
 * caveat), a round number or a per-round transition counter can never
 * realistically approach `Number.MAX_SAFE_INTEGER`, so a direct `Number()`
 * conversion is safe here with no precision caveat.
 */
import { GameId } from '@jito/types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { RoundState } from '@prisma/client';

import { AppErrorCode } from '../common/errors';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../database/prisma.service'; // DI token — must be value import

export interface CurrentRoundData {
  round: {
    roundId: string;
    roundNumber: number;
    displayCode: string;
    /** One of RoundState's values (@jito/types) — plain string to avoid a cross-package enum mismatch with Prisma's own generated RoundState. */
    state: string;
    /** Monotonic; carried so clients can discard stale/duplicated events (ADR-023). Numeric — see file doc comment. */
    stateVersion: number;
    opensAt: string;
    /** The ONE authoritative deadline — never set or trusted from the client. */
    bettingDeadline: string;
  };
  serverTime: string;
  /** Always null until Step 9 (result ingestion) exists. */
  drawValue: number | null;
}

const TERMINAL_STATES: readonly RoundState[] = [RoundState.ROUND_COMPLETED, RoundState.ROUND_VOID];

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /games/:gameId/current-round */
  async getCurrentRound(gameIdParam: string): Promise<CurrentRoundData> {
    const gameId = this.assertKnownGameId(gameIdParam);

    const round = await this.prisma.gameRound.findFirst({
      where: { gameId, state: { notIn: [...TERMINAL_STATES] } },
      orderBy: { roundNumber: 'desc' },
    });

    if (!round) {
      // The engine has not created a live round for this game yet (e.g.
      // freshly started, or this game is not currently active) — not the
      // client's fault, but there is genuinely nothing to render.
      throw new NotFoundException(AppErrorCode.NOT_FOUND);
    }

    return {
      round: {
        roundId: round.id,
        roundNumber: Number(round.roundNumber),
        displayCode: round.displayCode,
        state: round.state,
        stateVersion: Number(round.stateVersion),
        opensAt: round.opensAt.toISOString(),
        bettingDeadline: round.bettingDeadline.toISOString(),
      },
      serverTime: new Date().toISOString(),
      drawValue: null,
    };
  }

  private assertKnownGameId(value: string): GameId {
    if (!Object.values(GameId).includes(value as GameId)) {
      throw new NotFoundException(AppErrorCode.NOT_FOUND);
    }
    return value as GameId;
  }
}
