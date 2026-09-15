# JITO INDIA GAMES — Project Context (Cross-Agent Handoff)

> This file is the authoritative cross-agent handoff memory for Claude Code, Antigravity, and any future agent. Read this before touching code. Also read `MEMORY.md` (session log), `DECISIONS.md` (ADRs, append-only), and `docs/CLIENT_REQUIREMENTS.md` (pending client questions).

---
## CURRENT PHASE

**Phase 2B — Authentication & Users — COMPLETE / PRE-COMMIT VALIDATION PASSED**

## STATUS

Phase 2B (authentication and users) is complete as of 2026-09-15, **including the concurrent-refresh blocker fix (ADR-027)**.

All gates re-verified after the fix: lint clean, typecheck clean, unit suite 184 passed / 7 skipped (exit 0), real-PostgreSQL integration suite 7/7 (with a rewritten test 5 that exercises the production refresh path concurrently), all five builds clean, API boots with PostgreSQL + Redis connected, and a 21/21 runtime regression covering player auth, admin auth, live session revocation and cross-audience boundaries.

The branch `phase-2a/auth-users` is ready for Git checkpoint — pending explicit human approval to commit.

**Phase 2C must not start until:**
1. Human approves the Phase 2B commit/PR
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

---

## IN PROGRESS

Nothing is mid-implementation. Phase 2B is fully complete and pre-commit validated.

---

## BLOCKED

Phase 2C (Game Rounds, Betting, Settlement) is gated on:
1. Human approval of Phase 2B commit/PR
2. Client confirmation of items 2, 3, 4 (payout multipliers, win-determination rule, commission/rake structure) — these gate settlement arithmetic only; round lifecycle state machine is unblocked

---

## KNOWN ISSUES

1. **Reference screenshots incomplete.** `assets/reference/lobby/`, `login/`, `client-reference/`, `triple-chance-pro-timer/` are empty — those screens were built from spec inference only.
2. `.nvmrc` pins Node 20; dev machine runs Node 24. Passes on v24.
3. `apps/mobile/capacitor.config.ts` debug flags (`cleartext: true`, etc.) must be disabled before any real Android release.
4. **`npm run build:game-engine` not yet in root package.json** — use `npm run build -w services/game-engine` directly.
5. Audit vulnerabilities: ~35 total — inherited from Phase 1 deps (Electron). Run `npm audit fix` separately; do not block Phase 2B for this.
6. **Unit test suite exit code**: re-verified by Claude on 2026-09-15 — `npm run test` exits **0** with `184 passed | 7 skipped`. The earlier "exit code 1" note was inaccurate. Use `INTEGRATION_DB_URL=<dsn> npx vitest run services/api/src/auth/auth.integration.spec.ts` to run the integration suite explicitly (7/7 PASS).

7. ~~**BLOCKER — concurrent refresh is not serialized**~~ — **RESOLVED 2026-09-15 (ADR-027).** `AuthService.refresh()` now runs the whole read-check-rotate critical section inside one `prisma.$transaction`, so the `FOR UPDATE` row lock is held to COMMIT. `createSession()` / `revokeAllSessions()` take an optional executor (root client or transaction client) — login paths unchanged, no duplicated logic, no `any`. Re-verified: 5/5 concurrent races against live PostgreSQL leave ≤1 valid session; integration test 5 rewritten to call the real service concurrently.

8. **ADR mis-citation — partially corrected.** `schema.prisma` and `auth.service.ts` now correctly cite **ADR-027** for the session-ownership XOR design and reuse/concurrency semantics. `services/api/prisma/migrations/20260914000000_phase2b_auth/migration.sql` still says "ADR-026" and was **deliberately left unedited**: the migration is already applied and its checksum is recorded in `_prisma_migrations`, so changing the file would break Prisma's migration validation. ADR-027 records this explicitly. (ADR-026 remains the `@jito/shared` CommonJS decision; DECISIONS.md is append-only and was not rewritten.)

---

## NEXT TASK

1. **Human review and approval** of Phase 2B changes on branch `phase-2b/auth-users`.
2. **Commit** (do not commit yet — waiting for approval).
3. **Get client confirmation of items 2, 3, 4** before Phase 2C settlement work begins.
4. **On human approval, begin Phase 2C** at step 5 (points ledger), step 6 (round lifecycle, no result/settlement), step 7 (bet placement).

**Do not start Phase 2C without explicit human approval.** No RNG, no payout arithmetic, no commission calculation until client items 2–4 are confirmed and recorded in a new ADR.

---

## REPORTING NOTE

**PHASE 2B COMPLETE — PRE-COMMIT VALIDATION PASSED (2026-09-15).**
184 unit tests PASS | 7 integration tests skipped in normal run (but 7/7 PASS when run explicitly with live DB) | lint 0/0 | typecheck clean | all 5 builds clean | full runtime auth flow verified | waiting for human commit approval.
