# JITO INDIA GAMES — Project Memory

> Running log of project state. Updated after every meaningful development session.

---

## Current State

| Aspect | Status |
|--------|--------|
| Phase | PHASE 2A — Backend Foundation — **REVIEW FIXES COMPLETE** (2026-09-10) |
| Repository | Fully initialized & validated |
| Documentation | 8 root context files + 18 docs files (Phase 1) + Phase 2 architecture docs |
| Monorepo | npm workspaces (`packages/*`, `apps/*`, `services/*`) |
| Shared Packages | `@jito/types` (V2), `@jito/config`, `@jito/shared` (centipoints helpers), `@jito/ui`, `@jito/game-core` |
| Applications | `apps/web` (Next.js), `apps/admin` (Next.js), `apps/desktop` (Electron), `apps/mobile` (Capacitor) |
| Services | `services/api` (NestJS), `services/game-engine` (NestJS — single writer) |
| Prisma Schema | 13 tables in `services/api/prisma/schema.prisma` — **migration created** in `services/api/prisma/migrations/20260910000000_phase2a_init/` — requires live PostgreSQL to deploy |
| Tests | **132 tests passing across 14 test files** (33 new Phase 2A review regression tests + 99 prior) |
| Build & Lint | `npm run lint` → 0 warnings/errors, `npm run typecheck` → clean (covers packages + services/api + services/game-engine), `npm run build` → clean, `npm run build:api` → clean, `npm run build -w services/game-engine` → clean |
| Docker | Not available in this dev environment — runtime verification pending |
| Phase 2B | **NOT STARTED** — gated on: (1) Docker available for `prisma migrate deploy`; (2) Phase 2B scope approval; (3) client confirmation of items 2–4 |
| Next Recommended Phase | **Phase 2A final review** by Claude, then **Phase 2B** implementation |

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

### 2026-09-13 — Main Splash / Starting Screen Recreation
**Status**: COMPLETED — 143/143 tests passing, lint clean, typecheck clean, web build clean

- Replicated original desktop starting screen (`assets/reference/starting-screen/image.png`):
  - Used exact original background asset: `apps/web/public/splash-screen/bg.png`.
  - Used official transparent marquee logo: `apps/web/public/jito-india-logo.png`.
  - Recreated the exact red dotted chaser spinner (8-dot tapering comet tail with varying radiuses and opacities rotating clockwise).
  - Built `/splash` route in `apps/web/src/app/splash/page.tsx` with centered logo, dark rounded update card, exact `"Downloading Update : X %"` ticker (0% -> 100%), and automatic navigation to `/login`.
  - Configured `apps/desktop/src/main.ts` and added `npm run dev:desktop` to launch Electron directly into `/splash` -> `/login` flow.
- Replicated original desktop login screen (`assets/reference/login-page/image.png`):
  - Used exact background asset: `apps/web/public/login/bg.png`.
  - Cropped clean sprite assets from user image: `member-login-card.png`, `registration-card.png`, `input-field-wide.png`, `lock-icon.png`, `user-icon.png` in `apps/web/public/login/`.
  - Built 1:1 Login Screen in `apps/web/src/app/login/page.tsx` with member login card, secure lock icon, accurately positioned beveled inputs, interactive red button with default and hover button textures (`btn-login-default.png` / `btn-login-hover.png`), authentic `18-plus-banner.png`, and custom `checkbox-box.png` / `checkbox-tick.png` checkmark component.
  - Updated Login Form (2026-09-13):
    - Shortened Username and Password input fields to 225px (`w-[225px] h-[31px]`, centered at `left-[76px]`) to match reference snippet `media_1789282619971.png`.
    - Updated LOGIN button to use user-provided glossy button assets with baked-in text: `btn-login-with-text-default.png` and `btn-login-with-text-hover.png`, removing duplicate DOM text overlay.
    - Increased "Remember Me" label font size to `text-sm sm:text-[15px]` with centered alignment and crisp text drop shadow.
  - Integrated `rules-card-with-crest-base.png` with official `jito-india-logo.png` covering the top silhouette area.
  - Replaced Free to Play badge with the authentic `free-to-play-emblem.png`.
  - Scaled up the whole login UI by 1.18x with fixed scale across all screen resolutions.
  - Removed overlapping signup button overlay.
  - Included 18+ Strictly for Amusement Only disclaimer badge and Electron window controls.
- Verification:
  - `npm run test` -> 143 tests passing across 15 test files.
  - `npm run lint` -> 0 warnings, 0 errors.
  - `npm run typecheck` -> clean.
  - `npm run build:web` -> clean production build with `/splash` and `/login` statically generated.
  - `npm run build -w apps/desktop` -> clean compilation.

---

## Known Issues

- Reference screenshots exist only for: landing page, Triple Chance Timer (active + win state), Game History modal, Report modal. `assets/reference/lobby/`, `assets/reference/login/`, `assets/reference/client-reference/`, and `assets/reference/triple-chance-pro-timer/` are empty — the Lobby, Login/Register, and Triple Chance **Pro** Timer screens were built from written spec + inference, not a screenshot. Pro Timer currently renders as the standard Timer page with a "PRO VARIANT TABLE" badge — real Pro-specific rule/layout differences are `NEEDS CLIENT CONFIRMATION` (tracked in `docs/CLIENT_REQUIREMENTS.md` item 4).
- `.nvmrc` pins Node 20; this session's available Node runtime is v24. Builds/tests pass on v24, but CI/dev machines should still install Node 20 per `.nvmrc` for parity.
- `apps/mobile/capacitor.config.ts` has `cleartext: true`, `allowMixedContent: true`, and `webContentsDebuggingEnabled: true` — fine for Phase 1 dev, must be turned off before any real Android release build.

---

## Technical Debt

- ~~Root `tsconfig.json` project references only cover `packages/*`~~ — **FIXED (Phase 2A review Fix #7)**: root `typecheck` script now runs `npm run typecheck -w services/api && npm run typecheck -w services/game-engine` after `tsc --build`.
- `pino` and `pino-http` packages removed from `package.json` but are still installed in `node_modules` (removing requires `npm install` after the change — safe to defer to next `npm ci`).
- `apps/desktop` and `apps/web` TypeScript is checked via their own build pipelines, not the root `tsc --build`. Acceptable for Phase 2A.

---

## Confirmed vs Pending Client Questions

See `docs/CLIENT_REQUIREMENTS.md` for full breakdown.
- Confirmed: Strictly Points Platform (NO payment gateways, UPI, cards, deposits, withdrawals).
- Confirmed: Number spaces: Singles (0-9), Doubles (00-99), Triples (000-999).
- Confirmed: 3 Concentric Rings on Wheel (Triples, Doubles, Singles).
- Pending Client Confirmation: Exact round countdown seconds (defaults to 90s), exact payout multipliers.
