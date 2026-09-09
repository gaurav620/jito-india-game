# JITO INDIA GAMES — Points System (Phase 2)

> Version: 1.0 | Date: 2026-09-09 | Status: DESIGN ONLY — NOT IMPLEMENTED
> Supersedes `docs/WALLET.md`, whose open question "is this real currency or points?" is now **CONFIRMED: points only** (ADR-011).

> **There is no payment gateway, deposit, withdrawal, cashout, or real-money wallet.** Points enter the system exclusively through an authenticated admin adjustment, and leave it exclusively through gameplay. There is no other inflow or outflow, and none may be added without a new client-confirmed ADR.

---

## 1. The Core Model

```
        ┌──────────────────────────────────────────────┐
        │  points_transactions  (append-only ledger)   │
        │  the TRUTH — never updated, never deleted    │
        └──────────────────────┬───────────────────────┘
                               │ projected into
                               ▼
        ┌──────────────────────────────────────────────┐
        │  points_accounts.balance_minor  (cache)      │
        │  fast to read, must always equal the ledger  │
        └──────────────────────────────────────────────┘
```

The ledger is the source of truth; the balance column is a performance projection maintained inside the same transaction as the ledger row. They can never diverge, because no code path writes one without the other, and a reconciliation job continuously proves it (`docs/DATABASE_V2.md` §9, invariant 1).

**Why keep a balance column at all** rather than summing the ledger on every read? A player's balance is read on every page load, every bet, and every WebSocket broadcast; summing a growing ledger for each of those is O(history) and degrades as the account ages. The cached column is O(1). The cost of that choice is the risk of drift, which is why the invariant check is mandatory rather than optional.

---

## 2. Points Lifecycle

```
   ADMIN CREDIT                    GAMEPLAY                      ADMIN DEBIT
        │                             │                               │
        ▼                             │                               ▼
  ┌───────────┐    bet_placed    ┌────┴─────┐  settlement_win   ┌───────────┐
  │  BALANCE  │ ───(debit)─────► │  IN PLAY │ ────(credit)────► │  BALANCE  │
  └───────────┘                  └────┬─────┘                   └───────────┘
        ▲                             │
        └──────── bet_refund ─────────┘
                  (round voided)
```

There is no state in which points exist outside this diagram. "IN PLAY" is not a separate balance column — it is represented by `bets` rows whose round has not yet settled. Points are debited at bet acceptance, not at settlement, so a player can never spend the same points twice while a round is open.

---

## 3. Transaction Types

| `reference_type` | Direction | Cause | `reference_id` |
|---|---|---|---|
| `bet_placed` | Debit | Bet accepted by the server | `bets.id` |
| `bet_refund` | Credit | Round voided / bet cancelled | `bets.id` |
| `settlement_win` | Credit | Winning settlement | `settlements.id` |
| `admin_credit` | Credit | Operator grants points | `admin_logs.id` |
| `admin_debit` | Debit | Operator removes points | `admin_logs.id` |

Every type has a `reference_id` pointing at the row that justifies it. A ledger entry that cannot name its cause is a bug, not a valid record — so `reference_id` is only nullable for legacy/import rows, of which there are none in Phase 2.

**There is no `deposit`, `withdrawal`, `cashout`, `topup_purchase`, or `payout_transfer` type, and none may be added.**

---

## 4. The Four Hazards, And What Prevents Each

This is the section to re-read before changing any points code.

### 4.1 Double deduction

*Scenario:* a player double-clicks PLAY, or a mobile client retries a request whose response was lost. Two identical bet requests arrive.

**Prevention — three independent layers:**
1. The client sends an `Idempotency-Key` (§5). The API resolves the second request to the first bet's stored response without touching the ledger.
2. `UNIQUE (user_id, idempotency_key)` on `bets` — even if layer 1's cache is cold or races, the second `INSERT` fails.
3. `UNIQUE (idempotency_key)` on `points_transactions` — even if a bug produced two bet rows, the second debit cannot post.

Layer 3 is what makes this safe under conditions layers 1–2 don't anticipate. Defence in depth here is deliberate: a double deduction is a direct, visible loss to a player and erodes trust in the platform permanently.

### 4.2 Duplicate settlement

*Scenario:* the game-engine crashes after crediting some winners and the round is retried; or two engine instances process the same round.

**Prevention:**
- `UNIQUE (bet_id)` on `settlements` — a bet can be settled exactly once, ever.
- Settlement runs **per bet, in its own transaction**, writing the `settlements` row and the `settlement_win` ledger credit together. A retry re-attempts only the bets that have no settlement row.
- The settlement credit's idempotency key is derived deterministically (`settle:{roundId}:{betId}`), so a replay produces the same key and is rejected by the ledger's unique constraint.

This makes settlement **crash-safe and resumable**: re-running it after any failure converges to exactly one settlement per bet.

### 4.3 Negative balance

*Scenario:* two bets are placed concurrently, each individually affordable but not both together; or a settlement/debit races a bet.

**Prevention:**
1. `SELECT ... FOR UPDATE` on the `points_accounts` row in every mutating transaction serialises all concurrent mutations for that account. Where a round is also involved, the round row is locked first, per the canonical `round → account → bet` order (§6).
2. The application re-reads the balance *inside* that lock and rejects if insufficient — a check performed before the lock would be worthless.
3. `CHECK (balance_minor >= 0)` aborts the transaction if 1 and 2 are ever both defeated.

### 4.4 Replayed / out-of-order requests

*Scenario:* an attacker replays a captured bet request, or a delayed network retry arrives after the round has locked.

**Prevention:**
- Idempotency keys make a replay a no-op that returns the original result.
- Round state is re-validated inside the transaction against the **server's** clock and the locked round row — a request that was valid when sent but arrives after the deadline is rejected (§7).
- Keys are scoped per user, so one user's key can never affect another's account.

---

## 5. Idempotency Strategy

**Key format:** `{scope}:{userId}:{roundId}:{clientRequestId}` — e.g. `bet:8f3c…:a91b…:c7d2e4`.

| Operation | Key origin | Uniqueness enforced by |
|---|---|---|
| Place bet | Client-generated UUID per user action, sent as `Idempotency-Key` header | `bets(user_id, idempotency_key)` + `points_transactions(idempotency_key)` |
| Settlement credit | Server-derived: `settle:{roundId}:{betId}` | `settlements(bet_id)` + `points_transactions(idempotency_key)` |
| Bet refund | Server-derived: `refund:{roundId}:{betId}` | `points_transactions(idempotency_key)` |
| Admin adjustment | Client-generated per admin action | `points_transactions(idempotency_key)` |

**Server-derived keys are preferred wherever the server has enough information**, because they do not depend on a client behaving correctly. Client-supplied keys are only used where the client is the originator of the intent (placing a bet, an admin performing an adjustment).

**Request handling:**
1. Attempt the operation inside a transaction.
2. On unique-violation of an idempotency key, **do not error** — load and return the original result with `Idempotency-Replayed: true`. The caller sees a success identical to the first call.
3. If the key matches but the request body differs, return `409 Conflict` — a reused key with different content indicates a client bug and must be surfaced loudly, not silently resolved.

Keys are retained for at least the lifetime of their round plus a retention window; they are never garbage-collected while a round could still be retried.

### The client's obligation

Server-side protection is only half the contract. **A client must generate one key per user *intent* and reuse that same key across every retry of that intent** — a timed-out request, a dropped connection, an app resume, a user re-tapping after no visible response.

A client that generates a fresh key per attempt legitimately double-bets: each attempt is, as far as the server can tell, a distinct intent. This is the one path that defeats all three server-side layers, because no layer can distinguish "the player wants to bet again" from "the client retried with a new key". A new key is generated **only** for a genuinely new bet.

This obligation applies to every client — web, Electron, and Capacitor — and belongs in the Phase 3 frontend integration checklist.

---

## 6. Concurrency Control

Every points mutation follows this shape, without exception. Where a round is involved (bet placement), the round row is locked **before** the account row, per the canonical order below.

```sql
BEGIN;

-- 0. (Bet placement only) Lock the round FIRST — serialises against the
--    engine's BETTING_LOCKED transition. Settlement skips this step entirely.
-- SELECT state, betting_deadline FROM game_rounds WHERE id = $r FOR UPDATE;

-- 1. Serialise all concurrent mutations for THIS account.
SELECT balance_minor, version
  FROM points_accounts
 WHERE user_id = $1
   FOR UPDATE;                       -- blocks competing transactions here

-- 2. Validate INSIDE the lock (a check outside it proves nothing).
--    reject if balance_minor < required amount

-- 3. Write the ledger row (the truth).
INSERT INTO points_transactions (..., idempotency_key, balance_before_minor, balance_after_minor)
VALUES (...);                        -- UNIQUE(idempotency_key) stops any replay

-- 4. Update the projection to match.
UPDATE points_accounts
   SET balance_minor = $new, version = version + 1, updated_at = now()
 WHERE user_id = $1;                 -- CHECK(balance_minor >= 0) is the final guard

COMMIT;
```

**Rules:**
- **Canonical lock order is `round → account → bet`, everywhere, without exception** (ADR-022). Consistent ordering is what prevents deadlocks between the bet path and the settlement path.
- **Settlement acquires the account lock only — it takes no round lock.** By the time settlement runs, the round has already transitioned to `SETTLEMENT_PENDING` and no new bets can arrive, so the round lock buys nothing. Omitting it *eliminates* the deadlock cycle rather than merely ordering it, and avoids a contention point where thousands of per-bet transactions would otherwise queue on a single round row.
- Bet placement must take the round lock **first**, because that lock is what serialises a bet against the engine's `BETTING_LOCKED` transition. Taking it second would leave a window in which a bet is validated against a round being locked concurrently.
- Never hold a row lock across a network call (WebSocket broadcast, HTTP request). Broadcasts happen *after* `COMMIT`.
- Isolation level `READ COMMITTED` is sufficient given `FOR UPDATE`; no serialisable retries required.
- Settlement processes bets in a deterministic order (by `bet_id`) so concurrent workers contend predictably.

---

## 7. Bet Placement Flow (Points View)

```
Client                 API                    PostgreSQL
  │                     │                          │
  │─ POST /bets ───────►│                          │
  │  Idempotency-Key    │                          │
  │                     │─ BEGIN ─────────────────►│
  │                     │─ SELECT round FOR UPDATE►│  1st lock (canonical order)
  │                     │  must be BETTING_OPEN/   │  round must be accepting, and
  │                     │  ACTIVE, now() < deadline│  ← server clock, never the client's
  │                     │─ SELECT account FOR UPDATE►│  2nd lock
  │                     │  validate balance        │
  │                     │─ INSERT bets ───────────►│  UNIQUE(user_id, idem_key)
  │                     │─ INSERT bet_items ──────►│
  │                     │─ INSERT points_txn ─────►│  UNIQUE(idem_key), debit
  │                     │─ UPDATE points_account ─►│  CHECK(balance >= 0)
  │                     │─ COMMIT ────────────────►│
  │◄─ 201 {bet, balance}│                          │
  │                     │─ broadcast AFTER commit  │
  │◄═ ws bet.accepted ══│                          │
```

The entire validate-and-write sequence is one transaction. There is no window in which a bet exists without its debit, or a debit without its bet.

---

## 8. Settlement Flow (Points View)

Settlement is **per bet, one transaction each** — not one giant transaction for the whole round. A single transaction covering thousands of bets would hold locks for seconds, block every concurrent bet on those accounts, and lose all work on any failure.

```
FOR EACH bet in round (deterministic order, skipping already-settled):
  BEGIN
    SELECT account FOR UPDATE
    determine winning items          ← rule NEEDS CLIENT CONFIRMATION
    compute payout                   ← multipliers NEEDS CLIENT CONFIRMATION
    UPDATE bet_items SET is_winner, payout_minor
    INSERT settlements               ← UNIQUE(bet_id) blocks duplicates
    IF payout > 0:
       INSERT points_txn (credit, key='settle:{round}:{bet}')
       UPDATE points_accounts
    UPDATE bets SET status='settled'
  COMMIT
  broadcast settlement to that user

AFTER every bet in the round is settled (round reaches ROUND_COMPLETED):
  BEGIN
    project game_history: one row per USER for this round,
      played_minor = SUM(that user's bets.total_amount_minor)
      won_minor    = SUM(that user's settlements.total_win_minor)
      INSERT … ON CONFLICT (user_id, round_id) DO UPDATE
  COMMIT
```

**`game_history` is projected once at round completion, never inside the per-bet loop** (ADR-024). A user may place several bets in one round, and `game_history` is `UNIQUE (user_id, round_id)` — a per-bet insert would violate that constraint on the user's second bet, abort the settlement transaction, and, because settlement retries forever, strand the round in `SETTLEMENT_PENDING`. The one-live-round index would then block every subsequent round, halting the game for all players. Keeping the projection out of the money transaction also keeps per-bet settlement focused solely on points, with less failure surface on the most safety-critical path in the system.

> **NOT IMPLEMENTED IN PHASE 2:** the "determine winning items" and "compute payout" steps. Phase 2 builds the transactional envelope, the idempotency, the constraints, and the retry/resume machinery — and leaves the arithmetic behind a `SettlementRules` interface with **no** concrete implementation until the client confirms payout multipliers, commission structure, and the win-determination rule (`docs/GAME_ENGINE_V2.md` §7).

---

## 9. Admin Adjustments

The only inflow of points into the system.

- Requires an authenticated admin with an adjustment-capable role.
- Writes the `admin_logs` row and the `points_transactions` row **in the same transaction** — an adjustment without an audit trail is impossible by construction.
- Requires a non-empty reason string, stored in the ledger `description` and the audit log.
- Subject to the same `FOR UPDATE` lock and idempotency key as any other mutation.
- A debit that would drive the balance below zero is rejected, not clamped — silently clamping would misreport what the operator actually did.

---

## 10. Reporting Semantics

| Report column | Derivation |
|---|---|
| `SALE POINT` | Sum of `bet_placed` debits in the day bucket |
| `WIN POINT` | Sum of `settlement_win` credits in the day bucket |
| `END` | > **NEEDS CLIENT CONFIRMATION** |
| `COMMI POINT` | > **NEEDS CLIENT CONFIRMATION** (commission/rake structure) |
| `NTP POINT` | > **NEEDS CLIENT CONFIRMATION** |

Day buckets use the fixed reporting timezone **Asia/Kolkata** (`docs/DATABASE_V2.md` §5.2). Aggregates are computed from the ledger, never from the balance column, so a report can always be regenerated and audited against source rows.

---

## 11. What The Client May And May Not Send

| Client may send | Client may never send |
|---|---|
| Chip selections and per-selection amounts | Its balance, or any balance delta |
| An idempotency key for its own action | A payout, win amount, or settlement figure |
| The round id it believes is current (validated server-side) | A result, or any influence on one |
| A request to read its own balance and history | Another user's account reference |

The server recomputes every points figure from its own state. A client-supplied balance or payout is never read, even for validation — accepting it "just to compare" invites a class of bugs where it eventually gets trusted.

---

## 12. Open Items

| # | Item | Blocks |
|---|------|--------|
| 1 | Payout multipliers (singles / doubles / triples) | Settlement arithmetic |
| 2 | Win-determination rule (does a Doubles bet on `72` win on draw `772`?) | Settlement arithmetic |
| 3 | Commission / rake structure | `COMMI POINT`, net settlement |
| 4 | `END` and `NTP POINT` formulas | Report aggregation |
| 5 | Min/max bet per selection and per round | Bet validation |
| 6 | Whether an admin may debit below zero (currently: no) | Adjustment rules |
| 7 | Ledger retention / archival policy | Partitioning |
