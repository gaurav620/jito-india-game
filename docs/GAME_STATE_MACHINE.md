# JITO INDIA GAMES — Game State Machine

> [!WARNING]
> **SUPERSEDED for Phase 2 onward by [`docs/GAME_ENGINE_V2.md`](./GAME_ENGINE_V2.md) §2.**
> Retained as the Phase 1 historical record. Where this document and `GAME_ENGINE_V2.md`
> disagree, **`GAME_ENGINE_V2.md` is authoritative.** Known divergences: `RESULT_GENERATION`
> is renamed `RESULT_PENDING`, `SETTLEMENT` is renamed `SETTLEMENT_PENDING`, and a terminal
> `ROUND_VOID` state is added (ADR-015). Do not implement from this file.

> Defines all valid game states and transitions.

---

## 1. Round States

```
  ROUND_CREATED
       │
       ▼
  BETTING_OPEN
       │
       ▼
  BETTING_ACTIVE
       │
       ▼
  BETTING_LOCKED
       │
       ▼
  RESULT_GENERATION
       │
       ▼
  RESULT_PUBLISHED
       │
       ▼
  SETTLEMENT
       │
       ▼
  ROUND_COMPLETED
       │
       ▼
  NEXT_ROUND (→ ROUND_CREATED)
```

---

## 2. State Definitions

| State | Description | Client Behavior |
|-------|-------------|-----------------|
| `ROUND_CREATED` | Server initializes new round | Prepare UI |
| `BETTING_OPEN` | Betting window is open | Enable bet controls |
| `BETTING_ACTIVE` | Players actively placing bets | Countdown visible, bets accepted |
| `BETTING_LOCKED` | Deadline passed, no more bets | "NO MORE PLAY", all inputs disabled |
| `RESULT_GENERATION` | Server computing result | Wheel spinning animation |
| `RESULT_PUBLISHED` | Result available | Show winning numbers, highlight |
| `SETTLEMENT` | Server processing payouts | Update balances |
| `ROUND_COMPLETED` | Round fully processed | Show summary, prepare next |

---

## 3. Valid Transitions

| From | To | Trigger |
|------|----|---------|
| `ROUND_CREATED` | `BETTING_OPEN` | Server starts round |
| `BETTING_OPEN` | `BETTING_ACTIVE` | First bet placed (or immediate) |
| `BETTING_ACTIVE` | `BETTING_LOCKED` | Server deadline reached |
| `BETTING_LOCKED` | `RESULT_GENERATION` | Lock period elapsed |
| `RESULT_GENERATION` | `RESULT_PUBLISHED` | Result computed |
| `RESULT_PUBLISHED` | `SETTLEMENT` | Display period elapsed |
| `SETTLEMENT` | `ROUND_COMPLETED` | All settlements processed |
| `ROUND_COMPLETED` | `ROUND_CREATED` | Next round begins |

---

## 4. Invalid Transitions

- Cannot go from `BETTING_LOCKED` back to `BETTING_ACTIVE`
- Cannot go from `RESULT_PUBLISHED` back to `BETTING_OPEN`
- Cannot skip `SETTLEMENT` — every round must be settled
- Cannot accept bets during any state other than `BETTING_OPEN` / `BETTING_ACTIVE`

---

## 5. Client State Sync

- Client receives state via WebSocket events
- On reconnect, client fetches current round state via REST API
- Client interpolates countdown from server-provided deadline timestamp
- Client never determines state transitions — only renders them

---

## 6. Error States

| Error | Handling |
|-------|----------|
| Round creation failure | Retry with backoff, alert admin |
| Bet rejection | Notify client with reason |
| Result generation failure | Retry, alert admin, pause game |
| Settlement failure | Retry in transaction, alert admin |
| State transition failure | Log, alert admin, manual intervention |

---

## 7. Timing Diagram

> **NEEDS CLIENT CONFIRMATION**: Exact durations

```
|<-- Betting Window -->|<- Lock ->|<- Result ->|<- Settle ->|<- Gap ->|
|      ??s              |   ??s    |    ??s     |   instant  |  ??s    |
```
