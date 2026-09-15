# JITO INDIA GAMES — Phase 2 Architecture Review

> Version: 1.0 | Date: 2026-09-09 | Reviewer: Claude Code (architect / backend / realtime / database / security / QA perspectives)
> Reviewed: `docs/API_V2.md`, `docs/AUTH_V2.md`, `docs/DATABASE_V2.md`, `docs/GAME_ENGINE_V2.md`, `docs/WEBSOCKET_V2.md`, `docs/POINTS_SYSTEM.md`, `docs/PHASE_2_IMPLEMENTATION_PLAN.md`, against `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TESTING.md`, `MEMORY.md`, `DECISIONS.md`, `PROJECT_CONTEXT.md`.

---

## Executive Summary

The Phase 2 architecture is **structurally sound**: server authority is correctly and completely specified, the points-only constraint holds with no payment concepts anywhere, PostgreSQL is the sole source of truth with Redis strictly non-authoritative, and the unconfirmed business rules (RNG, payouts, win determination) are properly isolated behind interfaces rather than guessed at.

However, the review found **four defects that would cause production incidents if coded as written**, three of them arising from contradictions *between* the documents rather than within any one of them — precisely the class of error that survives a single-document read:

1. `game_history` will throw a unique-constraint violation and **permanently stall settlement** for any player who places more than one bet in a round.
2. The stated lock ordering contradicts the actual documented bet flow, creating a **deadlock** between the bet path and the settlement path.
3. Voiding a partially-settled round is **undefined behaviour**.
4. A WebSocket join race lets a **stale snapshot overwrite newer state**.

None of these are deep design flaws — the foundations are right — but all four are cheap to fix now and expensive to fix after the schema and services exist. There is also one genuinely open **product** question (whether each chip placement is an immediate server bet or bets are batched) that materially changes the API contract and must be answered before the betting endpoint is built.

**Status: BLOCKED — CHANGES REQUIRED.** Nine changes are required before coding; all are documentation edits, and the fixes are specified below.

---

## Architecture Approved

These aspects were reviewed in depth and are approved as designed.

| Area | Finding |
|---|---|
| **Points-only compliance** | ✅ Verified by full-repo grep and document review. No payment gateway, Razorpay, Stripe, UPI, deposit, withdrawal, cashout, or real-money wallet appears in any Phase 2 document or in source. The only inflow is an audited admin adjustment. Naming (`points_accounts`, `points_transactions`, `points.updated`) actively resists payment-shaped thinking. ADR-011 is honoured throughout. |
| **Server authority** | ✅ Complete and correct. `GAME_ENGINE_V2.md` §3 enumerates server-owned concerns and the exhaustive list of what a client may send. Client cannot send a result, payout, balance, deadline, round state, or user id. Identity derives from the token; `roundId` is treated as an assertion of intent and re-validated. All timestamps originate from PostgreSQL `now()`, so no application host's clock can affect a lock. |
| **Result model extensibility** | ✅ The single `draw_value SMALLINT (0–999)` with derived Doubles/Singles is the correct model — it matches the reference (`772` → `72` → `2`) and makes inconsistent category results structurally impossible. Critically, **the win-determination rule and payout maths are not encoded in the schema**, so confirmed rules can be inserted later via `SettlementRules` with no migration. The `rules_version` stamp on `settlements` prevents retroactive reinterpretation. |
| **RNG isolation** | ✅ `ResultSource` with only `ManualResultSource` implemented is the right call. No `Math.random()` anywhere in `services/` or `packages/game-core` (verified). The Phase 1 wheel already consumes a result as input, so no client change is needed later. |
| **Redis boundaries** | ✅ Correctly scoped to pub/sub fan-out, the engine leader lock, rate-limit counters, and caching. Every value is reconstructable from PostgreSQL. A Redis outage degrades delivery without corrupting state — explicitly documented. No authoritative data lives only in Redis. |
| **Idempotency model** | ✅ Three-layer defence (client key → `bets` unique → ledger unique) with server-derived keys preferred where the server has enough information. Replay returns the original result; key reuse with a different body returns `409`. Sound. |
| **Auth model** | ✅ argon2id, 15-minute access tokens, opaque rotating refresh tokens with reuse detection revoking the session chain, separate `admin_users` table plus `aud` claim separation. Constant-time verification against a dummy hash for unknown users, and non-enumerating error responses. No KYC anywhere. |
| **Single-writer engine** | ✅ Correct, and the layering is right: ECS count 1 and the leader lock *prevent* concurrency, while the partial unique index makes the bad outcome *impossible*. See "Realtime Review" for the failover analysis. |
| **Reconciling scheduler** | ✅ Choosing a reconciler over in-memory timers is the single best decision in the design — recovery is the happy path, so it is continuously exercised rather than being rare untested cleanup code. |
| **No redundant tables** | ✅ All 13 core tables are justified. `game_history` and `report_daily_aggregates` are the only denormalized ones, both rebuildable caches serving hot player-facing screens. `notifications` and `installer_versions` carry over from Phase 1 and sit outside the core 13. |

---

## Issues Found

Severity: **CRITICAL** = will cause a production incident · **HIGH** = wrong behaviour or broken UX · **MEDIUM** = maintainability / doc integrity.

### CRITICAL

#### C1 — `game_history` unique violation permanently stalls settlement

- **Where:** `DATABASE_V2.md` §5.1 (`UNIQUE (user_id, round_id)`, "written once in the settlement transaction") vs `POINTS_SYSTEM.md` §8 (`INSERT game_history row` **inside the per-bet loop**).
- **Problem:** Nothing prevents a user from placing multiple bets in one round — `bets` is uniquely constrained on `(user_id, idempotency_key)`, not `(user_id, round_id)`, and the UI flow naturally produces repeated placements. Settling that user's *second* bet inserts a second `game_history` row for the same `(user_id, round_id)` and violates the unique constraint.
- **Consequence:** The settlement transaction for that bet aborts. Because settlement is resumable, it retries — and fails again, forever. The round never leaves `SETTLEMENT_PENDING`, and because of the partial unique index on live rounds, **the next round can never open. The game stops for every player.** A single multi-bet player halts the platform.
- **Fix:** Project `game_history` **once at `ROUND_COMPLETED`**, aggregating that user's bets for the round, rather than per bet. If it must be written incrementally, use `INSERT … ON CONFLICT (user_id, round_id) DO UPDATE SET played_minor = game_history.played_minor + EXCLUDED.played_minor, won_minor = game_history.won_minor + EXCLUDED.won_minor`. The aggregate-at-completion option is preferred: it is simpler, matches the Game History modal (one row per Game ID), and keeps the per-bet transaction focused on money.

#### C2 — Lock-order contradiction creates a deadlock between bet and settlement paths

- **Where:** `POINTS_SYSTEM.md` §6 states "Lock ordering is always **account → round → bet**, everywhere", but §7's own bet-placement diagram locks **round first, then account**.
- **Problem:** The stated rule and the documented flow disagree. If implemented literally as written in different services — bet placement taking round→account, settlement or an admin path taking account→round — two transactions can hold one lock each and wait on the other.
- **Consequence:** Deadlock. PostgreSQL will detect and abort one transaction, so this surfaces as intermittent bet failures under load — the hardest category of bug to reproduce, and one that appears exactly when the platform is busiest.
- **Fix:** Adopt **round → account → bet** as the canonical order (recorded as ADR-022). The bet path genuinely needs the round lock first, to serialise against the engine's lock transition. Settlement must then take **only the account lock** (it needs no round lock, since the round has already transitioned to `SETTLEMENT_PENDING` and no new bets can arrive). Correct §6 to match, and state explicitly that settlement acquires no round lock.

#### C3 — Voiding a partially-settled round is undefined

- **Where:** `GAME_ENGINE_V2.md` §8.
- **Problem:** Void is specified as refunding "every `accepted` bet", and `POST /admin/rounds/:id/void` has no state precondition. But a round can reach `SETTLEMENT_PENDING` with some bets already `settled` and credited. Voiding then leaves winners paid *and* everyone refunded, with no defined reversal.
- **Consequence:** Points created from nothing; the ledger stays internally consistent but the round's economics are wrong, and there is no specified path to unwind it.
- **Fix:** Constrain void to rounds with **zero `settlements` rows** — enforce in the endpoint and re-check inside the transaction. If a round must be reversed after partial settlement, that is a separate, explicitly-designed compensating flow (reverse entries, never edits), and it is out of scope until a client requirement exists for it. Document that `super_admin` cannot void past first settlement.

#### C4 — WebSocket join race lets a stale snapshot overwrite newer state

- **Where:** `WEBSOCKET_V2.md` §2 (steps 6–7) and §9.
- **Problem:** The socket joins `game:{gameId}` *before* the snapshot is queried and sent. A round transition broadcast during that window reaches the client first; the snapshot — read at an earlier instant — arrives second and, being treated as authoritative, overwrites the newer state.
- **Consequence:** After a reconnect (exactly when this window is most likely, since many clients reconnect together after an instance restart) a player can see betting re-open on a locked round, or a stale balance. Both are visible, trust-damaging bugs.
- **Fix:** Add a monotonic `stateVersion` per round, incremented on every transition, to `game_rounds` and to **every** round-state payload including the snapshot. Clients apply an event only if `stateVersion` exceeds the last applied value. This also makes duplicate events idempotent at the client for free, satisfying the at-most-once delivery contract. Recorded as ADR-023.

### HIGH

#### H1 — Bet submission model is unspecified, and the bet rate limit contradicts likely real usage

- **Where:** `API_V2.md` §6 and §10 (`POST /bets` limited to 30/min per user).
- **Problem:** The design never states whether **each chip placement is an immediate `POST /bets`**, or whether the client accumulates selections locally and submits **one bet per round**. The reference UI has no visible submit control (PLAY is a counter, not a button), which suggests immediate placement — and legacy systems of this type commonly do that. If placement is immediate, 30/min (one per two seconds) will reject normal rapid play, and players will experience the platform as broken.
- **Consequence:** Either a broken betting UX, or a client/server contract mismatch discovered late during frontend integration.
- **Fix:** This is a **product question requiring client confirmation** (added to the confirmation list). Until answered, do not build `POST /bets`' final contract. If immediate-per-chip is confirmed, raise the limit to ≥120/min and expect many small bets per round (which makes C1's fix mandatory rather than merely correct). If batched, keep 30/min and document that the client submits once.

#### H2 — Report columns are `NOT NULL DEFAULT 0` but the API promises `null`

- **Where:** `DATABASE_V2.md` §5.2 (`end_point_minor`, `commi_point_minor`, `ntp_point_minor` are `NOT NULL, DEFAULT 0`) vs `API_V2.md` §7 ("those three fields return `null` until the formulas are confirmed").
- **Problem:** The schema cannot represent "not computed"; it will report `0.00`.
- **Consequence:** An operator reading the Report modal sees a confident `0.00` for END, COMMI, and NTP and reasonably believes it is a real figure. Presenting an unconfirmed value as a computed zero is worse than presenting nothing.
- **Fix:** Make the three columns **nullable with no default**, so "not yet computed" is distinguishable from "computed as zero". `sale_point_minor` and `win_point_minor` stay `NOT NULL DEFAULT 0` — those formulas are known.

#### H3 — Duplicate selections within one bet request will 500

- **Where:** `API_V2.md` §6 request body vs `DATABASE_V2.md` §4.7 `UNIQUE (bet_id, category, selection)`.
- **Problem:** Nothing stops a client sending `items` containing the same `(category, selection)` twice. The second insert violates the unique constraint.
- **Consequence:** An unhandled constraint violation surfaces as a 500 on a perfectly plausible client payload.
- **Fix:** The DTO must **merge duplicate `(category, selection)` pairs by summing `amountMinor`** before insert (preferred — it matches the "more chips on the same cell" semantics already described in §4.7), or reject with `400 DUPLICATE_SELECTION`. State which, explicitly.

#### H4 — Client retry semantics for idempotency keys are unstated

- **Where:** `POINTS_SYSTEM.md` §5, `API_V2.md` §6.
- **Problem:** The server-side contract is thorough, but nothing states the client obligation: **a retry of a failed or timed-out bet must reuse the original key**. A client that generates a fresh key per attempt defeats every server-side protection and legitimately double-bets.
- **Consequence:** Double deduction via the one path the three-layer defence cannot see.
- **Fix:** Document the client contract explicitly: the key is generated once per user *intent* and reused across all retries of that intent; it is regenerated only for a genuinely new bet. Add this to the frontend integration checklist and to the API doc.

### MEDIUM

| # | Issue | Fix |
|---|---|---|
| **M1** | Sequential rounds: the partial unique index means round N+1 cannot open until round N reaches `ROUND_COMPLETED`, so slow settlement directly delays the next round. | Accept for V1 (it matches the single-countdown UX and keeps the model simple), but **measure settlement duration**, size `T_gap` accordingly, and alert if settlement exceeds a threshold. Document the coupling so it is not discovered under load. |
| **M2** | `bets.status` includes `rejected`, but rejected bets are never inserted (validation precedes insert). | Remove the dead enum value. |
| **M3** | Settlement broadcasts once per bet, so a multi-bet player receives several `game.settlement.completed` events with no round-level total, while the UI shows a single WIN figure. | Have `game.round.completed` carry that user's round totals, or require the client to aggregate. Specify which. |
| **M4** | V1 docs (`API.md`, `WEBSOCKET.md`, `DATABASE.md`, `AUTH.md`, `WALLET.md`, `GAME_STATE_MACHINE.md`) contradict their V2 successors and carry no superseded marker. | Add a header banner to each: superseded by `<V2 doc>` for Phase 2; retained as the Phase 1 record. `WALLET.md`'s open question "real currency or points?" is now answered — mark it CONFIRMED points-only per ADR-011. |
| **M5** | `RULES.md` §10 and `docs/SECURITY.md` §2 mandate bcrypt(12); `AUTH_V2.md` §5 specifies argon2id. | Update both to argon2id, cross-referencing `AUTH_V2.md` §5 for the rationale. Leaving two mandates in force guarantees someone implements the wrong one. |
| **M6** | `PRD.md` item 4 and §12 still ask whether the wallet is real money vs points, and treat points-only as unconfirmed. | Mark CONFIRMED (points-only, ADR-011) so the PRD stops contradicting `CLIENT_REQUIREMENTS.md`. |
| **M7** | `packages/types` still exports `RoundState.ResultGeneration` / `.Settlement`, `Wallet`, `WalletTransaction`, and `UserRole.Admin`. | Already scheduled as Phase 2 step 1 (ADR-014, 015, 021) — listed here so the review is complete. No action before coding. |

---

## Required Changes Before Coding

All nine are documentation edits. None require rethinking the architecture.

| # | Change | Document |
|---|---|---|
| 1 | Project `game_history` once at `ROUND_COMPLETED` (or upsert-accumulate); remove the per-bet insert | `POINTS_SYSTEM.md` §8, `DATABASE_V2.md` §5.1 |
| 2 | Canonical lock order **round → account → bet**; settlement takes account lock only | `POINTS_SYSTEM.md` §6 |
| 3 | Void permitted only when the round has zero settlements | `GAME_ENGINE_V2.md` §8, `API_V2.md` §8.3 |
| 4 | Add monotonic `stateVersion` to `game_rounds` and every round-state payload incl. snapshot; clients discard non-increasing versions | `DATABASE_V2.md` §4.5, `WEBSOCKET_V2.md` §2/§7/§9 |
| 5 | Resolve the bet submission model (per-chip vs batched) and set the rate limit to match | `API_V2.md` §6/§10 — **needs client confirmation first** |
| 6 | Make `end_point_minor`, `commi_point_minor`, `ntp_point_minor` nullable, no default | `DATABASE_V2.md` §5.2 |
| 7 | Specify duplicate `(category, selection)` handling — merge by summing | `API_V2.md` §6 |
| 8 | Document the client obligation to reuse an idempotency key across retries | `API_V2.md` §6, `POINTS_SYSTEM.md` §5 |
| 9 | Add superseded banners to the six V1 docs; align `RULES.md`/`SECURITY.md` on argon2id; mark `PRD.md` points-only as CONFIRMED | six V1 docs, `RULES.md`, `SECURITY.md`, `PRD.md` |

---

## Optional Improvements

Not blocking; worth considering.

1. **Settlement batch metrics** — record per-round settlement duration and bet count from day one, to inform `T_gap` and detect the M1 coupling before players do.
2. **`points_transactions` partitioning by month** — not needed at launch, but the ledger is the fastest-growing table and partitioning is far cheaper to introduce before it is large.
3. **Idempotency key retention policy** — currently "at least the round lifetime plus a window". Make it a concrete number once round durations are confirmed.
4. **Read replica for reports** — admin report queries over the ledger can be pushed to an RDS read replica if they start affecting gameplay latency. Not required for V1 scale.
5. **`ROUND_VOID` player messaging** — the payload carries a `reason` string; confirm whether it should be operator-facing only rather than shown verbatim to players.
6. **Snapshot size bound** — `myBets` is unbounded within a round. If per-chip betting is confirmed (H1), a heavy player's snapshot could grow large; consider summarising by selection.

---

## Security Review

**Approved.** No missing controls found in the design.

| Control | Status |
|---|---|
| Authentication | ✅ argon2id (memory-hard); constant-time verification even for unknown users; generic non-enumerating failures |
| Token model | ✅ 15-min access tokens bound the post-revocation window; opaque rotating refresh tokens; reuse detection revokes the chain |
| Authorization | ✅ Four-stage guard chain; ownership never inferred from a path parameter — no `/users/:id` route exists on the player surface |
| Admin isolation | ✅ Separate table + separate `aud`; a player token is structurally unusable against admin routes even if a guard is missed |
| Rate limiting | ✅ Per IP **and** per account (per-IP alone never triggers on distributed credential stuffing); lockout counters persisted on the user row so a cache flush cannot reset an attack |
| Input validation | ✅ DTOs with `whitelist` + `forbidNonWhitelisted`; WebSocket payloads validated before processing |
| Enumeration resistance | ✅ 404-not-403 for resources owned by others; generic auth errors |
| Audit | ✅ Every admin mutation writes its log row **in the same transaction** as its effect — neither can exist without the other |
| Secrets | ✅ AWS Secrets Manager; no secrets in source |
| Transport | ✅ HTTPS/WSS, HSTS, security headers, `SameSite=Strict` refresh cookie |
| WebSocket auth | ✅ Verified at connect; identity bound server-side; client never sends a user id; per-user rooms prevent cross-player data leakage |

**One observation, not a defect:** the 15-minute post-ban window on access tokens is correctly mitigated by immediate WebSocket disconnection on ban, so a banned player cannot continue to play. This is the right trade-off and is documented.

---

## Database Review

**Approved with the corrections above (C1, C3, H2).**

Strengths: correctness is enforced by constraints rather than only by application code — `UNIQUE(idempotency_key)`, `UNIQUE(bet_id)` on settlements, `UNIQUE(round_id)` on results, `CHECK(balance_minor >= 0)`, the partial unique index on live rounds, and the internal-consistency `CHECK` on ledger rows. These make several whole classes of bug unrepresentable. Append-only enforcement via triggers plus a restricted DB role is appropriate for a ledger. The seven continuously-verified invariants are the right safety net.

`BIGINT` centipoints over `DECIMAL` is correct and well-reasoned — the `node-postgres` → `parseFloat` precision trap is real and the resulting bug is invisible in code review.

`bet_items.selection` as `SMALLINT` with a per-category range `CHECK`, rather than JSONB, is the right modelling call: it is exactly the domain, indexes cleanly, and settlement matches on equality.

Indexes cover the documented access paths. No missing index identified for the specified queries.

**Corrections required:** C1 (history projection), C3 (void precondition), H2 (report nullability), M2 (dead enum value), plus the `stateVersion` column from C4.

---

## Realtime Review

**Approved with C4 fixed.**

**Failover analysis (as requested).** If the game-engine process dies:

1. Nothing is lost. All round state is in PostgreSQL; the engine holds no authoritative in-memory state.
2. In-flight work is safe: every transition is a guarded conditional `UPDATE`, and settlement is per-bet with `UNIQUE(bet_id)`, so a bet is either fully settled and committed or not settled at all. There is no partial-write state to repair.
3. ECS restarts the task (desired count 1). The new instance acquires the Redis leader lock — the old lock expires by TTL, which bounds the gap.
4. The reconciler tick reads current state and derives the next action, automatically catching up any transition whose time has passed. **This is the ordinary code path, not special recovery logic**, so it is exercised continuously rather than only during incidents.
5. During the gap, the API keeps serving: reads work, and bets are still correctly accepted or rejected because the deadline check uses the database clock, not the engine.
6. Player-visible impact is a brief pause in round advancement. Nothing is double-processed, because the partial unique index and the per-bet settlement constraint make duplicates impossible even if two engines briefly overlap.

**Recommendation:** alert on leader-lock age and on any round exceeding its expected state duration — the reconciler recovers silently, so without alerting a repeatedly-crashing engine could go unnoticed.

**Other realtime findings:** the room split (`game:` for shared state, `user:` for private) makes cross-player data leakage structurally impossible rather than dependent on a filter — correct. Snapshot-on-join over delta replay is the right recovery model. At-most-once delivery with "no event is required for correctness" is a sound contract. Clock handling is correct: countdown is a rendering of a server deadline, never an independent client timer, and lateness is enforced server-side regardless of client display.

---

## Points Ledger Review

**Approved with C1 and C2 fixed.** The four required protections are each blocked at multiple layers:

| Hazard | Defence |
|---|---|
| Duplicate debit | Client key → `bets(user_id, idempotency_key)` → `points_transactions(idempotency_key)` — three independent layers |
| Duplicate credit | `settlements(bet_id)` unique + deterministic server-derived key `settle:{round}:{bet}` |
| Negative balance | `FOR UPDATE` serialisation → in-lock revalidation → `CHECK(balance_minor >= 0)` |
| Concurrent requests | Row-level `FOR UPDATE` per account, `READ COMMITTED` sufficient |
| Replay | Unique idempotency keys, user-scoped |
| Failed transactions | All-or-nothing; ledger row and balance update always commit together |
| Partial settlement | Per-bet transactions, resumable, converging to exactly one settlement per bet |

**Transaction flows verified** (all four requested):

- **Bet placement** — one transaction: lock round (state + deadline vs DB clock), lock account, insert `bets` + `bet_items`, insert debit ledger row, update balance, commit, *then* broadcast. Correct, with C2's ordering fix applied.
- **Refund** — per bet, key `refund:{round}:{bet}`, credit + status change in one transaction; resumable. Correct, gated by C3's precondition.
- **Winning credit** — per bet, key `settle:{round}:{bet}`, `settlements` row + credit + `bet_items` outcome in one transaction. Correct once `game_history` moves out of this transaction (C1).
- **Admin adjustment** — audit row and ledger row in the same transaction, mandatory reason, same locking and idempotency, debit below zero rejected rather than clamped. Correct.

Every mutation is auditable: `reference_type` + `reference_id` always name the cause, and `balance_before`/`balance_after` are recorded per row.

**No unsupported business rules were introduced.** Payout arithmetic, commission, and win determination remain absent behind `SettlementRules`.

---

## Final Implementation Order

Reviewed against the preferred sequence in the brief. The plan's order is sound and is **retained with one deliberate deviation and one addition**:

```
 0. Documentation corrections (the nine Required Changes)      ← NEW, gates everything
 1. Shared types & points primitives          (foundation)
 2. Database schema & migrations              (database + migrations)
 3. NestJS service skeletons                  (foundation)
 4. Authentication & authorization            (auth)
 5. Points ledger                             (points)   ← highest risk; do not rush
 6. Round lifecycle                           (game-round service)
 7. Bet placement                              (betting)  ← deviation, see below
 8. WebSocket infrastructure                   (websocket)
 9. Result ingestion            [needs confirmations 1, 6, 12]
10. Settlement envelope         [needs confirmations 2, 3, 4]
11. History & reports           [needs confirmation 5]
12. Admin APIs                  [needs confirmation 8]
13. Hardening
14. Deployment
── Phase 3: frontend integration (out of Phase 2 scope)
```

**Step 0 is new and blocking.** The nine documentation corrections must land before step 1, because C1, C2, and C4 change the schema (`stateVersion`, nullable report columns) and the transaction design. Fixing them after step 2 means a migration and a rewrite of settlement.

**Deviation — betting (7) before WebSocket (8),** where the brief suggests the reverse. Bets are REST-only (ADR-016) and fully testable without any realtime layer, so building them first means the WebSocket layer has real, verified events to carry when it arrives, rather than being built against hypothetical ones. This is a preference, not a correctness matter — the reverse order also works, and H1's resolution may argue for swapping them if the client confirms per-chip betting.

**Unchanged:** steps 1–8 remain unblocked by client input; steps 9–12 remain gated. Payout multipliers, the win rule, and commission structure remain the critical path.

---

## NEEDS CLIENT CONFIRMATION

Carried forward from `PHASE_2_IMPLEMENTATION_PLAN.md` §2, **plus one new item surfaced by this review**.

| # | Question | Blocks | Status |
|---|---|---|---|
| **13** | **Is each chip placement an immediate server-side bet, or does the client accumulate selections and submit one bet per round?** | `POST /bets` contract, rate limits, snapshot size, `game_history` volume | **NEW — raised by this review (H1)** |
| 1 | Round durations `T_bet`, `T_lock`, `T_reveal`, `T_gap` per variant | Scheduler config | Open |
| 2 | Payout multipliers per category | Settlement | **Critical path** |
| 3 | Win-determination rule — does Doubles `72` win on draw `772`? | Settlement | **Critical path** |
| 4 | Commission / rake structure | Settlement, reports | **Critical path** |
| 5 | `END` / `COMMI POINT` / `NTP POINT` formulas | Report aggregation | Open |
| 6 | Timer vs Pro Timer differences | Pro variant | Open |
| 7 | Mandatory registration fields | Auth DTO | Open |
| 8 | Admin roles + permission matrix | Admin guards | Open |
| 9 | Min/max bet limits | Bet validation | Open |
| 10 | RNG algorithm + certification requirements | Deferred past Phase 2 | Open |
| 11 | Expected concurrent users | Infrastructure sizing | Open |
| 12 | Operating hours — 24/7 or scheduled? | Round creation policy | Open |

Item 13 should be asked alongside the critical-path three — it is cheap for the client to answer and it changes the API contract.

---

## AWS Review

**Approved as practical for V1.** ECS/Fargate (API at N, engine at 1), RDS PostgreSQL, ElastiCache Redis, ALB, CloudFront, WAF, S3, CloudWatch is a conventional, well-understood mapping with no unnecessary components. Nothing here is over-built for the initial deployment.

Three practical notes for step 14:
- **RDS Multi-AZ** is worth enabling from launch — the whole design depends on PostgreSQL being the single source of truth, so its availability is the platform's availability.
- **Engine deploys cause a brief round-advance pause** (desired count 1, no overlap). Acceptable, but deploy during low-traffic windows and expect the reconciler to catch up on start.
- **Single-node Redis is sufficient** for V1 given it holds no authoritative data; revisit only when concurrent-user numbers (confirmation 11) are known.

---

## Documentation Quality

Six contradictions were found between documents (C1, C2, H2, M4, M5, M6) and three within the Phase 2 set itself (C1, C2, H2). The Phase 2 documents are internally detailed and cross-referenced, but the V1 documents they supersede are still presented as current, which is the largest remaining risk to a future agent picking up this repo — an agent reading `docs/AUTH.md` would implement bcrypt and a 1-hour token in good faith.

Required change 9 addresses this. No major decision was silently rewritten in this review; the three decisions made are recorded as ADR-022, ADR-023, and ADR-024.

---

## Initial Approval Status (2026-09-09, superseded by the Resolution below)

**BLOCKED — CHANGES REQUIRED**

The architecture is fundamentally sound and, once the nine documentation corrections are applied, will be ready for implementation. Four critical defects (C1, C2, C3, C4) would each cause a production incident if coded as currently written — C1 in particular would halt the entire platform for all players. All are correctable in documentation before any code exists, which is precisely why this review exists.

---

# RESOLUTION — 2026-09-09

## Resolution Status

**All nine required changes applied.** All four CRITICAL and all four HIGH issues are resolved. Three of the seven MEDIUM issues (M4, M5, M6) were resolved as part of change 9; M7 was already scheduled as implementation step 1. The remaining three (M1, M2, M3) are non-blocking and carried forward with explicit dispositions below.

No application code was written. No Phase 1 UI was modified. `DECISIONS.md` remains append-only — ADR-025 was added; no historical ADR was altered or deleted.

## Issues Resolved

| # | Issue | Resolution | Documents changed |
|---|---|---|---|
| **C1** | `game_history` per-bet insert violates `UNIQUE (user_id, round_id)`, permanently stalling settlement and halting the game | Projection moved **out of the per-bet settlement transaction** to a single per-user aggregation at `ROUND_COMPLETED`, written idempotently with `ON CONFLICT … DO UPDATE` from source tables so a crash re-run converges rather than accumulating (ADR-024) | `DATABASE_V2.md` §5.1, `POINTS_SYSTEM.md` §8, `GAME_ENGINE_V2.md` §5, `PHASE_2_IMPLEMENTATION_PLAN.md` step 10 |
| **C2** | Stated lock order contradicted the documented bet flow → deadlock | Canonical order fixed at **round → account → bet** everywhere; **settlement takes the account lock only**, eliminating the cycle rather than ordering it; bet flow diagram annotated with lock sequence (ADR-022) | `POINTS_SYSTEM.md` §4.3/§6/§7, `ARCHITECTURE.md` §10.4.1 |
| **C3** | Void of a partially-settled round undefined → points created from nothing | Void now **permitted only when the round has zero settlements**, checked at the endpoint and re-checked inside the transaction under the round lock; returns `409 ROUND_PARTIALLY_SETTLED` otherwise. Documented that a partially-settled round is *completed by retry*, never voided, and that no automatic reversal path exists (adding one needs a client decision and its own ADR) | `GAME_ENGINE_V2.md` §8, `API_V2.md` §8.3/§11 |
| **C4** | WebSocket join race → stale snapshot overwrites newer state | Added monotonic `game_rounds.state_version`, incremented atomically in the same guarded `UPDATE` as each transition, carried by every round-state payload **including the snapshot**, with a new client ordering rule (`WEBSOCKET_V2.md` §8). Resolves the join race, duplicate delivery, and out-of-order arrival with one rule (ADR-023) | `DATABASE_V2.md` §4.5, `WEBSOCKET_V2.md` §2/§7/§8/§10, `GAME_ENGINE_V2.md` §2, `ARCHITECTURE.md` §10.4 |
| **H1** | Bet submission model unspecified; 30/min limit would break per-chip play | Contract specified as the **superset correct under either model** — no product rule invented. Rate limit raised to **240/min**, sized for the per-chip worst case (safe asymmetry: batching can only relax it). Question recorded as client confirmation **item 13**; it no longer gates steps 1–6 (ADR-025) | `API_V2.md` §6/§10, `CLIENT_REQUIREMENTS.md` item 13, `PHASE_2_IMPLEMENTATION_PLAN.md` §2 |
| **H2** | Report columns `NOT NULL DEFAULT 0` but API promised `null` | `end_point_minor`, `commi_point_minor`, `ntp_point_minor` made **nullable with no default**, so "not computed" is distinguishable from "computed as zero"; clients must render `null` as blank or `—`, never `0.00`. `sale`/`win` stay `NOT NULL DEFAULT 0` (derivations known) | `DATABASE_V2.md` §5.2, `API_V2.md` §7 |
| **H3** | Duplicate `(category, selection)` in one request → 500 | API **merges duplicates by summing `amountMinor`** before insert, matching the "more chips on the same cell" semantics of the unique constraint | `API_V2.md` §6 |
| **H4** | Client idempotency-key retry obligation unstated | Documented as a hard requirement on every client: **one key per intent, reused across all retries**; a fresh key only for a genuinely new bet. Flagged as the one path that defeats all three server-side layers | `API_V2.md` §6, `POINTS_SYSTEM.md` §5 |
| **M4** | V1 docs contradict V2 with no marker | **Superseded banners added to all six** V1 docs (`API.md`, `WEBSOCKET.md`, `DATABASE.md`, `AUTH.md`, `WALLET.md`, `GAME_STATE_MACHINE.md`), each naming its successor and listing the specific known divergences. `WALLET.md`'s open "real currency or points?" question marked **ANSWERED: points only** | six V1 docs |
| **M5** | `RULES.md` / `SECURITY.md` mandated bcrypt while `AUTH_V2.md` specified argon2id | Both updated to **argon2id** with parameters and rationale; `SECURITY.md` token expiry aligned to 15 minutes | `RULES.md` §10, `docs/SECURITY.md` §2 |
| **M6** | `PRD.md` still treated points-only as an open question | Item 4 marked **CONFIRMED: POINTS ONLY**; §12 updated to state payment integration is permanently out of scope, requiring a new client-confirmed ADR to change | `PRD.md` §12, §13 |

## Remaining Issues

Three MEDIUM issues remain open by decision. None blocks implementation.

| # | Issue | Disposition |
|---|---|---|
| **M1** | Rounds are strictly sequential per game (the one-live-round index means round N+1 cannot open until N completes), so slow settlement delays the next round | **Accepted for V1.** It matches the single-countdown UX in the reference and keeps the model simple. Mitigation is operational, not architectural: instrument settlement duration from day one, size `T_gap` from real measurements, and alert when settlement exceeds a threshold. Revisit only if measurement shows it constrains play. |
| **M2** | `bets.status` includes a `rejected` value that is never written (validation precedes insert) | **Deferred to implementation step 2.** A one-line enum cleanup with no design impact; folding it into the schema migration is cheaper than a separate documentation edit now. |
| **M3** | A multi-bet player receives several `game.settlement.completed` events with no round-level total, while the UI shows one WIN figure | **Deferred to Phase 3 (frontend integration).** The per-bet events already carry authoritative `balanceMinor`, so nothing is incorrect today; whether the server adds a round-total field or the client aggregates is a client-contract question best settled alongside confirmation item 13. |

## Remaining Client Confirmations

Thirteen open, unchanged in substance by this pass except for the addition of item 13. The critical path is unchanged: **items 2, 3, and 4** — without them settlement cannot be built.

| # | Question | Blocks | Priority |
|---|---|---|---|
| 2 | Payout multipliers per category | Settlement (step 10) | **Critical path** |
| 3 | Win-determination rule — does Doubles `72` win on draw `772`? | Settlement (step 10) | **Critical path** |
| 4 | Commission / rake structure | Settlement, reports | **Critical path** |
| 13 | Chip placement: immediate per-chip bet, or batched per round? | `POST /bets` client contract + rate tuning only — **no longer blocks steps 1–6** | High (cheap to answer) |
| 1 | Round durations `T_bet`, `T_lock`, `T_reveal`, `T_gap` per variant | Scheduler config (step 9) | High |
| 5 | `END` / `COMMI POINT` / `NTP POINT` formulas | Report aggregation (step 11) | Medium |
| 6 | Timer vs Pro Timer differences | Pro variant | Medium |
| 7 | Mandatory registration fields | Auth DTO (step 4) | Medium |
| 8 | Admin roles + permission matrix | Admin guards (step 12) | Medium |
| 9 | Min/max bet limits | Bet validation (step 7) | Medium |
| 10 | RNG algorithm + certification | Deferred past Phase 2 | Low |
| 11 | Expected concurrent users | Infra sizing (step 14) | Low |
| 12 | Operating hours — 24/7 or scheduled? | Round creation policy | Low |

## Post-Fix Validation

Re-verified across the full document set after applying the changes:

| # | Check | Result |
|---|---|---|
| 1 | Lock ordering consistent everywhere | ✅ `round → account → bet` in `POINTS_SYSTEM.md` §4.3, §6, §7 and `ARCHITECTURE.md` §10.4.1. Settlement documented as account-lock-only. No conflicting statement remains outside the review's own history section |
| 2 | Settlement safely handles multiple bets per user per round | ✅ Per-bet transactions with `UNIQUE (bet_id)`; `game_history` aggregates per user at completion; API documents multi-bet support explicitly |
| 3 | `game_history` cannot deadlock or block future rounds | ✅ Removed from the per-bet transaction; idempotent upsert computed from source tables |
| 4 | Reconnect / snapshot ordering race-safe | ✅ `stateVersion` on every round-state payload including the snapshot; client rule in `WEBSOCKET_V2.md` §8; version bump atomic with the state change |
| 5 | Chip-placement behaviour defined or flagged | ✅ Marked `NEEDS CLIENT CONFIRMATION` (item 13); server contract specified as the superset; no product rule invented |
| 6 | V1 docs carry superseded markers | ✅ All 6 banners present, each naming its successor and its known divergences |
| 7 | Points-only preserved | ✅ Every payment-term occurrence in the V2 docs is an explicit prohibition; no payment concept introduced |
| 8 | Server authority / Redis non-authoritative / Postgres as truth preserved | ✅ Unchanged by these fixes |
| 9 | `DECISIONS.md` append-only | ✅ ADR-025 appended; ADRs 001–024 untouched |
| 10 | Section numbering and cross-references | ✅ `WEBSOCKET_V2.md` renumbered after inserting §8; all `§8.1` references updated |

## Final Architecture Approval Status

**APPROVED FOR IMPLEMENTATION**

All blocking architectural issues are resolved. The four critical defects that would each have caused a production incident are fixed at the design level, before any code exists. The three remaining MEDIUM items are explicitly dispositioned and none blocks coding.

**Implementation may begin at step 1** of `docs/PHASE_2_IMPLEMENTATION_PLAN.md` (shared types and points primitives) **on human approval**. Steps 1–6 are unblocked by client input. Step 7 (bets) is buildable now — the contract is the superset — with rate-limit tuning pending item 13. Steps 9–12 remain gated on confirmations 1–6, 8, and 9.

Production RNG, payout calculation, settlement arithmetic, and any payment capability remain **out of scope** and behind unimplemented interfaces until separately confirmed and recorded in a new ADR.
