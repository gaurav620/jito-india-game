# JITO INDIA GAMES — Phase 2 Implementation Plan

> Version: 1.0 | Date: 2026-09-09 | Status: PLAN ONLY — IMPLEMENTATION NOT STARTED
> Phase 2 does not begin until the client confirmations in §2 are answered and a human approves.

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

### Step 1 — Shared types & points primitives
`packages/types`, `packages/shared`
- Rename `Wallet`/`WalletTransaction` → `PointsAccount`/`PointsTransaction`; add `bet_refund` to `TransactionRefType`.
- Update `RoundState`: `RESULT_GENERATION` → `RESULT_PENDING`, `SETTLEMENT` → `SETTLEMENT_PENDING`, add `ROUND_VOID`.
- Add `RoundVersioned` (`roundId` + `stateVersion`) and apply it to every round-state payload type (ADR-023).
- Add centipoint conversion helpers (the **only** place minor↔display conversion happens).
- Update WebSocket payload types to the V2 shapes.
- **Exit:** typecheck clean across the monorepo; Phase 1 apps still build (they consume these types); conversion helpers at 100% coverage.

### Step 2 — Database schema & migrations
- All 13 tables from `docs/DATABASE_V2.md`, with every constraint — the `CHECK`s, the unique indexes, the partial unique index on live rounds, `game_rounds.state_version`, and the nullable report columns.
- Append-only triggers on `points_transactions` and `admin_logs`; restricted DB role.
- Seed script for local development.
- **Exit:** migrations run clean up and down on an empty DB; a test proves each integrity constraint actually rejects its bad case (negative balance, duplicate settlement, second result, duplicate live round).

### Step 3 — NestJS service skeletons
`services/api`, `services/game-engine`
- Module structure, config loading, structured logging, health checks, global validation pipe (`whitelist` + `forbidNonWhitelisted`), error filter producing the `docs/API_V2.md` envelope.
- Postgres and Redis connections with pooling.
- **Exit:** both services boot, `/health` responds, an invalid request returns a correctly-shaped error.

### Step 4 — Authentication & authorization
- Registration (user + points account in one transaction), login, refresh with rotation **and reuse detection**, logout, logout-all.
- argon2id hashing; the guard chain from `docs/AUTH_V2.md` §9; separate admin auth with `aud` separation.
- **Exit:** integration tests cover reuse detection revoking the chain, `aud` mismatch rejection, lockout, and generic (non-enumerating) failure responses.

### Step 5 — Points ledger
- Ledger writes with `FOR UPDATE` locking, idempotency handling, balance projection.
- Admin adjustment endpoint (audit row in the same transaction).
- Reconciliation job for the §9 invariants.
- **Exit:** concurrency tests — N parallel debits on one account never overdraw and never lose a write; a replayed idempotency key returns the original result without a second ledger row. **This is the highest-risk step; do not proceed until these tests are convincing.**

### Step 6 — Round lifecycle (no result, no settlement)
- Round creation, `BETTING_OPEN` → `BETTING_ACTIVE` → `BETTING_LOCKED`, the reconciler tick, leader lock.
- Uses placeholder timings from local config, clearly marked unconfirmed.
- **Exit:** a round advances through betting states on the DB clock; killing and restarting the engine mid-round resumes correctly; two engine instances cannot both act.

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
