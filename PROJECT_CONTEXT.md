# JITO INDIA GAMES — Project Context (Cross-Agent Handoff)

> This file is the authoritative cross-agent handoff memory for Claude Code, Antigravity, and any future agent. Read this before touching code. Also read `MEMORY.md` (session log), `DECISIONS.md` (ADRs, append-only), and `docs/CLIENT_REQUIREMENTS.md` (pending client questions).

---
## CURRENT PHASE

**Phase 2C — Points Ledger Foundation — IMPLEMENTATION COMPLETE**

## STATUS

Phase 2B (auth) and Phase 2C (points ledger) are both complete as of 2026-09-22. Branch `phase-2c/points-ledger`, created from `main` (== the merged Phase 2A + Phase 2B PRs).

Phase 2C implements Step 5 of `docs/PHASE_2_IMPLEMENTATION_PLAN.md`: the authoritative points ledger primitive (`PointsLedgerService`), the two player-facing read endpoints (`GET /points/balance`, `GET /points/transactions`), admin points adjustment (`POST /admin/users/:id/points/adjust`), and the invariant-verification service (`PointsReconciliationService`). No new Prisma migration was needed — every table and constraint already existed from Phase 2A.

All gates verified: lint clean, typecheck clean, unit suite **211 passed / 15 skipped** (exit 0), real-PostgreSQL integration **7/7 (auth) + 8/8 (points)**, all five builds clean, API boots with PostgreSQL + Redis connected and all points/admin routes mapped, **20/20 live runtime checks PASS**. Two genuine production bugs (a missing `::uuid` cast and a missing `::bigint` cast on a `SUM()` result) were found and fixed by the real-database integration tests — see MEMORY.md 2026-09-22 for detail; this is exactly why `docs/PHASE_2_IMPLEMENTATION_PLAN.md` Step 5 requires them.

The pre-existing cookie-parser gap (flagged in an earlier review) was checked first and found **already fixed** on `main` — no duplicate work was done.

**Phase 2D (game rounds, betting, settlement) must not start until:**
1. Human approves the Phase 2C commit/PR
2. Client confirmation of items 2, 3, 4 (payout multipliers, win-determination rule, commission/rake structure) — required before any settlement arithmetic is written

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

---

## IN PROGRESS

Nothing is mid-implementation. Phase 2C is fully complete and validated.

---

## BLOCKED

Phase 2D (Game Rounds, Betting, Settlement) is gated on:
1. Human approval of the Phase 2C commit/PR
2. Client confirmation of items 2, 3, 4 (payout multipliers, win-determination rule, commission/rake structure) — these gate settlement arithmetic only; round lifecycle state machine is unblocked

---

## KNOWN ISSUES

1. **Reference screenshots incomplete.** `assets/reference/lobby/`, `login/`, `client-reference/`, `triple-chance-pro-timer/` are empty — those screens were built from spec inference only.
2. `.nvmrc` pins Node 20; dev machine runs Node 24. Passes on v24.
3. `apps/mobile/capacitor.config.ts` debug flags (`cleartext: true`, etc.) must be disabled before any real Android release.
4. **`npm run build:game-engine` not yet in root package.json** — use `npm run build -w services/game-engine` directly.
5. Audit vulnerabilities: ~35 total — inherited from Phase 1 deps (Electron). Run `npm audit fix` separately; do not block Phase 2C for this.
6. **Unit test suite exit code**: `npm run test` exits **0** with `211 passed | 15 skipped` (re-verified 2026-09-22).
7. ~~**BLOCKER — concurrent refresh is not serialized**~~ — **RESOLVED 2026-09-15 (ADR-027)**, re-verified unaffected by Phase 2C.
8. **ADR mis-citation — partially corrected.** `services/api/prisma/migrations/20260914000000_phase2b_auth/migration.sql` still says "ADR-026" and was **deliberately left unedited** (applied + checksummed; editing it would break Prisma migration validation). `schema.prisma`/`auth.service.ts` correctly cite ADR-027. See DECISIONS.md ADR-027 for the full explanation.
9. **Vitest/esbuild does not emit `design:paramtypes`.** Found while writing `cookie-refresh.integration.spec.ts`: `Test.createTestingModule` + calling a method that dereferences a constructor-injected field resolves that field to `undefined` under this vitest config (esbuild's TS transform doesn't emit TypeScript's `emitDecoratorMetadata`). Every prior spec avoided the problem by either constructing classes with `new X(mockA, mockB)` directly, or (the Phase 2A/2B "DI smoke tests") never calling a method that dereferences an injected field — `HealthController.liveness()` touches no injected property, so it never surfaced this. **Production is unaffected**: `services/api/tsconfig.json` sets `emitDecoratorMetadata: true` and the real build (`nest build` → `tsc`) emits correct metadata — confirmed by the live runtime tests in this and the Phase 2B session, which all worked against the compiled build. Out of scope for Phase 2C to fix; worth a dedicated look before the test suite grows further, since a future `Test.createTestingModule`-based HTTP test could silently pass for the wrong reason (as the existing smoke tests do) rather than fail loudly.

---

## NEXT TASK

1. **Human review and approval** of Phase 2C changes on branch `phase-2c/points-ledger`.
2. **Commit** (do not commit yet — waiting for approval).
3. **Get client confirmation of items 2, 3, 4** before Phase 2D settlement work begins.
4. **On human approval, begin Phase 2D** at step 6 (round lifecycle, no result/settlement) and step 7 (bet placement — the ledger debit call already has a home: `PointsLedgerService.mutateWithinTransaction`).
5. Consider fixing KNOWN ISSUE 9 (vitest decorator metadata) before the test suite grows further.

**Do not start Phase 2D without explicit human approval.** No RNG, no payout arithmetic, no commission calculation until client items 2–4 are confirmed and recorded in a new ADR.

---

## REPORTING NOTE

**PHASE 2C COMPLETE — VALIDATION PASSED (2026-09-22).**
211 unit tests PASS | 15 integration tests skipped in normal run (7/7 auth + 8/8 points PASS when run explicitly with live DB) | lint 0/0 | typecheck clean | all 5 builds clean | full runtime points/admin flow verified live (20/20) | two real production bugs found and fixed by the real-DB tests | waiting for human commit approval.
