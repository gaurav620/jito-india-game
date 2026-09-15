# JITO INDIA GAMES — WebSocket Specification V2 (Phase 2)

> Version: 2.0 | Date: 2026-09-09 | Status: DESIGN ONLY — NOT IMPLEMENTED
> Supersedes `docs/WEBSOCKET.md` for Phase 2 onward.

Transport: **Socket.IO** over WSS, namespace `/game`. Socket.IO is chosen over raw `ws` for built-in rooms, acknowledgements, reconnection with backoff, and a Redis adapter for multi-instance fan-out — all of which would otherwise be hand-rolled.

---

## 1. Architecture

```
   game-engine (single writer)
        │ publishes state changes
        ▼
   ┌─────────────────┐
   │  Redis Pub/Sub  │   ← the fan-out bus between instances
   └────────┬────────┘
            │ every API instance subscribes
   ┌────────┴────────┬──────────────────┐
   ▼                 ▼                  ▼
 api-1             api-2              api-3      (Socket.IO + Redis adapter)
   │                 │                  │
 clients           clients            clients
```

The engine never holds client sockets. It publishes domain events to Redis; API instances own the sockets and fan out to their local rooms. This keeps the engine single-writer and stateless with respect to connections, and lets the API scale independently.

**Redis is a delivery mechanism, not truth.** If a broadcast is lost, the client recovers by fetching state over REST (§8) — no game state depends on a message arriving.

---

## 2. Connection Lifecycle

```
 1. Client connects to wss://…/game with an access token in the handshake
 2. Server verifies the token (signature, expiry, aud=jito-player)
        └─ invalid → disconnect immediately, reason 'AUTH_FAILED'
 3. Server binds { userId, sessionId } to the socket, server-side
 4. Server joins the socket to room  user:{userId}
 5. Client emits game.join { gameId }
 6. Server validates the game, joins room  game:{gameId}
 7. Server immediately emits game.state.snapshot (full current state + stateVersion)
 8. Steady state: server pushes events; client applies them by stateVersion (§8)
 9. On token expiry → auth.expired → client refreshes → reconnects
10. On disconnect → client backoff-reconnects → resume at step 1
```

The **snapshot at step 7** means a newly connected or reconnected client never has to reconstruct state from a stream of deltas. Every join is a clean, complete sync.

**There is a race between steps 6 and 7**, and it is resolved by versioning rather than by ordering. The socket joins the room *before* the snapshot is queried and sent, so a round transition broadcast during that window arrives **first**, and the snapshot — read at an earlier instant — would otherwise overwrite it with older state. This window is most likely on reconnect, which is exactly when many clients reconnect at once after an instance restart.

Rather than buffering events until the snapshot is delivered (which trades this race for a harder-to-test one), every round-state payload — the snapshot included — carries a monotonic `stateVersion`, and the client discards anything not newer than what it has applied (§8, ADR-023). Ordering becomes a property of the data, correct regardless of arrival order, buffering, or duplication.

---

## 3. Authentication

```typescript
const socket = io('/game', {
  auth: { token: `Bearer ${accessToken}` },
  transports: ['websocket'],
});
```

- Verified **once at connect**. Rejected connections never join a room.
- Identity is bound **server-side** to the socket. Every inbound message is attributed to that identity — **the client never sends a user id**, so it cannot act as another user.
- The server tracks the token's `exp`. Shortly before it, the server emits `auth.expired`; the client refreshes and reconnects. Sockets are not silently dropped on expiry, because a silent drop mid-round is indistinguishable from a network failure and produces a confusing UX.
- A ban, suspension, or forced logout disconnects all of that user's sockets immediately (`docs/AUTH_V2.md` §8).

---

## 4. Rooms

| Room | Members | Carries |
|---|---|---|
| `game:{gameId}` | Everyone viewing that game | Round lifecycle, timer, results — identical for all |
| `user:{userId}` | One user's sockets (all devices) | Bet acks, that user's settlement, balance |

**Per-user data is never broadcast to a game room.** A settlement event contains a player's stake and winnings; sending the round-wide event and the private event on separate rooms makes leaking another player's figures a structural impossibility rather than a filtering step someone could forget.

---

## 5. Server → Client Events

| Event | Room | When |
|---|---|---|
| `game.state.snapshot` | socket | On join / resync — full state |
| `game.round.created` | game | New round opened |
| `game.round.started` | game | Betting opened |
| `game.timer.sync` | game | Periodic (~every 5s) + on request |
| `game.betting.locked` | game | Deadline reached → "NO MORE PLAY" |
| `game.result.pending` | game | Awaiting draw → wheel spins |
| `game.result.published` | game | Draw known |
| `game.round.settling` | game | Settlement began |
| `game.round.completed` | game | Round finished |
| `game.round.void` | game | Round voided; bets refunded |
| `game.bet.accepted` | user | Bet accepted |
| `game.bet.rejected` | user | Bet refused, with reason |
| `game.settlement.completed` | user | This user's outcome |
| `points.updated` | user | Balance changed (any cause) |
| `auth.expired` | socket | Token about to expire |
| `connection.state` | socket | Heartbeat / server time |

> Renamed from V1: `wallet.updated` → `points.updated` (points-only naming, ADR-014). `game.result.started` → `game.result.pending`, matching the `RESULT_PENDING` state (ADR-015).

---

## 6. Client → Server Events

| Event | Payload | Server re-validates |
|---|---|---|
| `game.join` | `{ gameId }` | Game exists and is active |
| `game.leave` | `{ gameId }` | — |
| `game.state.request` | `{ gameId }` | — (returns a snapshot) |
| `game.timer.request-sync` | `{ roundId }` | — |

**Bets are placed over REST (`POST /api/v1/bets`), not over WebSocket** (ADR-016). A bet is a financial mutation that needs idempotency headers, a definite HTTP status, retry semantics, and a response the client can correlate with certainty. WebSocket acknowledgements make "did my bet land?" ambiguous exactly when the network is unreliable — which is precisely when it matters. The `game.bet.place` event from V1 is **removed**.

The socket remains the delivery path for the *confirmation* (`game.bet.accepted`), so the UI still updates in real time.

---

## 7. Payload Shapes

All payloads extend `BasePayload` and carry `serverTime` so the client can maintain clock offset from any message.

```typescript
export interface BasePayload {
  version: number;              // schema version, currently 2
  serverTime: string;           // ISO 8601, authoritative
}

/**
 * Carried by EVERY payload that conveys round state, including the snapshot.
 * Monotonic per round; incremented on each state transition (game_rounds.state_version).
 * Clients apply a payload only when stateVersion > lastAppliedVersion for that round.
 */
export interface RoundVersioned {
  roundId: string;
  stateVersion: number;
}

/** Points are integer centipoints (1 point = 100). See DATABASE_V2.md §3. */
export type PointsMinor = number;

export interface GameStateSnapshotPayload extends BasePayload {
  gameId: string;
  round: {
    roundId: string;
    stateVersion: number;         // resolves the join race — see §2 and §8
    roundNumber: number;
    displayCode: string;          // e.g. '736TC658'
    state: RoundState;
    opensAt: string;
    bettingDeadline: string;      // the ONE authoritative deadline
    resultPublishedAt?: string;
  } | null;
  drawValue: number | null;       // 0–999, present from RESULT_PUBLISHED
  myBets: Array<{
    betId: string;
    items: Array<{ category: BetCategory; selection: number; amountMinor: PointsMinor }>;
    totalAmountMinor: PointsMinor;
    status: BetStatus;
  }>;
  balanceMinor: PointsMinor;
  recentResults: Array<{ displayCode: string; drawValue: number; completedAt: string }>;
}

export interface RoundStartedPayload extends BasePayload, RoundVersioned {
  gameId: string;
  roundNumber: number;
  displayCode: string;
  opensAt: string;
  bettingDeadline: string;
}

export interface TimerSyncPayload extends BasePayload, RoundVersioned {
  state: RoundState;
  bettingDeadline: string;
  /** Server's remaining ms — advisory only; the client derives from deadline. */
  remainingMs: number;
}

export interface BettingLockedPayload extends BasePayload, RoundVersioned {
  lockedAt: string;
}

export interface ResultPublishedPayload extends BasePayload, RoundVersioned {
  /** THE authoritative draw: one 3-digit number, 0–999. */
  drawValue: number;
  /** Derived views, sent so every client renders identically. */
  derived: {
    triple: number;               // 0–999  (e.g. 772)
    double: number;               // 0–99   (e.g.  72)
    single: number;               // 0–9    (e.g.   2)
  };
}

export interface BetAcceptedPayload extends BasePayload {
  betId: string;
  roundId: string;
  totalAmountMinor: PointsMinor;
  balanceMinor: PointsMinor;      // authoritative post-bet balance
}

export interface BetRejectedPayload extends BasePayload {
  roundId: string;
  clientRequestId?: string;       // correlates to the client's attempt
  reason: BetRejectionReason;
  message: string;
}

export type BetRejectionReason =
  | 'ROUND_NOT_ACCEPTING'
  | 'ROUND_MISMATCH'
  | 'DEADLINE_PASSED'
  | 'INSUFFICIENT_POINTS'
  | 'INVALID_SELECTION'
  | 'LIMIT_EXCEEDED'
  | 'USER_NOT_ELIGIBLE';

export interface SettlementCompletedPayload extends BasePayload {
  roundId: string;
  betId: string;
  totalBetMinor: PointsMinor;
  totalWinMinor: PointsMinor;
  netMinor: PointsMinor;
  balanceMinor: PointsMinor;
  items: Array<{
    category: BetCategory;
    selection: number;
    amountMinor: PointsMinor;
    isWinner: boolean;
    payoutMinor: PointsMinor;
  }>;
}

export interface PointsUpdatedPayload extends BasePayload {
  balanceMinor: PointsMinor;
  change: {
    direction: 'credit' | 'debit';
    amountMinor: PointsMinor;
    referenceType: string;
  };
}

export interface RoundVoidPayload extends BasePayload, RoundVersioned {
  reason: string;
  refundedBetIds: string[];
}
```

`ResultPublishedPayload` replaces V1's `{ singles: number[]; doubles: number[][]; triples: number[][] }`. That shape allowed states the game cannot produce (independent, mutually inconsistent category results). One `drawValue` with server-computed `derived` values means every client shows the same thing and no client re-derives it slightly differently.

---

## 8. State Version Ordering (Client Rule)

Every payload conveying round state carries `stateVersion` (`RoundVersioned`). The client keeps the last applied version per round and follows one rule:

```
on receive(payload):
    if payload.roundId !== currentRoundId:
        if payload is for a NEWER round  → adopt it, reset lastAppliedVersion
        else                             → discard (stale round)
    else if payload.stateVersion <= lastAppliedVersion:
        discard                          ← stale or duplicate
    else:
        apply(payload); lastAppliedVersion = payload.stateVersion
```

This single rule resolves three separate problems at once, which is why it is preferred over per-connection buffering:

1. **The join race** (§2) — a snapshot read before a transition carries a lower version and is correctly discarded.
2. **Duplicate delivery** — at-most-once delivery permits duplicates; a repeated version is discarded, making every client handler idempotent for free.
3. **Out-of-order arrival** — reordering across reconnects or instances cannot regress the UI.

Per-user payloads (`game.bet.accepted`, `game.settlement.completed`, `points.updated`) are **not** version-gated: they are per-socket ordered within the `user:` room and carry authoritative balances. `balanceMinor` is always taken from the most recently received such event, never computed locally.

---

## 9. Timer Synchronization

**The client never trusts its own clock**, which may be wrong by minutes, drift, or jump when a laptop sleeps or a phone changes timezone.

```
1. Every payload carries serverTime.
2. On receipt the client computes  offset = serverTime − clientReceiveTime
   (smoothed over recent samples; outliers from latency spikes discarded).
3. Countdown displayed = bettingDeadline − (clientNow + offset).
4. game.timer.sync arrives ~5s as a correction.
5. On resume from background/sleep, the client requests a fresh sync
   before rendering, rather than continuing from a stale offset.
```

The countdown is a **rendering of a server deadline**, never an independently running client timer. A client whose display drifts still cannot bet late: the deadline is enforced inside the bet transaction against the database clock (`docs/GAME_ENGINE_V2.md` §3).

Round-trip latency is not compensated beyond offset smoothing; sub-second precision is not required to render a whole-second countdown.

---

## 10. Reconnection

**Client backoff:** 1s, 2s, 4s, 8s, 16s, capped at 30s, with jitter. Jitter matters — without it, every client dropped by one instance restarting reconnects in lockstep and stampedes the replacement.

```
disconnect detected
   → show "Reconnecting…" (inputs disabled; never accept bets while offline)
   → backoff reconnect with a fresh access token (refresh first if expired)
   → on connect: re-emit game.join
   → receive game.state.snapshot  ← full resync, no delta replay
   → reconcile local UI to the snapshot (authoritative)
   → resume rendering
```

**Reconciliation rules on resync — the snapshot wins over anything older, judged by `stateVersion` (§8), never by arrival order:**
- Round changed while offline → discard local bet UI, render the new round.
- Result published while offline → skip the spin animation, show the final state. Replaying a 5-second animation for an event that already resolved would desync the player further.
- Local optimistic bets absent from `myBets` → they never landed; roll back the UI.
- Balance always taken from the snapshot, never from local arithmetic.
- The client resets `lastAppliedVersion` to the snapshot's `stateVersion` on adoption, so events already reflected in the snapshot are discarded rather than re-applied.

**Missed events are never replayed.** There is no event backlog or sequence-gap recovery: the snapshot is complete, so replay would add a second, harder-to-test recovery path with no benefit.

If the WebSocket cannot be established at all, the client falls back to polling `GET /games/:gameId/current-round`. Degraded, but playable.

---

## 11. Delivery Guarantees

| Property | Guarantee |
|---|---|
| Ordering | Per-socket ordered (Socket.IO over TCP). Cross-room ordering is **not** guaranteed |
| Delivery | At-most-once. **No event is required for correctness** |
| Duplicates | Possible; all client handlers must be idempotent |
| Truth | Always PostgreSQL. A broadcast is a notification, not a record |

If `game.result.published` is missed entirely, the player sees the result on the next `timer.sync`, the settlement event, or a resync. Nothing is lost — which is the property that lets the whole real-time layer be treated as best-effort.

---

## 12. Security

- WSS only.
- Token verified at connect; `aud` must be `jito-player` for `/game`.
- Every inbound event validated against a DTO schema before processing; malformed payloads disconnect after repeated offences.
- Inbound rate limit: 20 events/sec per socket; exceeding it disconnects.
- Max concurrent sockets per user is bounded (multi-device allowed, unbounded fan-out is not).
- Room membership is server-assigned only — a client cannot request an arbitrary room name.
- No stack traces, internal ids, or other users' data in any error payload.

---

## 13. Open Items

| # | Item | Blocks |
|---|------|--------|
| 1 | Timer sync interval (5s assumed) | Tuning under load |
| 2 | Max concurrent sockets per user | Connection policy |
| 3 | Expected concurrent users (`PRD.md` item 13) | Redis adapter + instance sizing |
| 4 | Whether spectators (no bets) may join a game room | Room policy |
