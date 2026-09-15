# JITO INDIA GAMES — Game Engine V2 (Phase 2)

> Version: 2.0 | Date: 2026-09-09 | Status: DESIGN ONLY — NOT IMPLEMENTED
> Extends `docs/GAME_STATE_MACHINE.md` with the Phase 2 service design.

> **NOT IMPLEMENTED IN PHASE 2:** production RNG, result generation, payout calculation, settlement arithmetic. This document specifies the *envelope* those will eventually plug into, and defines the interface boundary precisely enough that adding them later is a contained change. See §6 and §7.

---

## 1. Service Boundaries

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│      services/api            │        │   services/game-engine       │
│      (N instances)           │        │   (EXACTLY ONE writer)       │
├──────────────────────────────┤        ├──────────────────────────────┤
│ • Auth, users, sessions      │        │ • Round lifecycle scheduler  │
│ • Reads round state          │        │ • State transitions          │
│ • ACCEPTS BETS               │        │ • Result ingestion           │
│ • Points debits (bets)       │        │ • Settlement orchestration   │
│ • History / reports reads    │        │ • Points credits (wins)      │
│ • Admin APIs                 │        │ • Read-model projection      │
│ • WebSocket fan-out          │        │ • Publishes to Redis pub/sub │
└──────────────┬───────────────┘        └──────────────┬───────────────┘
               │                                       │
               └───────────────┬───────────────────────┘
                               ▼
            ┌──────────────────────────────────────┐
            │   PostgreSQL (truth) + Redis (fan-out)│
            └──────────────────────────────────────┘
```

**Why the engine is a single writer for round state** (ADR-017): round transitions are a sequence of "check state, then change it" operations. Running that on N horizontally-scaled instances means two instances can both observe `BETTING_ACTIVE`, both decide to lock, and both publish a lock event and start settlement. Confining transitions to one writer removes that class of bug at the source rather than defending against it at every call site.

The API scales horizontally because everything it does is either read-only or already protected by per-row locks and idempotency keys (bet placement). It never transitions a round.

**Single-writer enforcement is layered:**
1. The engine runs as **exactly one ECS task** (desired count 1) per environment.
2. It holds a **Redis leader lock** (`lock:game-engine:{env}`, short TTL, renewed) — during a deploy overlap or a network partition, only the lock holder acts.
3. The **partial unique index** `uq_rounds_one_live_per_game` (`docs/DATABASE_V2.md` §7) makes a duplicate live round impossible even if 1 and 2 both fail.

Layer 3 is the one that actually guarantees correctness; 1 and 2 prevent the error from occurring in the first place.

---

## 2. Round State Machine

```
   ROUND_CREATED
        │  engine opens the round
        ▼
   BETTING_OPEN
        │  first bet placed (or immediately)
        ▼
   BETTING_ACTIVE ─────────────────┐
        │  server clock ≥ deadline │  admin void
        ▼                          │
   BETTING_LOCKED                  │
        │  lock period elapsed     │
        ▼                          │
   RESULT_PENDING                  │
        │  result ingested         │
        ▼                          │
   RESULT_PUBLISHED                │
        │  reveal period elapsed   │
        ▼                          │
   SETTLEMENT_PENDING              │
        │  all bets settled        │
        ▼                          ▼
   ROUND_COMPLETED            ROUND_VOID
        │                          │
        └──────────┬───────────────┘
                   ▼
            next ROUND_CREATED
```

| State | Meaning | Bets accepted? | Client renders |
|---|---|---|---|
| `ROUND_CREATED` | Row exists, not yet open | No | Preparing |
| `BETTING_OPEN` | Window open, no bets yet | **Yes** | Countdown, controls enabled |
| `BETTING_ACTIVE` | Window open, ≥1 bet placed | **Yes** | Countdown, controls enabled |
| `BETTING_LOCKED` | Deadline passed | No | "NO MORE PLAY", inputs disabled |
| `RESULT_PENDING` | Awaiting the draw value | No | Wheel spinning |
| `RESULT_PUBLISHED` | Draw known and broadcast | No | Result reveal, highlights |
| `SETTLEMENT_PENDING` | Settling bets | No | Updating balances |
| `ROUND_COMPLETED` | Fully settled and projected | No | Summary, await next |
| `ROUND_VOID` | Abandoned; all bets refunded | No | Round cancelled notice |

**Naming change from Phase 1** (ADR-015): `RESULT_GENERATION` → `RESULT_PENDING`, `SETTLEMENT` → `SETTLEMENT_PENDING`. `RESULT_PENDING` is also more accurate for Phase 2, where the server *awaits* a result from an external source rather than generating one. `ROUND_VOID` is added because there was previously no legal terminal state for a round that cannot complete, leaving bets stuck as `accepted` forever. `@jito/types`' `RoundState` enum must be updated to match.

**Illegal transitions** (rejected and alerted, never silently corrected):
- Any backward move (`BETTING_LOCKED` → `BETTING_ACTIVE`).
- Skipping `SETTLEMENT_PENDING` — every round with bets must settle or void.
- Accepting a bet in any state other than `BETTING_OPEN` / `BETTING_ACTIVE`.
- Publishing a second result for a round (blocked by `UNIQUE (round_id)`).

Transitions are guarded in SQL, and **increment `state_version` in the same statement**:

```sql
UPDATE game_rounds
   SET state = $new, state_version = state_version + 1, updated_at = now()
 WHERE id = $id AND state = $expected;
```

If zero rows update, the round was not in the expected state and the engine re-reads rather than forcing the write. Because the version bump is atomic with the state change, no transition can ever be broadcast without a fresh version, which is what the client's ordering rule depends on (ADR-023, `docs/WEBSOCKET_V2.md` §8).

---

## 3. Server Authority — Exact Split

### The server owns, exclusively:

| Concern | Notes |
|---|---|
| Round existence and `round_number` | Client never creates a round |
| **Round state and every transition** | Client only renders what it is told |
| **`betting_deadline`** | An absolute server timestamp; the only deadline that exists |
| Server clock | Broadcast for sync; client clock is never trusted |
| Betting lock | Enforced against the server clock inside the bet transaction |
| Bet validity (state, balance, limits) | Re-validated server-side on every request |
| **The result** | Ingested from a controlled source; never from a client |
| Settlement and payouts | Computed server-side only |
| Points balance | The ledger is the only truth |
| History and reports | Projected from server state |

### The client may send, and nothing else:

| Message | Payload | Server re-validates |
|---|---|---|
| Join / leave a game room | `gameId` | That the game exists and is active |
| **Place a bet** | `roundId`, selections, per-selection amounts, idempotency key | Round is current + accepting, deadline not passed (server clock), balance sufficient, amounts within limits, selections in range |
| Request timer sync | `roundId` | — |
| Request current state | `gameId` | — |

**The client never sends:** a result, a payout, a win amount, a balance, a balance delta, a deadline, a timestamp used for any decision, a round state, another user's id, or its own user id (identity comes from the token).

`roundId` is accepted only as an **assertion of intent** — "I meant to bet on this round". The server compares it to the actual current round and rejects on mismatch (`ROUND_MISMATCH`), which is what prevents a delayed request from landing on the following round.

---

## 4. Round Lifecycle Timing

```
|<──── betting window ────>|<── lock ──>|<── reveal ──>|<─ settle ─>|<─ gap ─>|
|          T_bet           |   T_lock   |   T_reveal   |  (as long   |  T_gap  |
|                          |            |              |  as needed) |         |
^ ROUND_CREATED            ^ BETTING_   ^ RESULT_      ^ SETTLEMENT_ ^ ROUND_
  → BETTING_OPEN             LOCKED       PUBLISHED      PENDING       COMPLETED
```

> **NEEDS CLIENT CONFIRMATION** — every duration above. **No timing values are invented in this design.** They are declared as named configuration constants per game variant with no defaults committed:
>
> `T_bet`, `T_lock`, `T_reveal`, `T_gap` for `triple-chance-timer` and `triple-chance-pro-timer` independently (`docs/CLIENT_REQUIREMENTS.md` items 1 and 4).

The Phase 1 UI used 73/84/90s purely as visual mock values; **those are not defaults and must not be promoted into Phase 2 configuration.**

Configuration is loaded per game at engine start and stamped onto each round when created, so a mid-flight config change never alters a round already in progress.

---

## 5. The Scheduler

The engine runs a tick (~250 ms) that advances due rounds. It is a **reconciler, not a timer**: on each tick it reads the current state from the database and derives what should happen, rather than relying on in-memory timers.

```
every tick:
  if not leader: return
  for each active game:
    round = current live round (DB)
    if none                                      → create + open next round
    if BETTING_* and now() >= betting_deadline   → transition BETTING_LOCKED
    if BETTING_LOCKED and now() >= locked_at + T_lock
                                                 → transition RESULT_PENDING
    if RESULT_PENDING and result available       → publish → RESULT_PUBLISHED
    if RESULT_PUBLISHED and now() >= published + T_reveal
                                                 → SETTLEMENT_PENDING
    if SETTLEMENT_PENDING                        → settle next batch of bets
    if SETTLEMENT_PENDING and no unsettled bets  → project game_history (one row
                                                    per USER, aggregated over that
                                                    user's bets — ADR-024), then
                                                    transition ROUND_COMPLETED
    if ROUND_COMPLETED and now() >= completed + T_gap
                                                 → create + open next round
```

**Why a reconciler:** an in-memory timer is lost on restart, deploy, or crash, stranding a round mid-lifecycle. A reconciler recovers automatically — it restarts, reads the database, sees a round that should have locked 40 seconds ago, and locks it. This makes the engine **crash-safe by construction** rather than by careful cleanup code.

Every transition is idempotent and guarded by the conditional `UPDATE`, so a duplicated tick changes nothing.

**Stall detection:** a round sitting in a non-terminal state past its expected duration by a configured margin raises an alert. `RESULT_PENDING` with no result is the case that most needs human attention, since Phase 2 has no automatic result source (§6).

---

## 6. Result Ingestion — The RNG Boundary

**Phase 2 implements no result generation.** The engine consumes results through one interface:

```typescript
/** The ONLY way a draw value enters the system. */
export interface ResultSource {
  readonly kind: 'manual' | 'external_feed' | 'certified_rng';
  /** Returns the authoritative draw for a round, or null if not yet available. */
  fetchResult(roundId: string, gameId: GameId): Promise<DrawResult | null>;
}

export interface DrawResult {
  /** The single authoritative 3-digit draw, 0–999. */
  drawValue: number;
  /** Audit handle: external draw id, operator user id, or RNG attestation. */
  sourceReference: string;
}
```

**Phase 2 ships exactly one implementation: `ManualResultSource`** — an authenticated, fully-audited admin endpoint by which an operator enters the draw for a round in `RESULT_PENDING`. This keeps the platform runnable end-to-end for UAT without inventing game mathematics or shipping an uncertified RNG.

`CertifiedRngResultSource` is **deliberately unimplemented**. Adding it requires:
1. Client confirmation of RNG algorithm and any certification/regulatory requirement (`PRD.md` item 3).
2. A new ADR.
3. Seeding, attestation, and audit design reviewed independently.

**Never** `Math.random()`. **Never** in `packages/game-core` or any client. The wheel renderer already takes the result as an input (`WheelEngine.setTargetResult`), which is exactly the shape this boundary requires — the client animates toward a number the server chose.

### The draw and its derived values

Per the reference screenshots and the Phase 1 implementation, one 3-digit number is drawn and the other categories are **derived** from it:

```
draw 772  →  Triples: 772     (all three digits)
             Doubles:  72     (last two digits)
             Singles:   2     (last digit)
```

This is recorded as an **observation of the reference material**, not a confirmed rule.

> **NEEDS CLIENT CONFIRMATION — win determination.** Does a Doubles bet on `72` win when the draw is `772`? The derivation above implies yes, but the reference win-state screenshot shows a *Triples* cell `063` paying out on a `772` draw, which the derivation does not explain (the Phase 1 UI hardcoded that pairing straight from the screenshot). Until the client resolves this, **no win-determination logic is written.** Getting this wrong means paying the wrong players.

---

## 7. Settlement — The Payout Boundary

The engine owns the settlement *envelope* (transactions, idempotency, retry, ordering, projection — all specified in `docs/POINTS_SYSTEM.md` §8). The *arithmetic* sits behind one interface with no Phase 2 implementation:

```typescript
export interface SettlementRules {
  readonly rulesVersion: string;
  /** Which of this bet's items won, given the draw. NOT IMPLEMENTED IN PHASE 2. */
  determineWinners(items: BetItem[], draw: DrawResult): WinnerDecision[];
  /** Payout for a winning item. NOT IMPLEMENTED IN PHASE 2. */
  calculatePayoutMinor(item: BetItem, decision: WinnerDecision): bigint;
  /** Commission/rake, if any. NOT IMPLEMENTED IN PHASE 2. */
  calculateCommissionMinor(totalBetMinor: bigint, totalWinMinor: bigint): bigint;
}
```

Phase 2 provides **no** concrete `SettlementRules`. A round can be driven to `SETTLEMENT_PENDING` in a test environment with a stub that pays nothing, purely to exercise the transactional machinery. Production settlement stays disabled until multipliers, the win rule, and commission structure are confirmed and an ADR records them.

`rulesVersion` is stamped on every `settlements` row so a future rule change never reinterprets historical settlements.

---

## 8. Round Void & Refunds

`ROUND_VOID` exists so a round that cannot complete has a legal terminal state.

Triggers: no result available past the stall threshold and an operator voids it; a data-integrity failure; an explicit admin void (always audited).

### Precondition: a round may only be voided while it has zero settlements

**Void is permitted only when `SELECT COUNT(*) FROM settlements WHERE round_id = $1` is `0`**, checked in the endpoint *and* re-checked inside the void transaction while holding the round row lock. Attempting to void a round with any settlement returns `409 ROUND_PARTIALLY_SETTLED`.

Without this precondition, voiding a round in `SETTLEMENT_PENDING` that had already credited some winners would refund **everyone** while those winners kept their payouts — creating points from nothing. The ledger would remain internally consistent (every entry still has a cause), which is precisely what makes this dangerous: nothing would flag it, and the round's economics would simply be wrong.

There is deliberately **no automatic reversal path** for a partially-settled round. Unwinding settled bets requires compensating ledger entries (never edits to history) and a decision about whether winners keep their credits — a business question with no confirmed answer. If such a requirement emerges, it needs its own design and ADR. In practice a partially-settled round should be *completed*, not voided: the remaining bets are settled by retry, which is what the resumable design already does.

On void, every `accepted` bet is refunded via a `bet_refund` credit keyed `refund:{roundId}:{betId}` — same idempotency guarantees as settlement, so the refund pass is safely resumable. Bets move to `refunded`, the round transitions to `ROUND_VOID` (incrementing `state_version`), and it emits `game.round.void`.

Voiding is **never automatic on a settlement error**. A settlement failure is retried and alerted; auto-voiding a round that was partially settled would compound one failure into a much worse one — and is now structurally blocked by the precondition above.

---

## 9. Failure Handling

| Failure | Response |
|---|---|
| Engine crash mid-round | Restart, reconcile from DB, resume (§5) |
| Two engine instances | Leader lock + partial unique index prevent divergence |
| Result unavailable at `RESULT_PENDING` | Stay in state, alert; operator supplies or voids |
| Settlement fails for one bet | Retry that bet; others unaffected (per-bet transactions) |
| Settlement fails repeatedly | Alert, hold round in `SETTLEMENT_PENDING`; never auto-void |
| DB unavailable | Engine stops transitioning; API rejects bets; no state advances blind |
| Redis unavailable | Broadcasts degrade; **state transitions continue** (Postgres is truth) |
| Clock skew between services | All timestamps come from Postgres `now()`, not app servers |

Taking timestamps from the database rather than application hosts means a skewed ECS task cannot lock a round early or late — there is exactly one clock in the system that matters.

---

## 10. Open Items

| # | Item | Blocks |
|---|------|--------|
| 1 | `T_bet`, `T_lock`, `T_reveal`, `T_gap` per variant | Scheduler configuration |
| 2 | Timer vs Pro Timer rule/timing differences | Pro variant behaviour |
| 3 | Win-determination rule (§6) | `SettlementRules.determineWinners` |
| 4 | Payout multipliers per category | `calculatePayoutMinor` |
| 5 | Commission / rake structure | `calculateCommissionMinor` |
| 6 | RNG algorithm and certification requirements | `CertifiedRngResultSource` |
| 7 | Max bet per selection / per round | Bet validation |
| 8 | Operating hours — 24/7 or scheduled? | Round creation policy |
