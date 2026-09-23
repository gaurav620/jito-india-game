# JITO INDIA GAMES — Phase 2 Implementation Plan

> Version: 1.3 | Date: 2026-09-23 | Status: STEP 6 (round lifecycle foundation) COMPLETE — Steps 0–6 done. Steps 9–10 (result ingestion, settlement) remain gated on client confirmation of items 2, 3, 4.
> Step 7 (bet placement) does not begin until explicitly approved for a new session/branch.

---

## 1. Scope

**In scope:** NestJS API + game-engine services, PostgreSQL schema and migrations, Redis, authentication/authorization, the points ledger, round lifecycle, bet placement, result *ingestion*, the settlement *envelope*, history/report read models, WebSocket infrastructure, admin APIs, and the test suite for all of it.

**Explicitly out of scope for Phase 2:**

| Excluded | Why |
|---|---|
| Production RNG / result generation | Algorithm + certification unconfirmed (ADR-018) |
| Payout calculation | Multipliers unconfirmed |
| Win-determination rule | Reference material is ambiguous (`docs/GAME_ENGINE_V2.md` §6) |
| Commission / rake maths | Structure unconfirmed |
| Any payment capability | Prohibited by ADR-011, permanently |
| Frontend rewiring from mock to live data | Phase 3 |
| Legacy data migration | Export format unavailable |

Phase 2 builds the machinery that these plug into, with the boundaries defined as interfaces (`ResultSource`, `SettlementRules`) so adding them later is a contained, reviewable change rather than a refactor.

---

## 2. Blocking Client Confirmations

Steps 8–10 **cannot be completed** without these. Steps 1–7 can proceed immediately.

| # | Question | Blocks | Source |
|---|---|---|---|
| 1 | Round durations `T_bet`, `T_lock`, `T_reveal`, `T_gap` per variant | Scheduler config (step 8) | `CLIENT_REQUIREMENTS.md` 1 |
| 2 | Payout multipliers per category | Settlement (step 10) | `CLIENT_REQUIREMENTS.md` 2 |
| 3 | **Win-determination rule** — does Doubles `72` win on draw `772`? | Settlement (step 10) | `GAME_ENGINE_V2.md` §6 |
| 4 | Commission / rake structure | Settlement + reports | `CLIENT_REQUIREMENTS.md` 3 |
| 5 | `END` / `COMMI POINT` / `NTP POINT` formulas | Report aggregation (step 11) | `DATABASE_V2.md` §5.2 |
| 6 | Timer vs Pro Timer differences | Pro variant | `CLIENT_REQUIREMENTS.md` 4 |
| 7 | Mandatory registration fields | Auth DTO (step 4) | `CLIENT_REQUIREMENTS.md` 5 |
| 8 | Admin roles + permission matrix | Admin guards (step 12) | `PRD.md` 6 |
| 9 | Min/max bet limits | Bet validation (step 9) | `PRD.md` 10 |
| 10 | RNG algorithm + certification requirements | Deferred past Phase 2 | `PRD.md` 3 |
| 11 | Expected concurrent users | Infrastructure sizing (step 14) | `PRD.md` 13 |
| 12 | Operating hours — 24/7 or scheduled? | Round creation policy (step 8) | — |
| 13 | **Chip placement: immediate per-chip bet, or batched into one bet per round?** | `POST /bets` client contract + rate-limit tuning only — **does not block steps 1–6** | `API_V2.md` §6 |

**Items 2, 3, and 4 are the critical path.** Without them there is no settlement, and without settlement the round lifecycle cannot complete in production.

---

## 3. Implementation Order

Each step lists its exit criteria. **A step is not done until its tests pass** (`TESTING.md` coverage targets: services 80%, game-engine 85%).

### Step 0 — Architecture review corrections ✅ COMPLETE
- Applied all nine required changes from `docs/PHASE_2_ARCHITECTURE_REVIEW.md` on 2026-09-09.
- **Exit:** ✅ Met. All four critical defects (C1–C4) and four high issues (H1–H4) resolved; V1 docs carry superseded banners; no contradictions remain between Phase 2 documents.

### Step 1 — Shared types & points primitives ✅ COMPLETE
`packages/types`, `packages/shared`
- Renamed `Wallet`/`WalletTransaction` → `PointsAccount`/`PointsTransaction`; added `bet_refund` to `TransactionRefType`.
- Updated `RoundState`: `RESULT_GENERATION` → `RESULT_PENDING`, `SETTLEMENT` → `SETTLEMENT_PENDING`, added `ROUND_VOID`.
- Added `RoundVersioned` and applied it to every round-state payload type (ADR-023).
- Added centipoint conversion helpers.
- Updated WebSocket payload types to V2 shapes.
- **Exit:** ✅ Met. Typecheck clean across monorepo; Phase 1 apps still build; conversion helpers at 100% coverage.

### Step 2 — Database schema & migrations ✅ COMPLETE
- All 13 tables from `docs/DATABASE_V2.md` with every constraint — CHECK constraints, unique indexes, partial unique index on live rounds, `game_rounds.state_version`, nullable report columns.
- Append-only triggers on `points_transactions` and `admin_logs`.
- Migration 1 (`20260910_phase2a_init`): full Phase 2A schema. Migration 2 (`20260914_phase2b_auth`): `sessions` table with XOR constraint, refresh_token_hash, player lockout columns.
- Dev seed script with real Argon2id hashes.
- **Exit:** ✅ Met. Both migrations applied clean on live PostgreSQL (2/2 applied, 0 pending). Integration test 6 (XOR constraint rejects both-ids) and test 7 (XOR constraint rejects neither-ids) PASS.

### Step 3 — NestJS service skeletons ✅ COMPLETE
`services/api`, `services/game-engine`
- Module structure, config loading, NestJS Logger, health checks, global ValidationPipe (whitelist + forbidNonWhitelisted), GlobalExceptionFilter (API error envelope), RequestIdInterceptor.
- PostgreSQL (PrismaService) and Redis (RedisService) connections with lifecycle management.
- **Exit:** ✅ Met. Both services bootstrap with 0 errors. API: port 3001, PostgreSQL connected, Redis connected. Engine: port 3003, PostgreSQL connected, Redis connected. All 4 health/readiness endpoints return HTTP 200. Smoke test suites pass.

### Step 4 — Authentication & authorization ✅ COMPLETE
- Player registration (user + PointsAccount in one transaction), login, refresh with rotation and reuse detection (replay revokes all sessions), logout, logout-all.
- Argon2id hashing; IP rate-limiting (5/15min login, 3/hr register); per-user rate-limiting (10/15min); account lockout (5 fails → 15min).
- Full guard chain from `docs/AUTH_V2.md` §9: `PlayerJwtGuard`, `UserStatusGuard` (PostgreSQL-authoritative, Redis-cached), `AdminJwtGuard`, `AdminStatusGuard`, `RolesGuard`.
- Separate admin auth with `aud` separation (`jito-player` / `jito-admin`).
- Player profile read + update; password change.
- **Exit:** ✅ Met. Runtime: 41/41 player auth flow assertions PASS. Admin flow PASS. Boundary (player token on admin route → 401, admin token on player route → 401) PASS. Integration tests: reuse detection revokes chain (test 3+4), `aud` mismatch rejection (tests 6+7, C1+C2 boundary), concurrent registration uniqueness (test 2), concurrent refresh safety (test 5) — 7/7 PASS. Generic (non-enumerating) failure responses verified.

### Step 5 — Points ledger ✅ COMPLETE
- `PointsLedgerService` (`services/api/src/points/points-ledger.service.ts`): `FOR UPDATE` account locking inside a transaction, idempotency pre-check + P2002-race replay, balance projection updated in the same transaction as the ledger insert. `mutateWithinTransaction(tx, params)` is composable into a caller's transaction (used by admin adjust; will be used by future bet debit / settlement credit).
- Player read endpoints: `GET /points/balance`, `GET /points/transactions` (paginated, filterable).
- Admin adjustment endpoint: `POST /admin/users/:id/points/adjust` — `admin_logs` + the ledger mutation in ONE transaction.
- `PointsReconciliationService` for the §9 invariant 1 (`balance_minor = SUM(credits) - SUM(debits)`) — callable/tested, no cron wired (out of scope), never auto-repairs.
- No new migration — all required tables/constraints already existed from Step 2.
- **Exit:** ✅ Met. Real-PostgreSQL integration suite (`points.integration.spec.ts`, 8/8 PASS): 10 parallel debits against a 5-affordable-debit balance → exactly 5 succeed, 0 lost updates, balance never negative, reconciliation confirms `matches: true`; an idempotency key replayed sequentially AND concurrently (8-way race) never produces a second ledger row and never mutates the balance twice; two different keys produce two independent mutations; a failed mutation (insufficient balance) leaves no partial balance change, no orphan ledger row, and — for the admin path — no orphan `admin_logs` row; cross-user scoping verified against two real accounts in the same database. Two real bugs (missing `::uuid` cast, missing `::bigint` cast on a `SUM()` result) were found and fixed by these tests — proof the concurrency-test requirement above is load-bearing, not procedural. Live runtime: 20/20 PASS against a booted API + live DB. See MEMORY.md 2026-09-22 and `docs/PHASE_2_ARCHITECTURE_REVIEW.md`-adjacent ADR-028 for detail.

### Step 6 — Round lifecycle (no result, no settlement) ✅ COMPLETE
- `RoundsService` (`services/game-engine/src/rounds/rounds.service.ts`): `ROUND_CREATED` → `BETTING_OPEN` → `BETTING_LOCKED` only. `BETTING_OPEN` → `BETTING_ACTIVE` is NOT triggered here — it requires a bet to exist (Step 7); a round Step 6 creates simply never observes that sub-state, which is correct given no bet-placement code exists yet. `BETTING_LOCKED` and beyond (result ingestion, settlement) are explicitly out of scope — a round parked at `BETTING_LOCKED` is the correct Step 6 boundary, not a stall.
- Every transition is a conditional, guarded `UPDATE … WHERE id = $id AND state = $expected` (Prisma `updateMany` for state-only guards; raw SQL only for the one transition that also gates on PostgreSQL's own `now()` — locking). `state_version` increments atomically with `state` (ADR-023).
- `RoundSchedulerService` (`round-scheduler.service.ts`): the reconciling tick (`@nestjs/schedule` `SchedulerRegistry`, config-driven interval), with the Redis leader lock (Phase 2A's `EngineRedisService.acquireLeaderLock`/`renewLeaderLock`, reused unchanged) as layer 2 of ADR-017's three-layer single-writer enforcement. A reentrancy guard prevents a tick from overlapping itself if reconciliation ever outruns the interval; one game's reconcile failure never blocks another game's tick.
- Round creation concurrency (no duplicate live round) is enforced by the existing `uq_rounds_one_live_per_game` partial unique index and `(game_id, round_number)` unique constraint (both already migrated in Phase 2A) — a racing `create()` throws P2002, caught and treated as "another writer already won."
- Timing: new `ROUND_BETTING_WINDOW_MS` engine env var (T_bet only — `T_lock`/`T_reveal`/`T_gap` are not yet needed and are not introduced speculatively). Explicitly unconfirmed (`docs/CLIENT_REQUIREMENTS.md` item 1), short dev/test default, applied identically to both games (no Timer vs Pro Timer difference invented, item 4).
- `services/api`'s `GamesModule` adds the one read endpoint Step 6 needs: `GET /games/:gameId/current-round`, scoped to round identity/state/deadlines/stateVersion only — `myBets`/`balanceMinor`/`drawValue` (beyond always-null) are deferred to Steps 7 and 9, not stubbed.
- No new migration — the full `game_rounds` schema, both unique constraints, and `RoundState` enum already existed from the Phase 2A migration.
- **Exit:** ✅ Met. Real-PostgreSQL integration suite (`rounds.integration.spec.ts`, 10/10 PASS): a round advances `ROUND_CREATED → BETTING_OPEN → BETTING_LOCKED` on repeated `reconcile()` calls, gated by PostgreSQL's own `now()` (false before the deadline, true after); 10 concurrent lock attempts on one round — exactly 1 succeeds, `state_version` advances by exactly 1, never 10; 10 concurrent round-creation attempts for a game with none live — exactly 1 round created; a round left in `ROUND_CREATED` (simulated crash between create and open) is opened by the very next `reconcile()` call with no special-cased recovery code — restart recovery IS the normal path; a stale `openRound` attempt against an already-`BETTING_LOCKED` round is rejected without altering its state or version; a full create→open→lock cycle writes zero `points_transactions` rows. 27/27 real-PostgreSQL integration tests pass together (7 auth + 10 points + 10 rounds).

### Step 7 — Bet placement
- `POST /bets` with mandatory idempotency, full server-side re-validation inside one transaction with the ledger debit.
- **Exit:** bets rejected after the deadline by the DB clock; duplicate submissions create exactly one bet and one debit; `ROUND_MISMATCH` on a stale round id.

### Step 8 — WebSocket infrastructure
- Socket.IO `/game` namespace, handshake auth, rooms, Redis adapter, snapshot-on-join, timer sync, `points.updated`.
- **Exit:** two API instances fan out correctly via Redis; a reconnect produces a complete snapshot; an unauthenticated socket never joins a room; per-user events never reach a game room.

### Step 9 — Result ingestion *(needs confirmations 1, 6, 12)*
- `ResultSource` interface + `ManualResultSource` admin endpoint.
- `RESULT_PENDING` → `RESULT_PUBLISHED`, broadcast, stall alerting.
- **Exit:** a result can be entered once and only once; a second attempt is rejected; the round advances and broadcasts.

### Step 10 — Settlement envelope *(needs confirmations 2, 3, 4)*
- Per-bet transactional settlement, resumable, `UNIQUE (bet_id)` enforced, refunds and `ROUND_VOID` (void gated on zero settlements).
- `game_history` projected once per user at `ROUND_COMPLETED`, **outside** the per-bet transaction (ADR-024).
- `SettlementRules` interface with **no production implementation** — a no-payout stub for testing the machinery only.
- **Exit:** interrupting settlement mid-round and re-running settles every bet exactly once; the void path refunds every bet exactly once. Production settlement stays **disabled by configuration** until rules are confirmed.

### Step 11 — History & reports *(reports need confirmation 5)*
- `game_history` projection written in the settlement transaction; `report_daily_aggregates` job (Asia/Kolkata bucketing); rebuild endpoint.
- **Exit:** history matches source tables after a full round; a rebuild from scratch reproduces identical aggregates.

### Step 12 — Admin APIs *(needs confirmation 8)*
- All routes in `docs/API_V2.md` §8, every mutation audited in-transaction.
- **Exit:** a role cannot exceed its permissions; every mutating call produces an audit row; no audit row can exist without its effect (and vice versa).

### Step 13 — Hardening
- Rate limiting, security headers, WAF rules, secrets via AWS Secrets Manager, request-id propagation, structured logs with no sensitive fields.
- **Exit:** `npm run security-review`-style pass; rate limits verified under load; no token/hash/password appears in any log.

### Step 14 — Deployment *(sizing needs confirmation 11)*
- ECS task definitions (API desired-count N, **game-engine desired-count 1**), RDS, ElastiCache, ALB, CloudWatch alarms on the invariant job and round-stall detector.
- **Exit:** staging runs a full round end-to-end with a manual result; alarms fire correctly when a round stalls.

---

## 4. Dependency Graph

```
1 types ──► 2 schema ──► 3 skeletons ──┬──► 4 auth ──┬──► 5 points ──► 7 bets
                                       │             │                   │
                                       └─────────────┴──► 6 rounds ──────┤
                                                                         ▼
                                                      8 websocket ◄──────┤
                                                                         │
                                    9 results (needs 1,6,12) ◄───────────┤
                                              │                          │
                                              ▼                          │
                                   10 settlement (needs 2,3,4) ◄─────────┘
                                              │
                                              ▼
                                   11 history/reports (needs 5)
                                              │
                                              ▼
                                   12 admin (needs 8) ──► 13 hardening ──► 14 deploy
```

Steps 1–8 are unblocked today. Steps 9–12 are gated on client answers.

---

## 5. Testing Requirements

Beyond `TESTING.md`'s standing targets, Phase 2 must include these — they cover the failure modes that are expensive and hard to detect in production:

| Area | Required tests |
|---|---|
| Points | Parallel debits never overdraw; replayed key → one ledger row; balance always equals ledger sum |
| Settlement | Interrupt + resume → exactly one settlement per bet; void → exactly one refund per bet |
| Rounds | Engine restart mid-round resumes; two instances cannot both transition; late bet rejected on the DB clock |
| Auth | Refresh reuse revokes the chain; `aud` separation holds; failures don't enumerate accounts |
| WebSocket | Reconnect snapshot is complete; per-user events never leak to a game room; multi-instance fan-out |
| Constraints | Every DB constraint rejects its bad case (step 2) |

---

## 6. Definition Of Done

- [ ] All 14 steps complete with exit criteria met
- [ ] `npm run lint`, `typecheck`, `test`, `build` all clean
- [ ] Coverage targets met (services 80%, game-engine 85%)
- [ ] Integrity invariant job green in staging for a sustained run
- [ ] A full round completes end-to-end in staging with a manually-entered result
- [ ] Zero payment code (verified by the standing grep in the audit checklist)
- [ ] No RNG anywhere in the repo
- [ ] `MEMORY.md`, `PROJECT_CONTEXT.md`, `DECISIONS.md` updated
- [ ] Client sign-off on every confirmation item consumed

---

## 7. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Confirmations 2/3/4 never arrive | Settlement cannot ship; Phase 2 stalls at ~80% | Steps 1–8 deliver standalone value; escalate these three first |
| Win rule mis-specified | Wrong players paid; ledger correct but unfair | `rulesVersion` on every settlement; require written client sign-off before enabling |
| Points bug reaches production | Direct player loss; trust damage | Three-layer idempotency, DB constraints, invariant job, heaviest test coverage |
| Engine single point of failure | Rounds stall | Reconciler recovers on restart; stall alerting; fast ECS replacement |
| Scope creep toward payments | Regulatory exposure | ADR-011 is binding; the grep check is part of Definition of Done |
| Pro Timer differences unknown | Pro variant ships identical to standard | Confirmation 6; ships as a labelled variant until answered |
