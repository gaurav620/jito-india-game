# JITO INDIA GAMES — Database Design V2 (Phase 2)

> Version: 2.0 | Date: 2026-09-09 | Status: DESIGN ONLY — NOT IMPLEMENTED
> Supersedes `docs/DATABASE.md` for Phase 2 onward. `DATABASE.md` is retained as the Phase 1 historical record.

> **POINTS-ONLY.** There is no payment gateway, deposit, withdrawal, cashout, or real-money wallet in this schema. Any future proposal to add one must be raised as a new ADR and confirmed by the client first.

---

## 1. Design Principles

1. **The ledger is append-only.** `points_transactions` rows are never updated or deleted. Balance is a cached projection of the ledger, not an independent truth.
2. **Every points mutation is caused by an identifiable event.** Each transaction carries `reference_type` + `reference_id` pointing at the bet, settlement, or admin action that caused it.
3. **Idempotency is enforced by the database**, not by application logic alone — via `UNIQUE` constraints on natural idempotency keys. An application bug should be unable to double-charge.
4. **Money-like values are integers.** See ADR-014 and §3.
5. **Source tables vs read models.** `users`, `points_accounts`, `points_transactions`, `game_rounds`, `bets`, `bet_items`, `game_results`, `settlements` are sources of truth. `game_history` and `report_daily_aggregates` are rebuildable read models (§8) — deleting and recomputing them must never lose information.
6. **No business rule constants live in the schema.** Payout multipliers, round durations, and commission rates are configuration, all currently `NEEDS CLIENT CONFIRMATION`.

---

## 2. Entity Relationship Diagram

```
                        ┌──────────────┐
                        │    users     │
                        └──────┬───────┘
                               │
        ┌──────────────┬───────┼──────────────┬────────────────┐
        │              │       │              │                │
        ▼              ▼       ▼              ▼                ▼
  ┌──────────┐  ┌─────────────────┐    ┌──────────┐    ┌──────────────┐
  │ sessions │  │ points_accounts │    │   bets   │    │ game_history │
  └──────────┘  └────────┬────────┘    └────┬─────┘    │ (read model) │
                         │                  │          └──────────────┘
                         ▼                  ▼
              ┌─────────────────────┐  ┌───────────┐
              │ points_transactions │  │ bet_items │
              │    (append-only)    │  └───────────┘
              └──────────┬──────────┘
                         │ reference_id
                         │
     ┌───────────────────┴───────────────────┐
     │                                       │
     ▼                                       ▼
┌─────────────┐                       ┌──────────────┐
│ settlements │◄──────────────────────│ game_rounds  │
└─────────────┘                       └──────┬───────┘
                                             │ 1:1
                                             ▼
                                      ┌──────────────┐
                                      │ game_results │
                                      └──────────────┘

┌──────────────┐      ┌────────────┐      ┌───────────────────────────┐
│ admin_users  │─────►│ admin_logs │      │ report_daily_aggregates   │
└──────────────┘      └────────────┘      │      (read model)         │
                                          └───────────────────────────┘
```

---

## 3. Points Are Stored As Integers (`BIGINT` centipoints)

The UI displays points to two decimals (`64707.00`, `962.00`). Phase 2 stores every points value as a **`BIGINT` count of centipoints** (1 point = 100 centipoints), named with a `_minor` suffix.

**Why not `DECIMAL(15,2)`** (what Phase 1's `DATABASE.md` proposed):
- `node-postgres` returns PostgreSQL `NUMERIC` as a **JavaScript string** to avoid precision loss. Every read site must then parse it, and the moment any developer writes `parseFloat(row.balance)` the value enters IEEE-754 floating point where `0.1 + 0.2 !== 0.3`. In a ledger that is a correctness bug, and it is nearly impossible to catch in review because the wrong code looks completely normal.
- `BIGINT` centipoints are exact in Postgres and, below 2^53 centipoints (≈ 90 billion points), exact in JavaScript too — far beyond any realistic balance.
- Integer arithmetic makes the `SUM(ledger) = balance` invariant check (§9) exact rather than approximate.

**Conversion happens only at the API boundary**, in one shared helper in `@jito/shared` — never scattered across services. Internal service code and all API/WebSocket payloads carry `_minor` integers; only the presentation layer formats to `64707.00`.

> Because it changes every points-carrying payload, this decision must be applied consistently to `@jito/types` (`Wallet`/`WalletTransaction` → `PointsAccount`/`PointsTransaction`) as the first task of Phase 2. See `docs/PHASE_2_IMPLEMENTATION_PLAN.md` step 1.

---

## 4. Core Tables

### 4.1 `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL |
| `email` | VARCHAR(255) | UNIQUE, NULLABLE |
| `phone` | VARCHAR(20) | UNIQUE, NULLABLE |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `display_name` | VARCHAR(100) | NULLABLE |
| `status` | `user_status` ENUM(`active`,`suspended`,`banned`) | NOT NULL, DEFAULT `active` |
| `failed_login_count` | SMALLINT | NOT NULL, DEFAULT 0 |
| `locked_until` | TIMESTAMPTZ | NULLABLE |
| `last_login_at` | TIMESTAMPTZ | NULLABLE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |

- `CHECK (email IS NOT NULL OR phone IS NOT NULL)` — **pending**: which identifier is mandatory is `NEEDS CLIENT CONFIRMATION` (`docs/CLIENT_REQUIREMENTS.md` item 5). Until confirmed, both stay nullable with this either-or check.
- Players only. Admin accounts live in `admin_users` (§6, ADR-021).

### 4.2 `sessions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id` ON DELETE CASCADE, NOT NULL |
| `refresh_token_hash` | VARCHAR(255) | NOT NULL, UNIQUE |
| `device_label` | VARCHAR(100) | NULLABLE |
| `ip_address` | INET | NULLABLE |
| `user_agent` | TEXT | NULLABLE |
| `expires_at` | TIMESTAMPTZ | NOT NULL |
| `revoked_at` | TIMESTAMPTZ | NULLABLE |
| `replaced_by_session_id` | UUID | FK → `sessions.id`, NULLABLE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |

- Only the **hash** of the refresh token is stored — a database leak must not yield usable tokens.
- `replaced_by_session_id` records refresh-token rotation chains, which is what makes reuse-detection possible (`docs/AUTH_V2.md` §6).

### 4.3 `points_accounts`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id`, UNIQUE, NOT NULL |
| `balance_minor` | BIGINT | NOT NULL, DEFAULT 0, `CHECK (balance_minor >= 0)` |
| `version` | BIGINT | NOT NULL, DEFAULT 0 |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |

- The `CHECK (balance_minor >= 0)` is the **last line of defence** against a negative balance. Application-level checks run first; this constraint guarantees that even a logic bug or a lost race cannot persist an overdrawn account — the transaction aborts instead.
- `version` increments on every mutation, for optimistic-concurrency diagnostics and cache invalidation.
- Exactly one account per user (`UNIQUE (user_id)`), created in the same transaction as the user.

### 4.4 `points_transactions` (append-only ledger)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `account_id` | UUID | FK → `points_accounts.id`, NOT NULL |
| `direction` | `txn_direction` ENUM(`credit`,`debit`) | NOT NULL |
| `amount_minor` | BIGINT | NOT NULL, `CHECK (amount_minor > 0)` |
| `balance_before_minor` | BIGINT | NOT NULL |
| `balance_after_minor` | BIGINT | NOT NULL |
| `reference_type` | `txn_ref_type` ENUM(`bet_placed`,`bet_refund`,`settlement_win`,`admin_credit`,`admin_debit`) | NOT NULL |
| `reference_id` | UUID | NULLABLE (the bet / settlement / admin action) |
| `idempotency_key` | VARCHAR(120) | **UNIQUE**, NOT NULL |
| `description` | TEXT | NULLABLE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |

- `amount_minor` is always **positive**; `direction` carries the sign. This makes `SUM` aggregations unambiguous and prevents a sign error from silently reversing a transaction.
- `CHECK (balance_after_minor = balance_before_minor + CASE direction WHEN 'credit' THEN amount_minor ELSE -amount_minor END)` — the row must be internally consistent.
- **`UNIQUE (idempotency_key)` is the core anti-double-spend guarantee.** A retried request produces the same key and the second `INSERT` fails with a unique violation, which the service translates into "return the original result" rather than an error. See `docs/POINTS_SYSTEM.md` §5.
- Enforce append-only with a `BEFORE UPDATE OR DELETE` trigger that raises an exception, plus a DB role lacking `UPDATE`/`DELETE` on this table. Corrections are made by posting a **compensating transaction**, never by editing history.

### 4.5 `game_rounds`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `game_id` | VARCHAR(50) | NOT NULL (`triple-chance-timer` \| `triple-chance-pro-timer`) |
| `round_number` | BIGINT | NOT NULL |
| `display_code` | VARCHAR(20) | NOT NULL (player-facing Game ID, e.g. `736TC658`) |
| `state` | `round_state` ENUM (§ `docs/GAME_ENGINE_V2.md`) | NOT NULL |
| `state_version` | BIGINT | NOT NULL, DEFAULT 0 |
| `opens_at` | TIMESTAMPTZ | NOT NULL |
| `betting_deadline` | TIMESTAMPTZ | NOT NULL |
| `locked_at` | TIMESTAMPTZ | NULLABLE |
| `result_published_at` | TIMESTAMPTZ | NULLABLE |
| `settled_at` | TIMESTAMPTZ | NULLABLE |
| `completed_at` | TIMESTAMPTZ | NULLABLE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |

- `UNIQUE (game_id, round_number)` and `UNIQUE (display_code)`.
- **Partial unique index** `UNIQUE (game_id) WHERE state NOT IN ('ROUND_COMPLETED','ROUND_VOID')` — guarantees at most one live round per game at the database level. This is what makes a duplicated scheduler tick or a second game-engine instance harmless (ADR-017).
- `betting_deadline` is the **only** authoritative deadline. Clients render from it; they never set it.
- **`state_version` increments on every state transition**, in the same guarded `UPDATE` that changes `state`. It is carried in every round-state WebSocket payload including the join snapshot, so clients can discard stale or duplicated events by comparing versions (ADR-023). This makes realtime ordering a property of the data rather than of delivery timing — see `docs/WEBSOCKET_V2.md` §8.

### 4.6 `bets`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id`, NOT NULL |
| `round_id` | UUID | FK → `game_rounds.id`, NOT NULL |
| `total_amount_minor` | BIGINT | NOT NULL, `CHECK (total_amount_minor > 0)` |
| `status` | `bet_status` ENUM(`accepted`,`settled`,`refunded`,`rejected`) | NOT NULL, DEFAULT `accepted` |
| `idempotency_key` | VARCHAR(120) | NOT NULL |
| `accepted_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |

- `UNIQUE (user_id, idempotency_key)` — a resubmitted bet (double-click, flaky network retry, mobile app resume) can never create a second bet.
- `total_amount_minor` must equal `SUM(bet_items.amount_minor)`, asserted in the placement transaction and re-checked by the reconciliation job (§9).
- A bet is only ever written when the round is in an accepting state; the check happens inside the same transaction that locks the round row.

### 4.7 `bet_items`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `bet_id` | UUID | FK → `bets.id` ON DELETE CASCADE, NOT NULL |
| `category` | `bet_category` ENUM(`singles`,`doubles`,`triples`) | NOT NULL |
| `selection` | SMALLINT | NOT NULL |
| `amount_minor` | BIGINT | NOT NULL, `CHECK (amount_minor > 0)` |
| `is_winner` | BOOLEAN | NULLABLE (NULL until settled) |
| `payout_minor` | BIGINT | NULLABLE, `CHECK (payout_minor >= 0)` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |

- `selection` is a plain `SMALLINT`, not JSONB: singles are `0–9`, doubles `0–99`, triples `0–999`. A single integer per row is exactly the domain, indexes cleanly, and lets settlement match with a simple equality instead of JSON containment. Range is enforced per category:
  `CHECK ((category='singles' AND selection BETWEEN 0 AND 9) OR (category='doubles' AND selection BETWEEN 0 AND 99) OR (category='triples' AND selection BETWEEN 0 AND 999))`
- `UNIQUE (bet_id, category, selection)` — one row per distinct selection within a bet; placing more chips on the same cell increases `amount_minor` rather than adding rows.
- `is_winner`/`payout_minor` are written **once**, by settlement. They stay NULL until then.

### 4.8 `game_results`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `round_id` | UUID | FK → `game_rounds.id`, **UNIQUE**, NOT NULL |
| `draw_value` | SMALLINT | NOT NULL, `CHECK (draw_value BETWEEN 0 AND 999)` |
| `source` | `result_source` ENUM(`manual`,`external_feed`,`certified_rng`) | NOT NULL |
| `source_reference` | TEXT | NULLABLE (external draw id / operator id / audit handle) |
| `published_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |

- **`UNIQUE (round_id)` makes a second result for a round structurally impossible.** This is the single most important integrity constraint in the game domain.
- **The result is one 3-digit draw**, stored as a single integer `000–999`. Per the reference screenshots and the Phase 1 implementation, the Doubles and Singles values are **derived** from it (`772` → double `72`, single `2`), not drawn separately. Storing three independent values would allow inconsistent states that the game cannot actually produce.
- `source` records *where the number came from*. Phase 2 ships `manual` and `external_feed` only. **No RNG is implemented** — see `docs/GAME_ENGINE_V2.md` §6 and ADR-018.

### 4.9 `settlements`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `round_id` | UUID | FK → `game_rounds.id`, NOT NULL |
| `bet_id` | UUID | FK → `bets.id`, NOT NULL |
| `user_id` | UUID | FK → `users.id`, NOT NULL |
| `total_bet_minor` | BIGINT | NOT NULL |
| `total_win_minor` | BIGINT | NOT NULL, `CHECK (total_win_minor >= 0)` |
| `net_minor` | BIGINT | NOT NULL |
| `rules_version` | VARCHAR(30) | NOT NULL |
| `settled_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |

- **`UNIQUE (bet_id)` prevents duplicate settlement of the same bet, permanently and at the database level** — the mechanism that makes settlement safe to retry after a crash mid-round.
- `CHECK (net_minor = total_win_minor - total_bet_minor)`.
- `rules_version` stamps which payout ruleset produced this row, so a later rule change never silently reinterprets historical settlements. Values come from confirmed configuration; **no payout maths is implemented in Phase 2** (ADR-018).

---

## 5. Read Models

These are **caches**. Both are fully rebuildable from the source tables; a rebuild job must be able to `TRUNCATE` and regenerate them without any information loss. They exist because the player-facing History and Report modals are hot paths whose natural queries join five tables per row.

### 5.1 `game_history`

One row per **user per settled round** — the backing store for the Game History modal (`S NO`, `Game ID`, `Played`, `Won`).

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id`, NOT NULL |
| `round_id` | UUID | FK → `game_rounds.id`, NOT NULL |
| `game_id` | VARCHAR(50) | NOT NULL |
| `display_code` | VARCHAR(20) | NOT NULL |
| `draw_value` | SMALLINT | NOT NULL |
| `played_minor` | BIGINT | NOT NULL |
| `won_minor` | BIGINT | NOT NULL |
| `completed_at` | TIMESTAMPTZ | NOT NULL |

- `UNIQUE (user_id, round_id)` — **one row per user per round, aggregating all of that user's bets in the round.**
- **Projected once at `ROUND_COMPLETED`**, in a dedicated transaction after every bet in the round has settled — **not** inside the per-bet settlement transaction (ADR-024). A user may place several bets in one round (`bets` is unique on `(user_id, idempotency_key)`, not per round), so a per-bet insert would violate this constraint on the second bet, abort that settlement, and — because settlement is resumable and retries forever — strand the round in `SETTLEMENT_PENDING`. The partial unique index on live rounds would then prevent any new round opening, halting the game for every player.
- `played_minor` = `SUM` of that user's `bets.total_amount_minor` for the round; `won_minor` = `SUM` of that user's `settlements.total_win_minor` for the round.
- Projection is idempotent: `INSERT … ON CONFLICT (user_id, round_id) DO UPDATE SET played_minor = EXCLUDED.played_minor, won_minor = EXCLUDED.won_minor` — computed from source tables, so re-running after a crash converges to the same row rather than accumulating.

### 5.2 `report_daily_aggregates`

One row per **user per day**, backing the Report modal columns exactly (`DATE`, `SALE POINT`, `WIN POINT`, `END`, `COMMI POINT`, `NTP POINT`).

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id`, NOT NULL |
| `report_date` | DATE | NOT NULL |
| `sale_point_minor` | BIGINT | NOT NULL, DEFAULT 0 |
| `win_point_minor` | BIGINT | NOT NULL, DEFAULT 0 |
| `end_point_minor` | BIGINT | **NULLABLE, no default** |
| `commi_point_minor` | BIGINT | **NULLABLE, no default** |
| `ntp_point_minor` | BIGINT | **NULLABLE, no default** |
| `rebuilt_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |

- `UNIQUE (user_id, report_date)`.
- `report_date` is bucketed in a **fixed reporting timezone (Asia/Kolkata)**, stored as a `DATE`. Bucketing by UTC would split an Indian evening's play across two report rows and make totals disagree with what operators expect.
- **`end_point_minor`, `commi_point_minor`, and `ntp_point_minor` are nullable with no default, deliberately.** Their formulas are unconfirmed, and `NOT NULL DEFAULT 0` would render an unconfirmed value as a confident `0.00` in the Report modal — an operator would reasonably read that as a real computed figure. `NULL` distinguishes "not yet computed" from "computed as zero"; the API renders it as `null` and the UI must show it as blank or `—`, never `0.00`.
- `sale_point_minor` and `win_point_minor` stay `NOT NULL DEFAULT 0` — those derivations are known (sum of `bet_placed` debits and `settlement_win` credits in the bucket).
- > **NEEDS CLIENT CONFIRMATION**: the exact derivation of `END`, `COMMI POINT`, and `NTP POINT` from sale/win. The columns are modelled from the reference screenshot; the formulas are **not** invented here. The aggregation job is specified but its arithmetic is left unimplemented until confirmed (`docs/CLIENT_REQUIREMENTS.md` items 2–3).

---

## 6. Admin Tables

### 6.1 `admin_users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `role` | `admin_role` ENUM(`super_admin`,`operator`,`viewer`) | NOT NULL, DEFAULT `operator` |
| `status` | `admin_status` ENUM(`active`,`inactive`) | NOT NULL, DEFAULT `active` |
| `last_login_at` | TIMESTAMPTZ | NULLABLE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |

- Separate table from `users` (ADR-021): an admin is not a player, must never authenticate on the player surface, and privilege escalation via a `role` column on a self-registerable table is a well-known failure mode.
- > **NEEDS CLIENT CONFIRMATION**: the exact admin role set and each role's permissions (`PRD.md` item 6). The three roles above are a minimal placeholder.

### 6.2 `admin_logs`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `admin_id` | UUID | FK → `admin_users.id`, NOT NULL |
| `action` | VARCHAR(100) | NOT NULL |
| `target_type` | VARCHAR(50) | NULLABLE |
| `target_id` | UUID | NULLABLE |
| `before_state` | JSONB | NULLABLE |
| `after_state` | JSONB | NULLABLE |
| `ip_address` | INET | NULLABLE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` |

- Append-only, same trigger treatment as `points_transactions`.
- Every points adjustment, user status change, and round intervention writes one row **in the same transaction as the change itself** — so an action can never exist without its audit record.

---

## 7. Indexes

```sql
-- Auth
CREATE INDEX idx_sessions_user_id            ON sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_sessions_expires_at         ON sessions(expires_at);

-- Points
CREATE INDEX idx_points_txn_account_created  ON points_transactions(account_id, created_at DESC);
CREATE INDEX idx_points_txn_reference        ON points_transactions(reference_type, reference_id);

-- Rounds
CREATE INDEX idx_rounds_game_state           ON game_rounds(game_id, state);
CREATE INDEX idx_rounds_game_number          ON game_rounds(game_id, round_number DESC);
CREATE UNIQUE INDEX uq_rounds_one_live_per_game
  ON game_rounds(game_id)
  WHERE state NOT IN ('ROUND_COMPLETED', 'ROUND_VOID');

-- Bets
CREATE INDEX idx_bets_round                  ON bets(round_id);
CREATE INDEX idx_bets_user_created           ON bets(user_id, created_at DESC);
CREATE INDEX idx_bet_items_bet               ON bet_items(bet_id);
CREATE INDEX idx_bet_items_round_match       ON bet_items(category, selection);

-- Settlement
CREATE INDEX idx_settlements_round           ON settlements(round_id);
CREATE INDEX idx_settlements_user_settled    ON settlements(user_id, settled_at DESC);

-- Read models
CREATE INDEX idx_history_user_completed      ON game_history(user_id, completed_at DESC);
CREATE INDEX idx_report_user_date            ON report_daily_aggregates(user_id, report_date DESC);

-- Admin
CREATE INDEX idx_admin_logs_admin_created    ON admin_logs(admin_id, created_at DESC);
CREATE INDEX idx_admin_logs_target           ON admin_logs(target_type, target_id);
```

---

## 8. Migration From The Phase 1 Schema Sketch

Phase 1's `docs/DATABASE.md` was a sketch; **no migrations were ever run and no data exists**, so this is a documentation-level rename rather than a data migration.

| Phase 1 (`DATABASE.md`) | Phase 2 (this doc) | Reason |
|---|---|---|
| `wallets` | `points_accounts` | Points-only naming; "wallet" implies real money (ADR-011, ADR-014) |
| `wallet_transactions` | `points_transactions` | Same, plus mandatory `idempotency_key` |
| `DECIMAL(15,2) balance` | `BIGINT balance_minor` | Exactness across the JS boundary (§3) |
| `bet_items.selection JSONB` | `bet_items.selection SMALLINT` | The domain is a single integer per row |
| `game_results.result_data`/`winning_numbers` JSONB | `game_results.draw_value SMALLINT` | The draw is one 3-digit number; the rest is derived |
| `notifications`, `installer_versions` | retained as-is from `DATABASE.md` | Unchanged by Phase 2; not part of the 13 core tables |

`@jito/types` must be updated in lockstep (`Wallet` → `PointsAccount`, `WalletTransaction` → `PointsTransaction`, `TransactionRefType` extended with `bet_refund`).

---

## 9. Integrity Invariants (Continuously Verified)

A scheduled reconciliation job asserts these and alerts on any violation. They are the reason the ledger can be trusted:

| # | Invariant | Check |
|---|-----------|-------|
| 1 | Balance equals ledger | `points_accounts.balance_minor = SUM(credits) - SUM(debits)` per account |
| 2 | No negative balance | `balance_minor >= 0` (also a CHECK constraint) |
| 3 | Bet totals agree | `bets.total_amount_minor = SUM(bet_items.amount_minor)` |
| 4 | No double settlement | `COUNT(settlements) per bet_id <= 1` (also a UNIQUE constraint) |
| 5 | Every settled round has exactly one result | `COUNT(game_results) per round_id = 1` |
| 6 | Every accepted bet in a completed round is settled or refunded | no `accepted` bets on `ROUND_COMPLETED` rounds |
| 7 | Ledger is append-only | no rows where `updated_at > created_at` |

Invariants 1–5 are enforced by constraints *and* re-checked by the job; the job exists to catch anything constraints cannot express and to prove the constraints are actually holding in production.

---

## 10. Migration Tooling

- Sequential, versioned, forward-only migration files; never edit a migration that has run anywhere.
- Every migration must be reviewed for lock behaviour before it touches a large table (`CREATE INDEX CONCURRENTLY`, no blocking `ALTER TABLE` on hot tables).
- Migrations run in staging first, verified against the invariant job, then production.
- The append-only triggers and the DB role grants are themselves migrations — they must not be applied manually.

---

## 11. Open Items

| # | Item | Blocks |
|---|------|--------|
| 1 | Mandatory registration identifier (email / phone / both) | Final `users` constraint |
| 2 | `END` / `COMMI POINT` / `NTP POINT` formulas | Report aggregation job |
| 3 | Payout multipliers per category | `settlements` population |
| 4 | Commission / rake structure | `commi_point_minor` derivation |
| 5 | Admin role set and permissions | `admin_users.role` enum |
| 6 | Max bet per selection / per round | Bet validation constraints |
| 7 | Data retention policy for ledger and audit logs | Partitioning strategy |
