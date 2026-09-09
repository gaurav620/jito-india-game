# JITO INDIA GAMES — WebSocket Specification

> [!WARNING]
> **SUPERSEDED for Phase 2 onward by [`docs/WEBSOCKET_V2.md`](./WEBSOCKET_V2.md).**
> Retained as the Phase 1 historical record. Where this document and `WEBSOCKET_V2.md`
> disagree, **`WEBSOCKET_V2.md` is authoritative.** Known divergences: the `game.bet.place`
> client event is **removed** (bets are REST-only, ADR-016), `wallet.updated` is now
> `points.updated`, `game.result.started` is now `game.result.pending`, the result payload
> is a single `drawValue`, and all round-state payloads carry a `stateVersion`.
> Do not implement from this file.

> Real-time game communication layer.

---

## 1. Connection

```
ws://localhost:3001/game
wss://jitoindia.com/game   (production)
```

### Authentication

WebSocket connection requires a valid JWT token:

```javascript
const socket = io('/game', {
  auth: { token: 'Bearer <jwt>' }
});
```

---

## 2. Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `game.round.started` | `{ roundId, gameId, startTime, deadline }` | New round begins |
| `game.timer.sync` | `{ roundId, serverTime, deadline }` | Timer synchronization |
| `game.bet.accepted` | `{ betId, roundId, updatedBalance }` | Bet confirmed |
| `game.bet.rejected` | `{ roundId, reason }` | Bet rejected |
| `game.betting.locked` | `{ roundId, lockTime }` | Betting deadline reached |
| `game.result.started` | `{ roundId }` | Result generation started |
| `game.result.published` | `{ roundId, result, winningNumbers }` | Result available |
| `game.settlement.completed` | `{ roundId, settlements[], balance }` | Settlement done |
| `game.round.completed` | `{ roundId, nextRoundId }` | Round fully complete |
| `wallet.updated` | `{ balance, lastTransaction }` | Balance change |
| `connection.state` | `{ status, serverTime }` | Connection health |

---

## 3. Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `game.join` | `{ gameId }` | Join a game room |
| `game.leave` | `{ gameId }` | Leave a game room |
| `game.bet.place` | `{ roundId, bets[] }` | Place bet (alt to REST) |
| `game.timer.request-sync` | `{ roundId }` | Request timer sync |

---

## 4. Payload Schemas

### Round Started

```typescript
interface RoundStartedPayload {
  roundId: string;
  gameId: string;
  startTime: string;       // ISO 8601 server timestamp
  deadline: string;         // ISO 8601 betting deadline
  roundNumber: number;
}
```

### Result Published

```typescript
interface ResultPublishedPayload {
  roundId: string;
  result: {
    singles: number[];
    doubles: number[][];
    triples: number[][];
  };
  winningNumbers: number[];
}
```

### Settlement Completed

```typescript
interface SettlementPayload {
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
```

---

## 5. Reconnection Strategy

1. Client detects disconnect
2. Automatic reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
3. On reconnect, re-authenticate with JWT
4. Fetch current round state via REST (`GET /games/:gameId/current-round`)
5. Re-join game room
6. Sync timer from server

---

## 6. Versioning

All payloads include a `version` field for forward compatibility:

```json
{
  "version": 1,
  "event": "game.round.started",
  "data": { ... }
}
```
