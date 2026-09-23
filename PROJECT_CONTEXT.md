# JITO INDIA GAMES — Project Context (Cross-Agent Handoff)

> This file is the authoritative cross-agent handoff memory for Claude Code, Antigravity, and any future agent. Read this before touching code. Also read `MEMORY.md` (session log), `DECISIONS.md` (ADRs, append-only), and `docs/CLIENT_REQUIREMENTS.md` (pending client questions).

---
## CURRENT PHASE

**Phase 2D — Round Lifecycle Foundation (Step 6) — IMPLEMENTATION + RUNTIME HARDENING COMPLETE**

## STATUS

Phase 2B (auth), Phase 2C (points ledger), and Phase 2D Step 6 (round lifecycle foundation, including a follow-up runtime-hardening pass) are all complete as of 2026-09-23. Branch `phase-2d/round-lifecycle`, created from `main` (== the merged Phase 2A + 2B + 2C PRs).

Phase 2D Step 6 implements exactly `docs/PHASE_2_IMPLEMENTATION_PLAN.md` Step 6's own scope: `RoundsService` (the round state machine, `ROUND_CREATED → BETTING_OPEN → BETTING_LOCKED` only), `RoundSchedulerService` (the reconciling tick + Redis leader-lock arbitration, reusing Phase 2A's `EngineRedisService` unchanged), and `services/api`'s `GamesModule` (`GET /games/:gameId/current-round`, the one read endpoint Step 6 needs). No new Prisma migration was needed — `game_rounds`, `RoundState`, and both relevant unique constraints already existed from Phase 2A.

A follow-up runtime-hardening pass fixed a pre-existing, unrelated `@jito/types` packaging blocker (same fix ADR-026 already applied to `@jito/shared`) and then **verified both services live via their actual compiled production start command** (`node dist/main.js`, not `nest start --watch`): PostgreSQL/Redis connectivity, clean DI graph resolution, and a real round advancing `ROUND_CREATED → BETTING_OPEN → BETTING_LOCKED` against the live database clock — including a genuine OS-process kill-and-restart proving crash recovery and no duplicate rounds, not a simulation. The same pass also re-verified the `current-round` response against the documented contract and removed one undocumented field (`lockedAt`) and fixed one type mismatch (`roundNumber`/`stateVersion` are documented as `number`, were being returned as `string`).

All gates verified: lint clean, typecheck clean, unit suite **243 passed / 27 skipped** (exit 0), real-PostgreSQL integration **7/7 (auth) + 10/10 (points) + 10/10 (rounds)** run together, `build` / `build:api` / `build -w services/game-engine` all clean, plus live production-style boot verification of both services.

**Explicitly out of Step 6's scope, untouched this session:** bet placement (`BETTING_OPEN → BETTING_ACTIVE` requires a bet to exist), result ingestion, settlement, RNG, payout multipliers, commission, WebSocket gateway. A round that reaches `BETTING_LOCKED` under this code simply stays there — this is the correct, intentional Step 6 boundary, not a defect.

**Phase 2D Step 7 (bet placement) and beyond must not start until:**
1. Explicit approval for a new session/branch (this session's mandate was Step 6 only)
2. Client confirmation of items 2, 3, 4 (payout multipliers, win-determination rule, commission/rake structure) — required before any settlement arithmetic is written; does NOT block bet placement itself

---

## COMPLETED

### Phase 0 + Phase 1 (from prior sessions — unchanged)
- Monorepo scaffold: npm workspaces across `packages/*`, `apps/*`, `services/*`. Baseline committed as `a964856`.
- Shared packages: `@jito/types`, `@jito/config`, `@jito/shared` (CJS output — ADR-026), `@jito/ui` (design system), `@jito/game-core` (Phaser 3 wheel, zero RNG).
- `apps/web` (Next.js 14): landing, login, register, download, lobby, `/games/triple-chance` (full 1:1 reference recreation), `/games/triple-chance-pro`.
- `apps/admin` (Next.js 14): Dashboard, Users & Points, Points Ledger, Game Rounds, Game History, Reports, Announcements, Downloads, Audit Logs. Points-only.
- `apps/desktop` (Electron): frameless, secure context isolation.
- `apps/mobile` (Capacitor): Android shell.
- 24 Phase 1 tests + lint + builds passing.

### Phase 2 Architecture (design only, prior session — approved)
- 7 design docs produced; ADR-014–025 appended; all 4 CRITICAL + 4 HIGH review issues resolved.
- See `docs/PHASE_2_ARCHITECTURE_REVIEW.md` and `docs/PHASE_2_IMPLEMENTATION_PLAN.md`.

### Phase 2A — Backend Foundation PLUS Review Fixes (COMPLETE as of 2026-09-10)
- Shared types V2, centipoints helpers, NestJS API + game-engine service skeletons, Docker, env config.
- Prisma migration: `services/api/prisma/migrations/20260910000000_phase2a_init/` — full DDL + CHECK constraints + append-only triggers.
- 17 Phase 2A review fixes applied (see MEMORY.md session log 2026-09-10).
- **Verification**: 132/132 tests, lint 0/0, typecheck clean, all builds clean.

### Phase 2B — Authentication & Users (COMPLETE as of 2026-09-15)

**What was implemented** (strictly within Phase 2B scope):

#### Database
- Prisma migration `20260914000000_phase2b_auth`: `sessions` table with XOR constraint (user_id XOR admin_id), refresh_token_hash (Argon2id), player failed_login_count/locked_until, index on admin_users.status.
- 2 migrations deployed, 0 pending.

#### Auth Service (`services/api/src/auth/`)
- `auth.service.ts`: register (Argon2id hash, atomic user + PointsAccount), login (Argon2id verify, IP rate-limit 5/15min, per-user 10/15min, lockout 15min after **10** consecutive failures), refresh (rotation + reuse detection — reuse revokes all user sessions), logout, logout-all, getMe.
- `auth.controller.ts`: POST register/login/refresh/logout/logout-all, GET me; httpOnly refresh cookie path-scoped to `/api/v1/auth`.
- DTOs: `register.dto.ts`, `login.dto.ts`, `refresh.dto.ts` — class-validator, whitelist + forbidNonWhitelisted.
- Guards: `player-jwt.guard.ts`, `admin-jwt.guard.ts`, `user-status.guard.ts` (PostgreSQL-authoritative session check with Redis cache), `admin-status.guard.ts`, `roles.guard.ts`.
- Strategies: `player-jwt.strategy.ts`, `admin-jwt.strategy.ts` — separate audiences (`jito-player` / `jito-admin`).
- Decorators: `current-user.decorator.ts`, `roles.decorator.ts`.
- Tests: `auth.service.spec.ts` (23 unit tests), `auth.integration.spec.ts` (7 real PostgreSQL tests — all 7 PASS).

#### Users Service (`services/api/src/users/`)
- `users.service.ts`: getProfile, updateProfile, changePassword (Argon2id verify + re-hash).
- `users.controller.ts`: GET/PATCH /users/profile, PATCH /users/password; PlayerJwtGuard + UserStatusGuard.
- DTOs: `update-profile.dto.ts`, `change-password.dto.ts`.
- Tests: `users.service.spec.ts` (3 unit tests).

#### Admin Auth Service (`services/api/src/admin/auth/`)
- `admin-auth.service.ts`: adminLogin, adminRefresh, adminLogout, adminGetMe — same Argon2id + rate-limit pattern as player auth.
- `admin-auth.controller.ts`: POST login/refresh/logout, GET me; separate httpOnly cookie path `/api/v1/admin/auth`.

#### Seed
- `services/api/prisma/seed.ts`: real Argon2id hashes at seed time. `admin` / `admin_dev_password`; `testplayer` / `test_password_1`; PointsAccount at 100,000 centipoints.

#### Runtime Bug Fixes Applied During Phase 2B
1. **DTO `import type` runtime metadata loss** — DTO classes imported as `import type` in controllers erased reflection metadata; `ValidationPipe` rejected all valid fields as unknown. Fixed: value imports with eslint-disable comments.
2. **`return res.status().json()` circular reference crash** — in both refresh handlers, returning the Express `Response` object with `passthrough: true` caused NestJS to try to serialize it → Socket circular reference → crash + `ERR_HTTP_HEADERS_SENT`. Fixed: `throw new UnauthorizedException(...)` instead.
3. **`@jito/shared` ESM vs CJS mismatch** — `packages/shared` emitted ESM syntax (`export {}`), but NestJS services load via CJS `require()`. Fixed: `module: "CommonJS"` in shared tsconfig. See ADR-026.
4. **NestJS DI `import type` on DI tokens** — `UserStatusGuard`, `AdminStatusGuard`, `RolesGuard`, service classes in auth/admin controllers — all converted to value imports.

#### Verification (all gates PASS)
- lint: 0 warnings/errors
- typecheck: clean
- Unit test suite: 184 passed | 7 skipped, exit code 0 (the 7 skipped are the PostgreSQL integration spec, skipped when `INTEGRATION_DB_URL` is not set — re-verified by Claude 2026-09-15)
- Real PostgreSQL integration tests (explicit): **7/7 PASS**
- `npm run build` (shared packages): PASS
- `npm run build:api`: PASS
- `npm run build -w services/game-engine`: PASS
- `npm run build:web`: PASS (10/10 static pages)
- `npm run build:admin`: PASS (12/12 static pages)
- Docker: PostgreSQL HEALTHY, Redis HEALTHY
- API: bootstrapped on port 3001, 0 DI errors
- Game Engine: bootstrapped on port 3003, 0 DI errors
- Health/Readiness: all 4 endpoints HTTP 200, database: up, redis: up
- Player auth runtime flow: 41/41 assertions PASS
- Admin auth runtime flow: PASS (login, me, logout, session revocation)
- Player/Admin boundary: player token → admin route = 401 PASS; admin token → player route = 401 PASS
- Security: no passwordHash/refreshTokenHash in any response; generic auth errors; rate limiter verified; revoked sessions block valid JWTs
- `git diff --check`: 0 whitespace errors
- PDF (`JITO-INDIA-GAMES-Complete-Documentation.pdf`): untracked/unstaged ✓

### Phase 2C — Points Ledger Foundation (COMPLETE as of 2026-09-22)

**What was implemented** (strictly within Phase 2C / Step 5 of `docs/PHASE_2_IMPLEMENTATION_PLAN.md`):

#### Database
- **No new migration.** `points_accounts`, `points_transactions`, `admin_logs` and every constraint they need (balance non-negative, amount positive, ledger self-consistency, `UNIQUE(idempotency_key)`, append-only triggers) were already created by the Phase 2A migration.

#### Points Ledger (`services/api/src/points/`)
- `points-ledger.service.ts` — `PointsLedgerService`, the sole authoritative mutation primitive. `applyMutation()` (standalone, opens its own transaction) and `mutateWithinTransaction(tx, params)` (composable into a caller's transaction — used by admin adjust today, will be used by bet debit/settlement credit later, ADR-028). Idempotency pre-check outside any lock, `FOR UPDATE` account lock inside the transaction, validate inside the lock, insert ledger row, update projection. P2002 race on the idempotency key resolves to the winner's row.
- `points.service.ts` — read-only `getBalance` / `listTransactions`, both scoped to the authenticated `userId`.
- `points.controller.ts` — `GET /points/balance`, `GET /points/transactions` (paginated, filterable by `referenceType` + date range).
- `reconciliation.service.ts` — `PointsReconciliationService.verifyAccount` / `verifyAll`, proving `docs/DATABASE_V2.md` §9 invariant 1. Callable/tested only — no cron wired, never auto-repairs.
- `dto/list-transactions-query.dto.ts` — pagination + filter query DTO.

#### Admin Points Adjustment (`services/api/src/admin/points/`)
- `admin-points.service.ts` — `AdminPointsService.adjust()`: writes `admin_logs` + the ledger mutation in ONE transaction (pre-generates the audit-log id, passes it as the ledger row's `referenceId`). Idempotency pre-check/replay, 404 on unknown target user, 400 on missing `Idempotency-Key`, 409 on key reuse with different parameters.
- `admin-points.controller.ts` — `POST /admin/users/:id/points/adjust`, `AdminJwtGuard` + `AdminStatusGuard` + `RolesGuard`, `@Roles(operator, super_admin)` (existing guard infra — no new permission matrix invented).
- `dto/adjust-points.dto.ts` — `direction`/`amountMinor`/`reason` (mandatory, non-empty).

#### Bugs Found and Fixed By Real-Database Testing
1. **`uuid = text`** — Postgres has no implicit cast; raw-SQL `WHERE user_id = ${...}` needed `::uuid`.
2. **`SUM(bigint)` returns `NUMERIC`, not `BIGINT`** — Prisma mapped it to a `Decimal`, not a JS `bigint`; `decimal === 0n` silently returned `false`. Fixed with `::bigint` on the `COALESCE(SUM(...), 0)` result. Mocks could not have caught either — exactly why Step 5 requires real-PostgreSQL tests.

#### Verification (all gates PASS)
- lint: 0 warnings/errors · typecheck: clean
- Unit test suite: **211 passed | 15 skipped, exit 0**
- Real PostgreSQL integration (explicit): **7/7 (auth) + 8/8 (points) PASS**
- `npm run build` / `build:api` / `build -w services/game-engine` / `build:web` (10/10) / `build:admin` (12/12): all PASS
- API: bootstrapped, 0 DI errors, all points/admin routes mapped
- **Live runtime: 20/20 PASS** — balance starts at 0, admin credit, idempotent replay, missing-header 400, missing-reason 400, player-blocked-from-admin 401, balance reflects credit, second independent credit, overdraft 422 `INSUFFICIENT_POINTS`, balance unaffected by failed debit, history total correct, unknown-user 404.
- Preflight: cookie-parser gap (flagged in a prior review) checked first — already fixed on `main`, no duplicate work.

### Phase 2D Step 6 — Round Lifecycle Foundation (COMPLETE as of 2026-09-23)

**What was implemented** (strictly within Step 6 of `docs/PHASE_2_IMPLEMENTATION_PLAN.md` — see MEMORY.md 2026-09-23 for full detail):

#### Database
- **No new migration.** `game_rounds`, `RoundState`, `uq_rounds_one_live_per_game`, and `(game_id, round_number)` all already existed from the Phase 2A migration.

#### Round Lifecycle (`services/game-engine/src/rounds/`)
- `rounds.service.ts` — `RoundsService`: `ROUND_CREATED → BETTING_OPEN → BETTING_LOCKED` only (`BETTING_ACTIVE` needs a bet, Step 7; `RESULT_PENDING`+ is Step 9). Every transition is a guarded `UPDATE … WHERE id=$id AND state=$expected`; locking alone also gates on PostgreSQL's `now()` via one raw-SQL statement (ADR-019). `reconcile(gameId)` does at most one transition per call — restart recovery is just calling it again, not special-cased code.
- `round-scheduler.service.ts` — `RoundSchedulerService`: the reconciling tick via `@nestjs/schedule`'s `SchedulerRegistry`, reusing Phase 2A's `EngineRedisService` leader lock unchanged. Reentrancy guard + per-game error isolation.
- `active-games.ts`, `display-code.ts` — active `GameId` list; a placeholder, provably-collision-free display-code generator (the documented format is undocumented/underivable — flagged `NEEDS CLIENT CONFIRMATION`, not guessed).
- `rounds.module.ts`, wired into `EngineAppModule`.

#### Read Endpoint (`services/api/src/games/`)
- `games.service.ts` / `games.controller.ts` / `games.module.ts` — `GET /games/:gameId/current-round`. Round identity/state/deadlines/stateVersion + serverTime + always-null `drawValue` only; `myBets`/`balanceMinor` deferred to Step 7, not stubbed.

#### Config
- `ROUND_BETTING_WINDOW_MS` (game-engine env var) — T_bet only, unconfirmed, short dev/test default, identical for both games (no Timer/Pro difference invented).

#### Bug Found and Fixed Before It Could Reach Production
- `RoundSchedulerService.onModuleDestroy()` crashed if `onModuleInit()` never ran (surfaced immediately by the existing `app.smoke.spec.ts`, which calls `moduleRef.close()` without `.init()`). Fixed with a `tickRegistered` guard flag — genuinely correct defensive practice, not a test-only patch.

#### Verification (all gates PASS)
- lint: 0 warnings/errors · typecheck: clean
- Unit test suite: **242 passed | 27 skipped, exit 0**
- Real PostgreSQL integration (explicit, all three suites together): **7/7 (auth) + 10/10 (points) + 10/10 (rounds) PASS**
- `npm run build` / `build:api` / `build -w services/game-engine`: all PASS
- **Not performed this pass**: a live process boot of either service — fixed and performed in the immediate follow-up runtime-hardening pass below.

### Phase 2D Runtime Hardening Pass (COMPLETE as of 2026-09-23)

**What was implemented/fixed** (see MEMORY.md 2026-09-23 "PHASE 2D RUNTIME HARDENING PASS" for full detail):

#### `@jito/types` CJS Fix (ADR-026 carry-over)
- `packages/types/tsconfig.json`: `module: "ESNext"` → `"CommonJS"`, `moduleResolution: "bundler"` → `"node"` — the identical fix ADR-026 already applied to `packages/shared`, same root cause, same consumer set. `packages/config` confirmed NOT a runtime dependency of either service and correctly left untouched.

#### Live Production-Style Boot (both services, via `node dist/main.js`)
- API: boots clean, PostgreSQL + Redis connect, all routes mapped (including `GamesController`), health/readiness both `up`/`up`.
- Game Engine: boots clean, PostgreSQL + Redis connect, `RoundsModule`/`RoundSchedulerService` initialize with zero DI errors, scheduler tick registers, both games' rounds create → open → lock live against the real DB clock.
- **Real OS-process crash-recovery proof** (not simulated): a round was created and left in `BETTING_OPEN` (persisted, deadline still in the future), the process was force-killed, a fresh process started, and it inherited the identical round UUID and correctly locked it — zero duplicate rounds. This directly exercises the single-writer / no-duplication / crash-recovery guarantees against a genuine second OS process, not just Vitest's `Promise.all`.
- **Graceful shutdown**: proven at the code level only (Windows terminates background Node processes unconditionally on `SIGTERM`, and `SIGINT` requires console attachment this process didn't have — confirmed via `taskkill /PID` without `/F` failing with "can only be terminated forcefully"). The shutdown-hook wiring itself is already proven correct (the `onModuleDestroy` bug found and fixed earlier this Step 6 pass is direct evidence Nest's real shutdown-hook mechanism invokes it).

#### Current-Round Contract Corrections (`services/api/src/games/games.service.ts`)
- `drawValue: null` — re-confirmed genuinely documented in `docs/API_V2.md` §5's own example. Kept.
- `lockedAt` — **removed**. Not part of `docs/WEBSOCKET_V2.md`'s `GameStateSnapshotPayload.round` shape (only exists there as a separate `BettingLockedPayload` WebSocket event). Was an invented field.
- `roundNumber`/`stateVersion` — **changed string → number**, matching the documented `GameStateSnapshotPayload.round` types exactly. A string would have silently broken ADR-023's numeric `stateVersion` comparison. Safe unlike points centipoints: these counters can never realistically approach `Number.MAX_SAFE_INTEGER`.

#### Verification (all gates PASS)
- lint: 0 warnings/errors · typecheck: clean
- Unit test suite: **243 passed | 27 skipped, exit 0**
- Real PostgreSQL integration (all three suites together): **7/7 (auth) + 10/10 (points) + 10/10 (rounds) PASS**
- `npm run build` / `build:api` / `build -w services/game-engine`: all PASS
- `npm run build:web` (10/10 pages) / `build:admin` (12/12 pages): sanity-checked clean (both depend on `@jito/types`, confirmed unaffected)
- **Live boot verification: both services confirmed via their real compiled start command**, not `nest start --watch`, not unit tests, not `tsc --noEmit`.

---

## IN PROGRESS

Nothing is mid-implementation. Phase 2D Step 6 is fully complete and validated. Not committed — awaiting human review per this session's instructions ("STOP before commit/push").

---

## BLOCKED

Phase 2D Step 7 (bet placement) and beyond are gated on:
1. Explicit approval to start a new session/branch for Step 7 (this session's mandate was Step 6 only)
2. Client confirmation of items 2, 3, 4 (payout multipliers, win-determination rule, commission/rake structure) — these gate settlement arithmetic only (Steps 9–10); bet placement itself (Step 7) is unblocked

---

## KNOWN ISSUES

1. **Reference screenshots incomplete.** `assets/reference/lobby/`, `login/`, `client-reference/`, `triple-chance-pro-timer/` are empty — those screens were built from spec inference only.
2. `.nvmrc` pins Node 20; dev machine runs Node 24. Passes on v24.
3. `apps/mobile/capacitor.config.ts` debug flags (`cleartext: true`, etc.) must be disabled before any real Android release.
4. **`npm run build:game-engine` not yet in root package.json** — use `npm run build -w services/game-engine` directly.
5. Audit vulnerabilities: ~35 total — inherited from Phase 1 deps (Electron). Run `npm audit fix` separately; do not block Phase 2D for this.
6. **Unit test suite exit code**: `npm run test` exits **0** with `243 passed | 27 skipped` (re-verified 2026-09-23).
7. ~~**BLOCKER — concurrent refresh is not serialized**~~ — **RESOLVED 2026-09-15 (ADR-027)**, re-verified unaffected by Phase 2C/2D.
8. **ADR mis-citation — partially corrected.** `services/api/prisma/migrations/20260914000000_phase2b_auth/migration.sql` still says "ADR-026" and was **deliberately left unedited** (applied + checksummed; editing it would break Prisma migration validation). `schema.prisma`/`auth.service.ts` correctly cite ADR-027. See DECISIONS.md ADR-027 for the full explanation.
9. **Vitest/esbuild does not emit `design:paramtypes`.** `Test.createTestingModule` + calling a method that dereferences a constructor-injected field resolves that field to `undefined` under this vitest config. **Production is unaffected**: real builds use `tsc`, which emits correct metadata. Still open — out of scope for Phase 2D to fix, same as prior phases.
10. ~~`packages/types/tsconfig.json` uses `module: "ESNext"`, breaking `node dist/main.js`~~ — **RESOLVED 2026-09-23 (runtime hardening pass)**: applied ADR-026's exact CJS fix. Both services verified to boot live via their real compiled start command.
11. **NEW (found 2026-09-23, platform limitation, not a code defect).** Graceful shutdown (`app.enableShutdownHooks()`) could not be verified via an external OS signal on this Windows/Git-Bash test harness: Windows terminates background Node processes unconditionally on `SIGTERM` (no handler runs), and `SIGINT` requires genuine console attachment a `&`-backgrounded process doesn't have. `taskkill /PID` without `/F` confirms this directly ("can only be terminated forcefully"). The shutdown-hook code itself is proven correct at the unit/integration level (see MEMORY.md). Verifying this properly would need either a Linux/macOS environment or a different process-spawning approach (e.g. a genuine child process with console/job-object control) — worth doing before a real production deploy, not urgent for Phase 2D.

---

## NEXT TASK

1. **Human review and approval** of Phase 2D Step 6 (+ runtime hardening pass) changes on branch `phase-2d/round-lifecycle`.
2. **Commit** (do not commit yet — waiting for approval, per this session's explicit "STOP before commit/push" instruction).
3. **On approval, Step 7 (bet placement)** — the ledger debit call already has a home (`PointsLedgerService.mutateWithinTransaction`, ADR-028); it composes into the SAME transaction that locks the round first (canonical lock order round → account → bet, ADR-022).
4. Consider fixing KNOWN ISSUE 9 (vitest decorator metadata) before the test suite grows further.
5. Consider a proper graceful-shutdown verification (KNOWN ISSUE 11) before a real production deploy — not urgent for Phase 2D itself.

**Do not start Step 7 (or any later step) without explicit approval.** No betting, WebSocket gateway, RNG, payout arithmetic, or commission calculation until separately approved / client items 2–4 are confirmed and recorded in a new ADR.

---

## REPORTING NOTE

**PHASE 2D STEP 6 + RUNTIME HARDENING PASS COMPLETE — VALIDATION PASSED (2026-09-23).**
243 unit tests PASS | 27 integration tests skipped in normal run (7/7 auth + 10/10 points + 10/10 rounds PASS when run explicitly together with a live DB) | lint 0/0 | typecheck clean | build/build:api/build-game-engine all clean | round lifecycle proven against real PostgreSQL: valid transitions, invalid-transition rejection, duplicate-transition idempotency, 10-way concurrent lock race (exactly 1 wins), 10-way concurrent round-creation race (exactly 1 created), monotonic stateVersion, crash-recovery from persisted state, stale-transition rejection, DB-clock deadline gating, zero points mutation | round lifecycle ALSO proven live against both services' real compiled production start command, including a genuine OS-process kill-and-restart | pre-existing `@jito/types` packaging blocker found in the prior session, fixed and verified this pass via ADR-026's established pattern | one undocumented API field removed (`lockedAt`) and one type mismatch fixed (`roundNumber`/`stateVersion` string→number) after re-checking the documented contract | waiting for human commit approval.
