# JITO INDIA GAMES — Project Context (Cross-Agent Handoff)

> This file is the authoritative cross-agent handoff memory for Claude Code, Antigravity, and any future agent. Read this before touching code. Also read `MEMORY.md` (session log), `DECISIONS.md` (ADRs, append-only), and `docs/CLIENT_REQUIREMENTS.md` (pending client questions).

---
## CURRENT PHASE

**Phase 2A — Backend Foundation — COMPLETE**

## STATUS

**PHASE 2A COMPLETE. PHASE 2B AWAITING APPROVAL.**

Phase 2A (backend foundation) is complete as of 2026-09-09. All verification passes: 99/99 tests, lint 0/0, typecheck clean, build clean, `build:api` clean. Prisma schema (13 tables) is defined but **not yet migrated** — the first migration requires a live PostgreSQL instance (`docker-compose up -d` then `prisma migrate dev`).

Phase 2B must not start until:
1. Live PostgreSQL + Redis setup confirmed working (`docker-compose up -d` + first migration)
2. Phase 2B scope explicitly approved by a human
3. Client confirmation of items 2, 3, 4 (payout multipliers, win-determination rule, commission formula) — required before any settlement arithmetic is written

---

## COMPLETED

### Phase 0 + Phase 1 (from prior sessions — unchanged)
- Monorepo scaffold: npm workspaces across `packages/*`, `apps/*`, `services/*`. Baseline committed as `a964856`.
- Shared packages: `@jito/types`, `@jito/config`, `@jito/shared`, `@jito/ui` (design system), `@jito/game-core` (Phaser 3 wheel, zero RNG).
- `apps/web` (Next.js 14): landing, login, register, download, lobby, `/games/triple-chance` (full 1:1 reference recreation), `/games/triple-chance-pro`.
- `apps/admin` (Next.js 14): Dashboard, Users & Points, Points Ledger, Game Rounds, Game History, Reports, Announcements, Downloads, Audit Logs. Points-only.
- `apps/desktop` (Electron): frameless, secure context isolation.
- `apps/mobile` (Capacitor): Android shell.
- 24 Phase 1 tests + lint + builds passing.

### Phase 2 Architecture (design only, prior session — approved)
- 7 design docs produced; ADR-014–025 appended; all 4 CRITICAL + 4 HIGH review issues resolved.
- See `docs/PHASE_2_ARCHITECTURE_REVIEW.md` and `docs/PHASE_2_IMPLEMENTATION_PLAN.md`.

### Phase 2A — Backend Foundation (this session — COMPLETE)
- **Shared types** updated to V2 spec (ADR-014/015/023): `packages/types/src/{game,wallet,websocket,index}.ts`
- **Centipoints helpers**: `packages/shared/src/centipoints.ts` + 33 tests — `toCentipoints` truncates (never rounds up), `fromCentipoints`, `addCentipoints`, `subtractCentipoints`
- **NestJS API service** (`services/api`): config validation, Prisma, Redis, GlobalExceptionFilter, RequestIdInterceptor, health endpoints, module stubs for all 8 feature areas
- **Prisma schema**: 13-table normalized schema at `services/api/prisma/schema.prisma` — all integrity constraints (UNIQUE idempotency keys, append-only ledger documented, one-live-round partial index documented, ROUND_COMPLETED history projection per ADR-024)
- **Prisma dev seed**: `services/api/prisma/seed.ts` — idempotent (upsert), 1 admin + 1 test player + 1000pt account
- **NestJS game engine service** (`services/game-engine`): config validation, Prisma, Redis with leader lock (SET NX PX + Lua renew/release), health endpoints, `ResultSource` and `SettlementRules` interfaces (zero implementations per ADR-018)
- **Docker local dev**: `docker-compose.yml` (PostgreSQL 16 + Redis 7), `docker/postgres/init.sql`, `.dockerignore`, `services/api/Dockerfile`, `services/game-engine/Dockerfile` (both multi-stage, non-root)
- **`.env.example`**: updated to Phase 2 format — DATABASE_URL, REDIS_URL, JWT audience split, engine vars
- **Foundation tests**: 75 new Phase 2A tests — config validation, Prisma lifecycle, Redis lifecycle + key helpers, health controllers, exception filter
- **vitest.config.ts**: extended to include `.spec.ts` files, `reflect-metadata` setup, proper `**/node_modules/**` exclusion

---

## IN PROGRESS

Nothing is mid-implementation. Phase 2A is fully complete. The only open item requiring action before Phase 2B is the first Prisma migration with a live database.

---

## BLOCKED

Phase 2B is gated on:
1. Live PostgreSQL + Redis (`docker-compose up -d`)
2. First migration: `cd services/api && npx prisma migrate dev --name phase2a-init`
3. Human approval of Phase 2B scope
4. Client confirmation of items 2, 3, 4 (payout multipliers, win-determination rule, commission/rake structure) — these gate settlement arithmetic only; round lifecycle, auth, and points flows are unblocked

---

## KNOWN ISSUES

1. **Prisma schema not yet migrated.** Defined but no migration run. First migration requires Docker to be installed and running.
2. **Reference screenshots incomplete.** `assets/reference/lobby/`, `login/`, `client-reference/`, `triple-chance-pro-timer/` are empty — those screens were built from spec inference only.
3. `.nvmrc` pins Node 20; dev machine runs Node 24. Passes on v24.
4. `apps/mobile/capacitor.config.ts` debug flags (`cleartext: true`, etc.) must be disabled before any real Android release.
5. **`npm run build:game-engine` not yet in root package.json** — game engine uses `nest build` via its own workspace. Can add in Phase 2B when engine is more complete.
6. Audit vulnerabilities: 35 total (4 low, 16 moderate, 12 high, 3 critical) — inherited from Phase 1 deps (Electron). Run `npm audit fix` separately; do not use `--force` without review.

---

## NEXT TASK

In order:

1. **Start Docker** and run the first Prisma migration:
   ```bash
   docker-compose up -d
   cd services/api
   npx prisma migrate dev --name phase2a-init
   npx prisma db seed
   ```
2. **Verify services start** against live infra:
   ```bash
   npm run dev:api
   npm run dev:game-engine
   # Check: http://localhost:3001/api/v1/health/ready → { status: "ok" }
   # Check: http://localhost:3003/api/v1/health/ready → { status: "ok" }
   ```
3. **Get client confirmation of items 2, 3, 4** before Phase 2B settlement work begins.
4. **On human approval, begin Phase 2B** at step 7 (auth module — argon2id), step 8 (JWT issuer/validator), step 9 (round lifecycle + bet placement envelope), step 10 (settlement envelope — no arithmetic until items 2–4 confirmed).

**Do not start Phase 2B without explicit human approval.** When it starts: no RNG, no payout arithmetic, no commission calculation until client items 2–4 are confirmed and recorded in a new ADR.

---

## REPORTING NOTE

**PHASE 2A COMPLETE AND VERIFIED.** 99/99 tests, 0 lint warnings, clean typecheck, clean builds. Ready for Phase 2B scoping and approval.
