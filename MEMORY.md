# JITO INDIA GAMES — Project Memory

> Running log of project state. Updated after every meaningful development session.

---

## Current State

| Aspect | Status |
|--------|---------|
| Phase | PHASE 2D — Round Lifecycle Foundation (Step 6) — **implementation + runtime hardening complete, all validation PASS incl. live production-style boot** (2026-09-23) |
| Repository | Fully initialized & validated |
| Documentation | 8 root context files + 18 docs files (Phase 1) + Phase 2 architecture docs |
| Monorepo | npm workspaces (`packages/*`, `apps/*`, `services/*`) |
| Shared Packages | `@jito/types` (V2, **now CJS output — see ADR-026 carry-over fix below**), `@jito/config`, `@jito/shared` (CJS output — ADR-026), `@jito/ui`, `@jito/game-core` |
| Applications | `apps/web` (Next.js), `apps/admin` (Next.js), `apps/desktop` (Electron), `apps/mobile` (Capacitor) |
| Services | `services/api` (NestJS — port 3001), `services/game-engine` (NestJS — port 3003, single writer) |
| Prisma Schema | 13 tables — 2 migrations applied (20260910_phase2a_init + 20260914_phase2b_auth), 0 pending. **No Phase 2D migration needed** — `game_rounds`, `RoundState`, the `uq_rounds_one_live_per_game` partial unique index, and `(game_id, round_number)` unique constraint all already existed from Phase 2A. |
| Tests | **243 tests passing across 28 test files** (27 skipped integration tests when `INTEGRATION_DB_URL` unset, exit 0) + **7/7 (auth) + 10/10 (points) + 10/10 (rounds) real PostgreSQL integration tests PASS** when run with a live DB, all three suites together |
| Build & Lint | `npm run lint` → 0 warnings/errors, `npm run typecheck` → clean (packages + api + engine), `npm run build` → clean, `npm run build:api` → clean, `npm run build -w services/game-engine` → clean, `npm run build:web`/`build:admin` → clean (sanity-checked, unaffected by the `@jito/types` fix) |
| Docker | **RUNNING** — PostgreSQL 16-alpine (HEALTHY) + Redis 7-alpine (HEALTHY) on local Docker |
| API Runtime | **Verified live via the actual compiled `node dist/main.js` start command** (not `nest start --watch`) — PostgreSQL + Redis both connect, all routes mapped incl. `GamesController`, health/readiness both report `up`/`up`. |
| Game Engine Runtime | **Verified live via `node dist/main.js`** — round scheduler tick registers, leader lock acquires, both games' rounds create → open → lock on the real DB clock. Crash-recovery and no-duplicate-round guarantees re-proven against the actual OS process (killed and restarted, not simulated) — see session log below. |
| Phase 2D Gate | Step 6 (round lifecycle: `ROUND_CREATED → BETTING_OPEN → BETTING_LOCKED` only) COMPLETE, now including live runtime verification. Step 7 (bet placement) and beyond require a new explicit approval. Steps 9–10 (result ingestion, settlement) remain gated on client confirmation of items 2/3/4 — untouched this session, no RNG/payout/settlement code exists anywhere. |

---

## Session Log

### 2026-09-08 — PHASE 0: Project Initialization
**Status**: COMPLETED
- Repository initialized (`git init`)
- Root configurations created: `.gitignore`, `.nvmrc`, `.editorconfig`, `.env.example`, `package.json`, `tsconfig.json`, `.eslintrc.js`, `.prettierrc`, `vitest.config.ts`
- 8 root context files & 18 docs files created
- Shared packages initialized (`@jito/types`, `@jito/config`, `@jito/shared`)
- Validation verified: lint, typecheck, tests passing.

### 2026-09-08 — PHASE 1: Design, UI Foundation & Reference Recreation
**Status**: COMPLETED
- Reference Asset Organization:
  - Reference screenshots from client recordings organized into `assets/reference/`
  - Complete inventory documented in `docs/UI_SPEC.md` and `docs/ASSET_PIPELINE.md`
- Shared Design System (`@jito/ui`):
  - Created Button, Input, Modal, Chip, GridCell, Countdown, Table, Tabs, Card, GameCard, Badge, Toast, Loader, ErrorState, EmptyState, CasinoTopBar, SectionHeader, and OrnateFrame (baroque gold filigree).
- Phaser 3 Game Core Prototype (`@jito/game-core`):
  - Created 3-Ring Concentric Wheel: Outer ring (Triples 0-9 red), Middle ring (Doubles 0-9 green), Inner ring (Singles 0-9 purple), top pointer, center gold sphere.
  - State consumer architecture (`idle` -> `rotating` -> `slowing` -> `final_result`), pure mathematical calculation of angles, zero client RNG.
  - Wrapped in `<PhaserWheel />` React container.
- Public Web Application (`apps/web`):
  - Landing Page (`/`): Rebranded JITO INDIA GAMES, download buttons for PC, Print, Android, live ticker, feature showcase.
  - Authentication: `/login` and `/register`.
  - Download Hub: `/download`.
  - Lobby: `/games` with category tabs and game cards.
  - Triple Chance Timer (`/games/triple-chance`): 1:1 recreation of desktop casino game interface with Doubles 00-99 grid, Triples 000-999 range selector, Singles bar, chips tray, action buttons, recent history table, PLAY/WIN points, and interactive round simulator.
  - Triple Chance Pro Timer (`/games/triple-chance-pro`): Pro variant shell.
- Admin Operation Console (`apps/admin`):
  - Built Next.js 14 console with Dashboard, Users & Points, Points Ledger, Game Rounds, Game History, Reports, Announcements, Downloads, and Audit Logs.
  - Strictly points accounting only — zero payment gateways.
- Desktop & Mobile Shells:
  - Electron Windows shell in `apps/desktop` with secure context isolation, frameless window controls, and compiled `dist/main.js`.
  - Capacitor Android shell in `apps/mobile` with `capacitor.config.ts` configured for landscape gaming.
- Testing & Quality:
  - 24 unit tests passing in Vitest.
  - ESLint passing with 0 warnings.
  - Next.js production builds passing for `apps/web` and `apps/admin`.

---

### 2026-09-09 — CLAUDE HANDOFF AUDIT (Phase 1 Verification)
**Status**: COMPLETED
- Verified the Antigravity-built Phase 1 implementation against the source tree (not just prior MEMORY.md claims). Confirmed: monorepo intact, 8 root docs + 18 `docs/*.md` present, all apps/packages/services present as documented, zero payment-gateway/UPI/deposit/withdrawal code anywhere in source (grep-verified — only doc/UI negation text and a false-positive "striped" comment matched).
- Re-ran validation from a clean state (`node` was not on PATH in this session's default shell; resolved by using `C:\Program Files\nodejs`):
  - `npm run lint` → 0 warnings.
  - `npm run typecheck` → clean.
  - `npm run test` → 24/24 passing.
  - `npm run build` (types/config/shared) → clean.
  - `npm run build:web` and `npm run build:admin` → both compile, typecheck, and statically generate all routes with no errors (re-verified after cleanup below with a full `.next` cache clear).
- **Fixed**: found and deleted ~150 stray compiled `.js`/`.js.map`/`.d.ts`/`.d.ts.map` files sitting next to nearly every `.ts`/`.tsx` source file across `apps/web/src`, `apps/admin/src`, `apps/desktop/src`, `apps/mobile/`, and all of `packages/ui/src` and `packages/game-core/src`. These were dead build output (not referenced by any `package.json` main/types field, which point at `dist/` or directly at `src/*.ts`) left behind from an earlier ad hoc `tsc` invocation, and were about to be committed since `.gitignore` had no rule for them. Deleted all of them and added `.gitignore` patterns to prevent recurrence. Reconfirmed lint/typecheck/test/build all still pass after deletion — see `DECISIONS.md` ADR-013.
- No functional/business-logic code was changed. No components were rewritten.

### 2026-09-09 — PHASE 2 ARCHITECTURE DESIGN (Design Only — No Code)
**Status**: COMPLETED (design), IMPLEMENTATION NOT STARTED
- Designed the complete Phase 2 backend foundation and produced seven documents: `docs/DATABASE_V2.md`, `docs/POINTS_SYSTEM.md`, `docs/AUTH_V2.md`, `docs/API_V2.md`, `docs/WEBSOCKET_V2.md`, `docs/GAME_ENGINE_V2.md`, `docs/PHASE_2_IMPLEMENTATION_PLAN.md`.
- Appended **ADR-014 through ADR-021** to `DECISIONS.md`; added §10 (Phase 2 Backend Architecture) to `ARCHITECTURE.md`.
- Key decisions: points-only table naming with `BIGINT` centipoint storage (avoids the `NUMERIC`→`parseFloat` precision trap); round states renamed to `RESULT_PENDING`/`SETTLEMENT_PENDING` plus a new terminal `ROUND_VOID`; bets placed over REST only (WebSocket `game.bet.place` removed); single-writer game-engine enforced by three layers; a reconciling scheduler instead of in-memory timers; rebuildable history/report read models; separate admin identity table and token audience.
- **Deliberately not designed into existence**: production RNG, result generation, payout multipliers, settlement arithmetic, commission maths, and any payment capability. `ResultSource` and `SettlementRules` are specified as interfaces with no production implementation (ADR-018), so unconfirmed business rules stay outside the codebase.
- **Important finding**: the reference material shows the draw is a *single* 3-digit number (`772`), with Doubles (`72`) and Singles (`2`) derived from its trailing digits — the Phase 1 UI already does this. But the reference win-state screenshot shows a Triples cell `063` paying out on a `772` draw, which the derivation does not explain. The win-determination rule is therefore explicitly flagged as unconfirmed rather than inferred.
- No code was written. No Phase 1 code was modified.

### 2026-09-09 — PHASE 2 ARCHITECTURE REVIEW (Review Only — No Code)
**Status**: COMPLETED — verdict **BLOCKED — CHANGES REQUIRED**
- Formally reviewed the Phase 2 design from architect / backend / realtime / database / security / QA perspectives. Output: `docs/PHASE_2_ARCHITECTURE_REVIEW.md`.
- **Approved**: points-only compliance (grep-verified, zero payment concepts), server authority (complete and correct), result-model extensibility (business rules insertable later with no migration), RNG isolation, Redis boundaries (never authoritative), idempotency model, auth model, single-writer engine + failover analysis, reconciling scheduler, no redundant tables.
- **Four critical defects found**, three of them contradictions *between* documents rather than within one:
  - **C1** — `game_history` is inserted per bet but constrained `UNIQUE (user_id, round_id)`. A player with 2+ bets in a round breaks settlement permanently; the round never completes, and the one-live-round index then prevents any new round opening — **the game halts for every player**.
  - **C2** — `POINTS_SYSTEM.md` §6 states lock order `account → round` but §7's own bet flow does `round → account`. Deadlock between bet and settlement paths under load.
  - **C3** — voiding a partially-settled round is undefined (winners paid *and* refunded, no reversal path).
  - **C4** — WebSocket join race: the socket joins the room before the snapshot is sent, so a stale snapshot can overwrite newer state on reconnect.
- Also 4 HIGH (incl. the bet rate limit of 30/min likely being far too low for real play) and 7 MEDIUM issues (mostly V1 docs contradicting their V2 successors with no superseded marker — an agent reading `docs/AUTH.md` would implement bcrypt in good faith).
- **New client question surfaced**: is each chip placement an immediate server bet, or does the client batch selections into one bet per round? This changes the `POST /bets` contract, rate limits, and history volume. Added as confirmation item 13.
- **Nine required changes** identified — all documentation edits, no architectural rework. **Deliberately not applied**, pending approval, so no major decision is rewritten silently. A new **step 0** now gates implementation.
- Appended **ADR-022** (canonical lock order round → account → bet; settlement takes no round lock), **ADR-023** (monotonic `stateVersion` for realtime ordering), **ADR-024** (project `game_history` at round completion, not per bet).
- No code written. No Phase 1 UI modified.

### 2026-09-09 — PHASE 2 REVIEW FIXES APPLIED (Documentation Only — No Code)
**Status**: COMPLETED — architecture now **APPROVED FOR IMPLEMENTATION**
- Applied all nine required corrections from `docs/PHASE_2_ARCHITECTURE_REVIEW.md`. All four CRITICAL and all four HIGH issues resolved.
- **C1** — `game_history` moved out of the per-bet settlement transaction; now projected once per user at `ROUND_COMPLETED` via an idempotent upsert computed from source tables (ADR-024). This was the defect that would have halted the platform for every player once any user placed a second bet in a round.
- **C2** — canonical lock order fixed at `round → account → bet` everywhere; **settlement takes the account lock only**, which eliminates the deadlock cycle rather than merely ordering it (ADR-022).
- **C3** — `ROUND_VOID` now requires zero settlements (`409 ROUND_PARTIALLY_SETTLED` otherwise); documented that a partially-settled round is completed by retry and that no automatic reversal path exists.
- **C4** — added monotonic `game_rounds.state_version`, incremented atomically with each transition and carried on every round-state payload including the join snapshot, plus a client ordering rule (ADR-023). One rule fixes the join race, duplicate delivery, and out-of-order arrival.
- **H1** — bet API specified as the **superset of both submission models** rather than guessing the product rule; rate limit raised 30 → 240/min for the per-chip worst case (ADR-025). Recorded as client confirmation item 13; it no longer gates steps 1–6.
- **H2/H3/H4** — report columns with unconfirmed formulas made nullable (so they render blank, not a misleading `0.00`); duplicate `(category, selection)` merged by summing rather than 500-ing; client obligation to reuse an idempotency key across retries documented as a hard requirement.
- **Doc alignment** — superseded banners added to all six V1 docs (each naming its successor and known divergences); `RULES.md`/`SECURITY.md` moved from bcrypt to argon2id; `PRD.md` points-only marked CONFIRMED; `WALLET.md`'s "real currency or points?" question marked ANSWERED.
- Remaining non-blocking: M1 (sequential rounds — accepted, instrument settlement duration), M2 (dead `rejected` enum — fold into step 2 migration), M3 (settlement-event aggregation — settle in Phase 3 alongside item 13).
- Appended **ADR-025**. ADRs 001–024 untouched; `DECISIONS.md` remains append-only.
- No application code written. No Phase 1 UI modified.

### 2026-09-09 — PHASE 2A: Backend Foundation
**Status**: COMPLETED — 99/99 tests passing, lint clean, typecheck clean, build clean

**Scope implemented** (strictly within approved Phase 2A boundaries):

**A. Shared Types → V2**
- `packages/types/src/game.ts` — `RoundState` with `RESULT_PENDING`/`SETTLEMENT_PENDING`/`ROUND_VOID` (ADR-015), `RoundVersioned` (ADR-023), `BetItem.isWinner`/`payoutMinor`, BigInt centipoints throughout (ADR-014)
- `packages/types/src/wallet.ts` — Renamed to `PointsAccount`/`PointsTransaction`, `TxnRefType` + `BetRefund`, BIGINT centipoints
- `packages/types/src/websocket.ts` — V2 event names, `stateVersion` in all round payloads (ADR-023), removed `game.bet.place` client event
- `packages/types/src/index.ts` — Phase 1 compatibility aliases retained

**B. Shared Utilities**
- `packages/shared/src/centipoints.ts` — `toCentipoints` (truncates toward zero, never rounds up), `fromCentipoints`, `addCentipoints`, `subtractCentipoints`, `toCentipointsString`
- `packages/shared/src/centipoints.test.ts` — 33 tests, 100% coverage of conversion edge cases
- **Bug fixed**: original implementation used `toFixed(2)` which rounds (10.999 → 11.00 → 1100); corrected to `Math.trunc(x * 100 + EPSILON)` = 1099 ✓

**C. NestJS API Service (`services/api`)**
- `package.json` (NestJS deps + `@types/express`), `tsconfig.json`, `nest-cli.json`
- `src/config/` — `EnvironmentVariables` class with class-validator, `AppConfigService`, `AppConfigModule`
- `src/database/` — `PrismaService` (lifecycle hooks, `isHealthy()`), `PrismaModule` (global)
- `src/redis/` — `RedisService` (lifecycle, `isHealthy()`, key namespacing helpers for rate-limits/idempotency/user-status), `RedisModule` (global)
- `src/common/filters/` — `GlobalExceptionFilter` (error envelope: `{ success, statusCode, code, message, requestId }`)
- `src/common/interceptors/` — `RequestIdInterceptor` (sets X-Request-Id on every response)
- `src/health/` — `HealthController` (liveness: GET /health, readiness: GET /health/ready), `HealthModule`
- Module stubs: `AuthModule`, `UsersModule`, `PointsModule`, `GamesModule`, `BetsModule`, `HistoryModule`, `ReportsModule`, `AdminModule` (all with documented Phase 2B scope)
- `src/app.module.ts`, `src/main.ts` (validation pipe, global filter/interceptor)

**D. NestJS Game Engine Service (`services/game-engine`)**
- `package.json` (NestJS + `@nestjs/schedule` + `@types/express`), `tsconfig.json`, `nest-cli.json`
- `src/config/` — `EngineEnvironmentVariables`, `EngineConfigService`, `EngineConfigModule`
- `src/database/` — `EnginePrismaService`, `EnginePrismaModule`
- `src/redis/` — `EngineRedisService` (leader lock: SET NX PX + Lua renew/release, pub/sub publisher), `EngineRedisModule`
- `src/common/filters/` — `EngineExceptionFilter`
- `src/health/` — `EngineHealthController`, `EngineHealthModule`
- `src/result/result-source.interface.ts` — `ResultSource` interface + `ManualResultSource` stub (throws in Phase 2A — deliberately unimplemented per ADR-018)
- `src/settlement/settlement-rules.interface.ts` — `SettlementRules` interface with zero implementations (all methods gated on client confirmation of items 2–4)
- `src/app.module.ts`, `src/main.ts`

**E. Prisma Schema**
- `services/api/prisma/schema.prisma` — all 13 tables: users, sessions, points_accounts, points_transactions (append-only ledger, UNIQUE idempotency_key), game_rounds (stateVersion, partial UNIQUE index for one-live-round-per-game documented in comment), bets (UNIQUE user_id+idempotency_key), bet_items (UNIQUE bet_id+category+selection), game_results (UNIQUE round_id), settlements (UNIQUE bet_id), game_history (UNIQUE user_id+round_id, projected at ROUND_COMPLETED per ADR-024), report_daily_aggregates (nullable unconfirmed columns per H2), admin_users (ADR-021), admin_logs (append-only audit)
- `services/api/prisma/seed.ts` — idempotent dev seed (1 admin, 1 test player, 1 PointsAccount at 1000 pts = 100,000 centipoints)

**F. Docker / Local Dev**
- `docker-compose.yml` — PostgreSQL 16-alpine + Redis 7-alpine, named volumes, health checks
- `docker/postgres/init.sql` — enables pgcrypto + uuid-ossp extensions
- `.dockerignore` — excludes node_modules, .env files, dist, tests, docs from build context
- `services/api/Dockerfile` — multi-stage (builder + non-root runner), health check
- `services/game-engine/Dockerfile` — multi-stage (builder + non-root runner), health check

**G. Environment Config**
- `.env.example` — fully updated to Phase 2: DATABASE_URL (Prisma DSN), REDIS_URL, JWT_AUDIENCE_PLAYER/ADMIN split (ADR-021), ENGINE_LEADER_LOCK_TTL_MS, ENGINE_TICK_INTERVAL_MS, LOG_FORMAT

**H. Foundation Tests (all new)**
- `services/api/src/config/config.spec.ts` — 10 tests (validateEnv validation contract)
- `services/api/src/common/filters/http-exception.filter.spec.ts` — 6 tests (error envelope, requestId, RATE_LIMIT_EXCEEDED code, validation errors)
- `services/api/src/database/prisma.service.spec.ts` — 5 tests (lifecycle, isHealthy true/false)
- `services/api/src/redis/redis.service.spec.ts` — 10 tests (lifecycle, isHealthy, key helpers)
- `services/api/src/health/health.controller.spec.ts` — 7 tests (liveness, readiness ok/degraded combos)
- `services/game-engine/src/health/health.controller.spec.ts` — 4 tests

**Verification results**: lint 0/0, typecheck clean, test 99/99, build clean, build:api clean.

**Phase 2B gate conditions** (do NOT start 2B until):
1. Live PostgreSQL + Redis available — run `docker-compose up -d` then `npx prisma migrate dev --name phase2a-init --schema=services/api/prisma/schema.prisma`
2. Phase 2B scope explicitly approved
3. Client confirmation of items 2, 3, 4 before any payout/settlement arithmetic is written

---

### 2026-09-10 — PHASE 2A REVIEW FIXES (Claude Opus Review Response)
**Status**: COMPLETED — 132/132 tests passing, lint clean, typecheck clean, all builds clean

**Context**: Claude Opus independently reviewed the Phase 2A foundation and identified 17 defects across 3 priority levels. All 17 were addressed in this session.

**Priority 1 — CRITICAL fixes**:
- **Fix 1**: All 6 `import type` occurrences for DI-injected classes converted to value imports. Added per-line `// eslint-disable-next-line @typescript-eslint/consistent-type-imports` to prevent ESLint from reverting.
- **Fix 2**: Created `services/api/prisma/migrations/20260910000000_phase2a_init/migration.sql` with complete DDL: all 13 tables + enums + indexes + FK constraints + all `DATABASE_V2.md` CHECK constraints (balance non-negative, ledger consistency, selection ranges, draw value range, settlement net consistency) + `prevent_row_modification()` trigger function + append-only triggers on `points_transactions` and `admin_logs`.

**Priority 2 — HIGH fixes**:
- **Fix 3**: Readiness returns HTTP 503 (not 200) when degraded. Both API and engine health controllers use `@Res()`.
- **Fix 4**: `GlobalExceptionFilter` reads `request.requestId` (set by interceptor) before raw header — prevents ID mismatch.
- **Fix 5**: `app.enableShutdownHooks()` added to both `main.ts` files — clean Prisma/Redis disconnect on SIGTERM.
- **Fix 6**: NestJS DI smoke tests added for both services via targeted `TestModule` (not full AppModule — avoids env validation in unit tests).
- **Fix 7**: Root `typecheck` script now covers services/api and services/game-engine.
- **Fix 8**: Exception filters preserve `err.message` + `err.stack` in logger calls.
- **Fix 9**: `services/api/src/common/bigint-serializer.ts` created — documented single BigInt serialization boundary with `safeJsonStringify()` and `bigIntReplacer()`.

**Priority 3 — MEDIUM fixes**:
- **Fix 10**: Removed `pino`, `pino-http`, `@types/pino` from both service `package.json` files.
- **Fix 11**: All `logger.error()` calls updated to NestJS signature `error(message, stack)`.
- **Fix 12**: Prisma logging config changed from broken event-emitter to string log levels (`['warn', 'error']`).
- **Fix 13**: `toCentipoints()` string path uses integer string-splitting — eliminates IEEE-754 path (`'10.57'` → `1057n`, not `1056n`).
- **Fix 14**: `JWT_SECRET` now requires `@MinLength(32)` — catches weak secrets at startup.
- **Fix 15**: Both Dockerfiles now have 3 stages (builder → prod-deps → runner) — production images exclude devDependencies.
- **Fix 16**: Both exception filters log `HttpException` with `statusCode >= 500` at error level.
- **Fix 17**: `ManualResultSource.fetchResult` comment corrected — was "returns null to satisfy the interface", actual behavior is throws.

**Tests added/updated**: 33 new tests — config MinLength tests (3), health 503 tests (7), exception filter fix #4/#16 tests (3), centipoints IEEE-754 precision tests (5), BigInt serializer tests (10), API DI smoke tests (8), engine DI smoke tests (5).

**Verification**: lint 0/0, typecheck clean (all packages + both services), test 132/132, `npm run build` clean, `npm run build:api` clean, engine build clean, `prisma validate` ✅, `prisma generate` ✅.

**Docker**: Not available in this environment. Migration deploy and endpoint verification pending.

---

### 2026-09-15 — PHASE 2B: Authentication & Users
**Status**: COMPLETE — runtime validation passed, pre-commit review clean

**Scope implemented** (strictly within approved Phase 2B boundaries):

**A. Database Migration**
- `services/api/prisma/migrations/20260914000000_phase2b_auth/migration.sql` — adds `sessions` table with XOR constraint (user_id XOR admin_id), `refresh_token_hash`, player `failed_login_count`/`locked_until`, index on `admin_users.status`

**B. Auth Service (`services/api/src/auth/`)**
- `auth.service.ts` — register (argon2id hash, atomic user + PointsAccount in transaction), login (argon2id verify, rate limit IP 5/15min + user 10/15min + register 3/hr, lockout 15min after **10** consecutive failures — `LOCKOUT_THRESHOLD = 10`), refresh (rotation + reuse detection that revokes all sessions on replay), logout / logout-all (session revocation in PostgreSQL), getMe (user + balance snapshot)
- `auth.controller.ts` — POST register/login/refresh/logout/logout-all, GET me; httpOnly refresh cookie with path scoping
- `dto/register.dto.ts`, `login.dto.ts`, `refresh.dto.ts` — class-validator DTOs with whitelist enforcement
- `guards/player-jwt.guard.ts`, `admin-jwt.guard.ts`, `user-status.guard.ts`, `admin-status.guard.ts`, `roles.guard.ts`
- `strategies/player-jwt.strategy.ts`, `admin-jwt.strategy.ts` — separate audiences (`jito-player` / `jito-admin`)
- `decorators/current-user.decorator.ts`, `roles.decorator.ts`
- `auth.service.spec.ts` — 23 unit tests; `auth.integration.spec.ts` — 7 real PostgreSQL tests (all 7 PASS)

**C. Users Service (`services/api/src/users/`)**
- `users.service.ts` — getProfile, updateProfile, changePassword (argon2id verify + re-hash)
- `users.controller.ts` — GET/PATCH /users/profile, PATCH /users/password; guarded by PlayerJwtGuard + UserStatusGuard
- `dto/update-profile.dto.ts`, `change-password.dto.ts`
- `users.service.spec.ts` — 3 unit tests

**D. Admin Auth Service (`services/api/src/admin/auth/`)**
- `admin-auth.service.ts` — adminLogin (same argon2id + rate limit pattern), adminRefresh, adminLogout, adminGetMe; shares token infrastructure with player auth
- `admin-auth.controller.ts` — POST login/refresh/logout, GET me; separate cookie path `/api/v1/admin/auth`

**E. Seed Update**
- `services/api/prisma/seed.ts` — real argon2id hashes computed at seed time (not placeholder strings). Admin: `admin` / `admin_dev_password`. Player: `testplayer` / `test_password_1`. PointsAccount at 100,000 centipoints (1,000.00 display points).

**F. Runtime Bug Fixes Found & Applied**
1. **DTO `import type` runtime metadata loss** — `RegisterDto`, `LoginDto`, `RefreshDto`, `ChangePasswordDto`, `UpdateProfileDto` were `import type` in controllers. NestJS `ValidationPipe` saw `Object` (no allowed properties) → rejected all valid fields. Fixed: converted to value imports with eslint-disable comments (same pattern as existing DI token fixes).
2. **`return res.status().json()` circular reference crash** — in `auth.controller.ts` and `admin-auth.controller.ts` refresh handlers, the "no token" branch did `return res.status(401).json(...)` with `passthrough: true`. NestJS then tried to serialize the Express `Response` object → Socket circular reference → crash + `ERR_HTTP_HEADERS_SENT`. Fixed: converted to `throw new UnauthorizedException(...)` — handled cleanly by `GlobalExceptionFilter`.
3. **`@jito/shared` ESM vs CJS mismatch** — `packages/shared/tsconfig.json` used `"module": "ESNext"` which emitted `export {}` syntax. Node v24's ESM resolver required explicit `.js` extensions on bare specifiers, failing `require()`. Changed to `"module": "CommonJS"` + `"moduleResolution": "node"` — all consumers (api, game-engine, web via webpack, admin via webpack) verified PASS. See ADR-026.
4. **NestJS DI runtime fixes (carried from Phase 2A review)** — `UserStatusGuard`, `AdminStatusGuard`, `RolesGuard`, `AuthController`, `UsersController`, `AdminAuthController`, `AdminAuthService` — all DI token imports converted from `import type` to value imports.

**G. Runtime Validation Results**
- Docker: PostgreSQL HEALTHY, Redis HEALTHY
- Migrations: 2/2 applied, 0 pending
- API bootstrap: port 3001, 0 DI errors, PostgreSQL + Redis connected
- Game Engine bootstrap: port 3003, 0 DI errors, PostgreSQL + Redis connected
- Health/Readiness: all 4 endpoints HTTP 200, database: up, redis: up
- Player auth flow: 41/41 runtime assertions PASS (register, field smuggling rejection, duplicate conflict, login, wrong password generic error, unknown username generic error, /me, /users/profile, refresh rotation, refresh reuse detection, logout, revoked-session rejection)
- Admin auth flow: login, /me, logout, revoked-session blocking — all PASS
- Player/Admin boundary: player token on admin route → 401 PASS; admin token on player route → 401 PASS
- Security: no passwordHash/refreshTokenHash in any response; requestId on all responses; generic auth errors; rate limiter (3 reg/hr, 5 login/15min per IP, 10 per user/15min); revoked sessions block valid JWTs
- Real PostgreSQL integration: 7/7 PASS (XOR constraint ×2, registration atomicity, concurrent registration uniqueness, sequential refresh rotation, sequential reuse detection, **real concurrent refresh via `AuthService.refresh()` ×2**)
  - Integration test 5 was **rewritten on 2026-09-15**: it previously replayed the expected write sequence with direct Prisma calls and never invoked `AuthService.refresh()`, so it could not fail. It now issues two genuinely concurrent `AuthService.refresh()` calls with the same token via `Promise.allSettled` and asserts ≤1 valid successor, that the original token is revoked, and that at most one request rotates.

**H. Verification Gates (all PASS)**
- `npm run lint` → 0 warnings/errors ✅
- `npm run typecheck` → clean ✅
- `npm run test` → 184 passed | 7 skipped (integration spec without INTEGRATION_DB_URL) ✅
- Integration tests (explicit): 7/7 PASS ✅
- `npm run build` → clean ✅
- `npm run build:api` → clean ✅
- `npm run build -w services/game-engine` → clean ✅
- `npm run build:web` → clean (10/10 static pages) ✅
- `npm run build:admin` → clean (12/12 static pages) ✅
- `git diff --check` → 0 whitespace errors ✅
- PDF untracked/unstaged ✅

---


- Reference screenshots exist only for: landing page, Triple Chance Timer (active + win state), Game History modal, Report modal. `assets/reference/lobby/`, `assets/reference/login/`, `assets/reference/client-reference/`, and `assets/reference/triple-chance-pro-timer/` are empty — the Lobby, Login/Register, and Triple Chance **Pro** Timer screens were built from written spec + inference, not a screenshot. Pro Timer currently renders as the standard Timer page with a "PRO VARIANT TABLE" badge — real Pro-specific rule/layout differences are `NEEDS CLIENT CONFIRMATION` (tracked in `docs/CLIENT_REQUIREMENTS.md` item 4).
- `.nvmrc` pins Node 20; this session's available Node runtime is v24. Builds/tests pass on v24, but CI/dev machines should still install Node 20 per `.nvmrc` for parity.
- `apps/mobile/capacitor.config.ts` has `cleartext: true`, `allowMixedContent: true`, and `webContentsDebuggingEnabled: true` — fine for Phase 1 dev, must be turned off before any real Android release build.

### 2026-09-15 — CLAUDE PHASE 2B TAKEOVER REVIEW (Review + Docs Only — No Source Changes)
**Status**: COMPLETED — verdict: **DO NOT COMMIT YET (1 blocker)**
- Took over the uncommitted `phase-2b/auth-users` working tree (branched from `008fbc7`, the merged PR #1). Reviewed the Antigravity Phase 2B implementation against source, not against prior claims.
- **Independently re-verified**: `npm run test` → 184 passed / 7 skipped, **exit 0** (the prior "exit code 1" note was wrong); real-PostgreSQL integration run with `INTEGRATION_DB_URL` → **7/7 PASS**; lint → clean; typecheck → clean; `git diff --check` → clean; Docker Postgres + Redis healthy.
- **Verified correct**: Phase 2A preflight items all held (strict:true on both service tsconfigs, real AppModule/EngineAppModule smoke tests, engine `safeJsonStringify`, BigInt contract, `Logger.error` signatures, ResultSource JSDoc). No production RNG, payout, settlement, betting, round-lifecycle, WebSocket, or payment code anywhere. C1–C4 architecture decisions untouched.
- **Verified ADR-026's factual claim** by repository search: `apps/web`, `apps/admin`, `apps/desktop` declare `@jito/shared` as a dependency but no app source imports it; the only real importer is `services/game-engine`. The ADR's "all current consumers require CJS" wording is evidence-based and accurate.
- **Disproved one of my own hypotheses**: the login dummy-hash timing defence *does* work — `argon2.verify` on `DUMMY_HASH` costs the same as a real verify (24 ms vs 22 ms measured), because argon2 uses the params embedded in the encoded hash. No timing oracle.
- **BLOCKER FOUND — concurrent refresh not serialized.** `AuthService.refresh()` issues `SELECT … FOR UPDATE` via standalone `prisma.$queryRaw`, outside any transaction, so the row lock is released at statement end. Proven against the live database: two concurrent refreshes with the same token both succeeded, leaving 2 valid sessions. Integration test 5 does not cover this — it never calls `AuthService.refresh()` and never runs concurrently. See PROJECT_CONTEXT.md KNOWN ISSUES 7.
- **Also found**: ADR-026 mis-cited in `schema.prisma`, the Phase 2B `migration.sql`, and `auth.service.ts` for the session XOR / reuse-detection decisions (ADR-026 is the `@jito/shared` CommonJS decision); the session-XOR decision has no ADR of its own. Rate-limit rejection returns HTTP 401 rather than the 429 specified in `docs/API_V2.md` §11, and the registration contact-requirement failure returns 401 rather than 400.
- **Documentation corrected this session** (no source files touched): `docs/API_V2.md` → PARTIALLY IMPLEMENTED with per-domain status; `docs/DATABASE_V2.md` → PARTIALLY IMPLEMENTED distinguishing created-vs-exercised tables; `docs/AUTH_V2.md` → §6 divergence warning + header caveat; MEMORY.md + PROJECT_CONTEXT.md → corrected lockout threshold (10, not 5), corrected the exit-code claim, and qualified the "concurrent refresh safety" claim.

### 2026-09-15 — PHASE 2B BLOCKER FIX (Concurrent Refresh) — Claude
**Status**: COMPLETED — blocker resolved, all validation re-run
- **Root cause**: `AuthService.refresh()` took its `SELECT … FOR UPDATE` via a standalone `prisma.$queryRaw`, outside any transaction. PostgreSQL committed that implicit single-statement transaction and released the row lock immediately, so it never covered the successor-insert / old-session-revoke writes. Proven: two concurrent refreshes with one token both succeeded → **2 valid sessions**.
- **Fix (ADR-027)**: the whole read-check-rotate critical section now runs in one `prisma.$transaction`. `createSession()` and `revokeAllSessions()` accept an optional `PrismaExecutor` (root client **or** `Prisma.TransactionClient`), defaulting to the root client — login paths untouched, no duplicated session logic, no `any`. Admin refresh delegates to the same primitive, so both identity domains are fixed together.
  - Non-obvious detail preserved in code and docs: the outcome is **returned** from the transaction and the 401 thrown **after** commit. Throwing inside would roll back the reuse-detection revocation.
  - Refresh now also re-reads the admin's real `role` inside the transaction; rotation previously downgraded the claim to the literal `'admin'`, which is not a valid `AdminRole`.
- **Integration test 5 rewritten** to call the real `AuthService.refresh()` twice concurrently via `Promise.allSettled` (was tautological — it replayed its own writes).
- **Also fixed**: rate-limit rejection now HTTP **429** with a `Retry-After` header (was 401) in both player and admin paths — the `catch` in `checkRateLimit` was also widened from `UnauthorizedException` to `HttpException` so the new 429 is not swallowed as a Redis failure; registration missing-contact now **400** (was 401), still INTERIM with no DB CHECK; `logout()` scopes the revoke by owner id as well as session id; dead `replacesSessionId` no-op branch removed; ADR citations corrected to ADR-027 in `schema.prisma` and `auth.service.ts`.
  - `migration.sql` deliberately **not** edited — it is applied and checksummed in `_prisma_migrations`; editing it would break Prisma migration validation. ADR-027 records the correction instead.
- **Validation after fix**: lint clean · typecheck clean · unit suite **184 passed / 7 skipped, exit 0** · real PostgreSQL integration **7/7** · builds: shared, api, game-engine, web (10/10), admin (12/12) all clean · API boots with PostgreSQL + Redis connected · **21/21 runtime regression** (health, register incl. 400 + field-smuggling rejection, login, me, profile, rotation, reuse 401, logout + live revocation, admin login/refresh/logout, both cross-audience boundaries) · live 429 + `Retry-After: 900` confirmed.
- **Independent probe**: 5/5 concurrent races against live PostgreSQL using the compiled production `AuthService` → valid sessions ≤ 1 every time (observed 0 — winner rotates, loser trips reuse detection which revokes the chain).

### 2026-09-22 — PHASE 2C: Points Ledger Foundation
**Status**: COMPLETED — implementation + concurrency/idempotency tests genuinely pass
- **Preflight**: verified the cookie-parser gap flagged in a prior review was already fixed in `main.ts`/`package.json` on `main` — no duplicate fix needed. Branch `phase-2c/points-ledger` created from current `main` (== `company/main`, 2 commits ahead of unpushed `origin/main` — no divergence).
- **No new migration required.** `points_accounts`, `points_transactions`, `admin_logs` and all their constraints (balance non-negative, amount positive, ledger self-consistency, `UNIQUE(idempotency_key)`, append-only triggers) already existed from the Phase 2A migration — confirmed by reading it before writing any code.
- **`PointsLedgerService`** (`services/api/src/points/points-ledger.service.ts`) — the one authoritative mutation primitive: idempotency pre-check outside any lock → `FOR UPDATE` account lock inside a transaction → validate inside the lock → insert ledger row → update projection. `mutateWithinTransaction(tx, params)` accepts an executor so callers (admin adjust today; future bet debit/settlement credit) can compose it into their OWN transaction without duplicating the lock/validate/insert logic. A P2002 race on the idempotency key is caught and resolved to the winner's row rather than erroring.
- **`PointsService`** — read-only `GET /points/balance` and `GET /points/transactions` (paginated, filterable by `referenceType` + date range per `docs/API_V2.md` §4), both scoped to the authenticated `userId` only.
- **`AdminPointsService`** / **`AdminPointsController`** — `POST /admin/users/:id/points/adjust`, `operator`+ role (existing `RolesGuard`/`@Roles()` infra, no new permission matrix invented). Writes `admin_logs` + the ledger mutation in ONE transaction by pre-generating the audit-log id and passing it as the ledger row's `referenceId` — one write each, no second UPDATE needed.
- **`PointsReconciliationService`** — verifies `docs/DATABASE_V2.md` §9 invariant 1 (`balance_minor = SUM(credits) - SUM(debits)`). A callable, tested method only — no cron/alerting wired (out of scope), never auto-repairs a mismatch.
- **Two genuine production bugs found and fixed by the real-PostgreSQL integration tests** (mocks could not have caught either):
  1. `uuid = text` — Postgres has no implicit cast; every raw-SQL `WHERE user_id = ${...}` / `WHERE account_id = ${...}` needed an explicit `::uuid` cast on the interpolated parameter.
  2. `SUM(bigint_column)` returns PostgreSQL `NUMERIC`, not `BIGINT` — Prisma mapped it to a `Decimal` object, not a JS `bigint`, so `decimal === 0n` silently evaluated `false` even when both printed as `"0"`. Fixed with an explicit `::bigint` cast on the `COALESCE(SUM(...), 0)` result in `reconciliation.service.ts`. Caught because the concurrency test asserted `reconciliation.verifyAccount(...).matches === true` after a real run, not because anything threw.
- **Tests added**: `points-ledger.service.spec.ts` (8), `points.service.spec.ts` (5), `admin-points.service.spec.ts` (7), `reconciliation.service.spec.ts` (4) — all mocked-Prisma unit tests — plus `points.integration.spec.ts` (8 tests against real PostgreSQL: N-parallel-debit overdraw/lost-update, sequential + concurrent idempotent replay, two-different-keys independence, failed-mutation atomicity for both the player and admin paths, cross-user scoping, and the BIGINT round-trip). Also `cookie-refresh.integration.spec.ts` (3) proving the pre-existing cookie-parser fix, written against a plain Express server rather than `Test.createTestingModule` — see that file's header for why (Vitest/esbuild does not emit `design:paramtypes`; a pre-existing test-infrastructure gap, out of scope to fix here, does not affect production since real builds use `tsc`).
- **Validation**: lint clean · typecheck clean · unit suite **211 passed / 15 skipped, exit 0** · real PostgreSQL integration **7/7 (auth) + 8/8 (points)** · builds: shared, api, game-engine, web (10/10), admin (12/12) all clean · API boots with PostgreSQL + Redis connected, all points/admin routes mapped · **20/20 live runtime checks** (balance starts at 0, admin credit, idempotent replay returns `replayed:true`, missing Idempotency-Key → 400, missing reason → 400, player token blocked from admin route → 401, balance reflects credit, second independent credit, overdraft debit → 422 `INSUFFICIENT_POINTS`, balance unaffected by the failed debit, history total correct, unknown user → 404).
- **Deliberately not implemented**: bet placement, round lifecycle, WebSocket gateway, RNG, win-determination, payout multipliers, commission — nothing outside the approved Phase 2C scope was touched.

### 2026-09-22 — PHASE 2C HARDENING PASS (pre-merge review fixes)
**Status**: COMPLETED — four review findings fixed and tested, merged as part of Phase 2C
- Closed a cross-user idempotency-replay gap in `PointsLedgerService.assertReplayMatches` (now verifies the existing ledger row's owning account matches the caller's `userId`, not just direction/amount/referenceType/referenceId) and a parallel gap in `AdminPointsService.findReplay` (now also verifies referenceType, reason, and the admin actor via the linked `admin_logs` row).
- Refactored `main.ts`'s bootstrap into a shared `bootstrap.ts` `configureApp()` so `cookie-refresh.integration.spec.ts` exercises the SAME production registration function rather than a hand-rolled copy — the test now genuinely fails if cookie-parser is ever removed from production bootstrap.
- Added `@Max(Number.MAX_SAFE_INTEGER)` to `AdjustPointsDto.amountMinor` (JSON-number transport safety boundary, no contract change).
- Added real-PostgreSQL tests for cross-user and cross-admin idempotency-key reuse (both correctly rejected 409, zero balance/audit mutation). Full detail in the conversation history preceding this entry (`DECISIONS.md` was not amended — no new architectural decision, only correctness fixes within ADR-028's existing design).

### 2026-09-23 — PHASE 2D: Round Lifecycle Foundation (Step 6)
**Status**: COMPLETED — round lifecycle advances through betting states on the DB clock, real-PostgreSQL concurrency/recovery proof, all validation PASS
- **Scope, precisely**: only `ROUND_CREATED → BETTING_OPEN → BETTING_LOCKED`, driven by a reconciling scheduler tick (docs/GAME_ENGINE_V2.md §5). `BETTING_OPEN → BETTING_ACTIVE` (needs a bet — Step 7), `BETTING_LOCKED → RESULT_PENDING` and everything past it (Step 9/10, gated on client items 2/3/4), and any WebSocket/betting/settlement code are all deliberately untouched — matches `docs/PHASE_2_IMPLEMENTATION_PLAN.md` Step 6's own exit criteria exactly, not the full canonical lifecycle.
- **No new migration.** `game_rounds`, the `RoundState` enum, `uq_rounds_one_live_per_game`, and `(game_id, round_number)` all already existed from the Phase 2A migration.
- **`RoundsService`** (`services/game-engine/src/rounds/rounds.service.ts`) — the state machine. Every transition is a conditional guarded `UPDATE … WHERE id=$id AND state=$expected`; locking additionally gates on PostgreSQL's own `now()` via one small raw-SQL statement (`betting_deadline <= now()`), never an application-host clock (ADR-019) — this is the only raw SQL in the module; every other transition uses Prisma's typed `updateMany`. `reconcile(gameId)` advances at most one transition per call, so "engine restart mid-round" needs no special-cased recovery code — the next call to `reconcile()` against whatever is durably persisted **is** the recovery path.
- **`RoundSchedulerService`** — the tick, using `@nestjs/schedule`'s `SchedulerRegistry` (a dependency installed since Phase 2A specifically for this). Reuses Phase 2A's already-built `EngineRedisService` leader lock (`acquireLeaderLock`/`renewLeaderLock`) unchanged — no new Redis logic was written. A reentrancy guard (`tickInFlight`) stops a slow tick from overlapping itself; each game's reconcile failure is caught independently so one game never blocks another's tick.
- **Round creation concurrency** (no duplicate live round) is enforced by the existing partial unique index and round-number unique constraint — `tryCreateRound` catches P2002 and treats it as "another writer already won," not an error.
- **Display code**: `docs/DATABASE_V2.md` gives no derivable format for `display_code` (examples like "736TC658" have undocumented encoding) — used a simple, deterministic, provably collision-free placeholder (`{TC|TCP}{roundNumber}`) instead of guessing the reference format. Flagged as `NEEDS CLIENT CONFIRMATION` in the code comment.
- **Timing**: new `ROUND_BETTING_WINDOW_MS` engine env var (T_bet only). Explicitly unconfirmed, short dev/test default (30s), applied identically to both games — no Timer vs Pro Timer difference invented (`docs/CLIENT_REQUIREMENTS.md` items 1 and 4 still open).
- **`GamesModule`** (`services/api/src/games/`) — `GET /games/:gameId/current-round`, the one read endpoint Step 6 needs. Read-only against a table only the engine ever writes; returns round identity/state/deadlines/stateVersion + serverTime + always-null `drawValue`. `myBets`/`balanceMinor` are deliberately omitted (Step 7/already-live-but-out-of-scope-here), not stubbed.
- **Bug found while wiring the module graph, fixed before it could reach production**: `RoundSchedulerService.onModuleDestroy()` unconditionally called `schedulerRegistry.deleteInterval(...)`, which crashes if `onModuleInit()` never ran (surfaced by the existing `app.smoke.spec.ts`, which calls `moduleRef.close()` — invoking destroy hooks — without ever calling `.init()`). Fixed with a `tickRegistered` flag so destroy only tears down a registration that actually happened — good defensive practice independent of the test environment, not a test-only patch.
- **Tests added**: `rounds.service.spec.ts` (14, mocked Prisma), `round-scheduler.service.spec.ts` (9, mocked leader lock/reconcile — calls `tick()` directly rather than waiting on the real interval), `games.service.spec.ts` (4, mocked Prisma) — plus `rounds.integration.spec.ts` (10 tests against real PostgreSQL: valid transitions end-to-end, invalid-transition rejection, duplicate-transition idempotency, 10-way concurrent lock race — exactly 1 succeeds, 10-way concurrent creation race — exactly 1 round created, monotonic `state_version`, crash-recovery from a persisted `ROUND_CREATED` row, stale-transition rejection against an already-progressed round, deadline gating on the DB clock, and zero `points_transactions` rows written by a full lifecycle cycle).
- **Validation**: lint clean · typecheck clean · unit suite **242 passed / 27 skipped, exit 0** · real PostgreSQL integration **7/7 (auth) + 10/10 (points) + 10/10 (rounds), all three run together** · `npm run build` / `build:api` / `build -w services/game-engine` all clean.
- **Not verified in this specific sub-session**: a live process boot of either service (`node dist/main.js`) — blocked by a pre-existing, unrelated `@jito/types` packaging gap. Fixed and fully verified in the very next session the same day — see "PHASE 2D RUNTIME HARDENING PASS" below and Technical Debt (now resolved).
- **Deliberately not implemented**: bet placement, `BETTING_ACTIVE`, result ingestion, settlement, RNG, payout multipliers, commission, WebSocket gateway — nothing outside Step 6 was touched.

### 2026-09-23 — PHASE 2D RUNTIME HARDENING PASS
**Status**: COMPLETED — `@jito/types` runtime blocker fixed, both services verified live via their real compiled start command, one real API-contract deviation found and fixed
- **`@jito/types` carry-over fix.** Applied the exact ADR-026 pattern: `packages/types/tsconfig.json` `module: "ESNext"` → `"CommonJS"`, `moduleResolution: "bundler"` → `"node"` (identical to `packages/shared`'s already-approved fix — same root cause, same package shape, same consumer set: `services/api` and `services/game-engine` load it via Node `require()`). Compiled output confirmed to now emit `require("./user")` etc. instead of bare-specifier ESM. `packages/config` was checked and confirmed NOT a dependency of either service — correctly left untouched (out of scope, no unrelated restructuring).
- **Live production-style boot — both services, via their real compiled entry point (`node dist/main.js`), not `nest start --watch`:** API and Game Engine both start cleanly, PostgreSQL and Redis both connect, health/readiness both report `database: up, redis: up`, all routes map including `GamesController`. `RoundsModule`/`RoundSchedulerService` initialize with zero DI/module errors; the round scheduler tick registers and immediately begins creating/opening/locking rounds for both games against the real DB clock.
- **Live round-lifecycle smoke test against the real running process** (not just integration tests): created a round, force-killed the OS process mid-lifecycle (`BETTING_OPEN`, `stateVersion=1`, genuinely persisted, deadline still ~9.5s in the future), started a fresh process, and confirmed it inherited the *exact same* round (identical UUID) and correctly locked it (`BETTING_LOCKED`, `stateVersion=2`) with zero duplicate rounds created — real OS-process crash-recovery and single-writer-no-duplication proof, not simulated.
- **Graceful shutdown**: confirmed at the code level (the smoke-test fix earlier this session is direct proof Nest's real shutdown-hook mechanism invokes `RoundSchedulerService.onModuleDestroy()`; `EnginePrismaService`/`EngineRedisService`'s disconnect hooks are unchanged Phase 2A code, exercised in every test run's logs). Could NOT be proven via an external OS signal in this session: Windows terminates Node processes unconditionally on `SIGTERM` (no handler runs), and `SIGINT`/Ctrl+C requires genuine console attachment a backgrounded process spawned this way doesn't have — confirmed directly (`taskkill /PID` without `/F` returned "this process can only be terminated forcefully"). A platform/test-harness limitation, not a code defect.
- **Current-round contract re-verified against docs, two real deviations found and fixed:**
  1. `drawValue: null` — re-confirmed genuinely documented (`docs/API_V2.md` §5's own example shows it verbatim). Kept, unchanged.
  2. `lockedAt` — **removed.** Cross-checked `docs/WEBSOCKET_V2.md`'s `GameStateSnapshotPayload.round` (the schema `docs/API_V2.md` §5 says this REST endpoint mirrors): it does not include `lockedAt` as a round-state field — `lockedAt` only exists there as a separate, discrete WebSocket event (`BettingLockedPayload`). It was an invented field; removed from `GamesService`.
  3. `roundNumber`/`stateVersion` — **changed from string to number.** `GameStateSnapshotPayload.round` documents both as `number`, and ADR-023's entire ordering mechanism depends on `stateVersion` being numerically comparable (`payload.stateVersion > lastAppliedVersion`) — a string would silently break that comparison (`"10" > "9"` is false lexicographically). Unlike points centipoints (genuine BIGINT financial-precision risk), a round number or per-round transition counter can never realistically approach `Number.MAX_SAFE_INTEGER`, so a direct `Number(bigint)` conversion is safe with no precision caveat, unlike the deliberate string-BigInt convention used for money in Phase 2C.
- **Display code**: unchanged — still the placeholder `{TC|TCP}{roundNumber}` scheme, still explicitly flagged `NEEDS CLIENT CONFIRMATION`, not represented as final.
- **Tests updated**: `games.service.spec.ts` — removed the `lockedAt`-serialization test, added a test asserting `lockedAt` is absent from the response, added a test asserting `roundNumber`/`stateVersion` are typed `number`.
- **Validation after the fix**: lint clean · typecheck clean · unit suite **243 passed / 27 skipped, exit 0** · real PostgreSQL integration **7/7 (auth) + 10/10 (points) + 10/10 (rounds)** · `build` / `build:api` / `build -w services/game-engine` all clean · `build:web` (10/10 pages) / `build:admin` (12/12 pages) sanity-checked clean (both declare `@jito/types` as a dependency; unaffected by the CJS fix, confirmed rather than assumed).

### 2026-09-23 — PHASE 2D FINAL PRE-COMMIT REVIEW (read-only review, one HIGH bug found and fixed)
**Status**: COMPLETED — one genuine HIGH-severity bug found via code review and fixed; everything else reviewed and confirmed correct
- **Bug found**: `RoundSchedulerService.ensureLeader()` had no error handling around `EngineRedisService.acquireLeaderLock`/`renewLeaderLock`, both of which propagate ioredis errors uncaught (by design, for other callers). `ensureLeader()` is called from `tick()`, which is invoked as `void this.tick()` inside a bare `setInterval` callback with no `.catch()` — a transient Redis error (network blip, failover) would become an **unhandled promise rejection and crash the entire game-engine process**, directly contradicting `docs/GAME_ENGINE_V2.md` §9's documented requirement ("Redis unavailable → state transitions continue").
- **Fix**: wrapped `ensureLeader()`'s body in try/catch, treating a thrown Redis error as "not leader this tick" (returns `false`, logs, skips reconciling) rather than crashing or assuming leadership without confirmation. `isLeader` is deliberately left untouched on a thrown error (as opposed to a clean `renewed === false` response, which does clear it) — an ambiguous network blip shouldn't force a redundant re-acquire once Redis recovers.
- **Tests added**: two new cases in `round-scheduler.service.spec.ts` — a Redis error during acquisition resolves `tick()` cleanly without reconciling; a Redis error during renewal also resolves cleanly, and `isLeader` is proven not to have been reset (the next successful renewal doesn't re-acquire).
- **Everything else reviewed and confirmed correct, no further changes**: round transition correctness (no unintended transitions beyond Step 6), concurrency safety (duplicate ticks, concurrent creates, stale transitions, partial unique index), leader-lock TTL-expiry behavior (correctly handled via the Lua script's conditional check, independent of the bug above), PostgreSQL authority (DB always wins, restart recovery is memory-independent, DB clock used for all deadline comparisons), monotonic `stateVersion` (increments exactly once per transition, atomically with `state`, no stale write can decrease/overwrite it), the `current-round` API contract (no undocumented fields after the prior pass's fixes), `display_code` (clearly flagged as an unconfirmed placeholder, not presented as final), and the `@jito/types` fix (byte-identical to ADR-026's `packages/shared` change).
- **Validation after the fix**: lint clean · typecheck clean · unit suite **245 passed / 27 skipped, exit 0** · real PostgreSQL integration **7/7 (auth) + 10/10 (points) + 10/10 (rounds)** · `build -w services/game-engine` clean.

---

## Technical Debt

- ~~Root `tsconfig.json` project references only cover `packages/*`~~ — **FIXED (Phase 2A review Fix #7)**: root `typecheck` script now runs `npm run typecheck -w services/api && npm run typecheck -w services/game-engine` after `tsc --build`.
- `pino` and `pino-http` packages removed from `package.json` but are still installed in `node_modules` (removing requires `npm install` after the change — safe to defer to next `npm ci`).
- `apps/desktop` and `apps/web` TypeScript is checked via their own build pipelines, not the root `tsc --build`. Acceptable for Phase 2A.
- ~~`packages/types/tsconfig.json` used `module: "ESNext"`, breaking `node dist/main.js`~~ — **FIXED 2026-09-23 (Phase 2D runtime hardening pass)**: applied ADR-026's exact CJS fix to `packages/types/tsconfig.json`. Both services now verified to boot live via their real compiled start command.

---

## Confirmed vs Pending Client Questions

See `docs/CLIENT_REQUIREMENTS.md` for full breakdown.
- Confirmed: Strictly Points Platform (NO payment gateways, UPI, cards, deposits, withdrawals).
- Confirmed: Number spaces: Singles (0-9), Doubles (00-99), Triples (000-999).
- Confirmed: 3 Concentric Rings on Wheel (Triples, Doubles, Singles).
- Pending Client Confirmation: Exact round countdown seconds (defaults to 90s), exact payout multipliers.
