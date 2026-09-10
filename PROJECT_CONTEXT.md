# JITO INDIA GAMES — Project Context (Cross-Agent Handoff)

> This file is the authoritative cross-agent handoff memory for Claude Code, Antigravity, and any future agent. Read this before touching code. Also read `MEMORY.md` (session log), `DECISIONS.md` (ADRs, append-only), and `docs/CLIENT_REQUIREMENTS.md` (pending client questions).

---
## CURRENT PHASE

**Phase 2A — Backend Foundation — REVIEW FIXES COMPLETE**

## STATUS

**PHASE 2A REVIEW FIXES COMPLETE. READY FOR FINAL CLAUDE RE-REVIEW.**

Phase 2A (backend foundation) is complete as of 2026-09-09, with all 17 Phase 2A review fixes applied on 2026-09-10. All verification passes: **132/132 tests**, lint 0/0, typecheck clean (packages + services/api + services/game-engine), all builds clean. Prisma migration created at `services/api/prisma/migrations/20260910000000_phase2a_init/` — requires a live PostgreSQL instance to deploy (`docker compose up -d` then `prisma migrate deploy`).

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

### Phase 2A — Backend Foundation PLUS Review Fixes (COMPLETE as of 2026-09-10)
- Everything from the original Phase 2A session (shared types V2, centipoints, NestJS API service, game engine, docker, env config, 75 foundation tests)
- **Prisma migration created**: `services/api/prisma/migrations/20260910000000_phase2a_init/migration.sql` — full DDL + all CHECK constraints + partial unique index (one-live-round) + append-only triggers
- **17 Phase 2A review fixes applied** (see MEMORY.md session log 2026-09-10 for full details):
  - Fix 1: All 6 DI `import type` → value imports (ESLint suppression prevents revert)
  - Fix 2: Prisma migration with all DATABASE_V2.md constraints and triggers
  - Fix 3: Readiness HTTP 503 when degraded (both services)
  - Fix 4: Request-ID correlation via `request.requestId` before raw header
  - Fix 5: `app.enableShutdownHooks()` both services
  - Fix 6: NestJS DI smoke tests both services (targeted TestModule, not full AppModule)
  - Fix 7: Root typecheck covers services/api + services/game-engine
  - Fix 8: Exception logging preserves message + stack
  - Fix 9: `services/api/src/common/bigint-serializer.ts` — documented single serialization boundary
  - Fix 10: Removed pino/pino-http/[@types/pino] from both services
  - Fix 11: NestJS Logger.error(message, stack) — correct signature everywhere
  - Fix 12: Prisma logging uses string levels (not broken event-emitter)
  - Fix 13: centipoints string parsing via integer split — IEEE-754-safe
  - Fix 14: JWT_SECRET MinLength(32) — catches weak secrets at startup
  - Fix 15: Dockerfiles 3-stage (prod-deps stage) — devDeps excluded from runner
  - Fix 16: 5xx HttpExceptions logged at error level
  - Fix 17: ManualResultSource comment aligned with actual throw behavior
- **33 new regression tests** added across config, health, exception filter, centipoints, bigint-serializer, and smoke test files

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

1. **Prisma migration created but not yet deployed.** Migration SQL exists at `services/api/prisma/migrations/20260910000000_phase2a_init/`. Deploy requires Docker (`prisma migrate deploy`).
2. **Reference screenshots incomplete.** `assets/reference/lobby/`, `login/`, `client-reference/`, `triple-chance-pro-timer/` are empty — those screens were built from spec inference only.
3. `.nvmrc` pins Node 20; dev machine runs Node 24. Passes on v24.
4. `apps/mobile/capacitor.config.ts` debug flags (`cleartext: true`, etc.) must be disabled before any real Android release.
5. **`npm run build:game-engine` not yet in root package.json** — use `npm run build -w services/game-engine` directly.
6. Audit vulnerabilities: 35 total (4 low, 16 moderate, 12 high, 3 critical) — inherited from Phase 1 deps (Electron). Run `npm audit fix` separately.
7. **Docker not available in this dev environment** — migration deploy, API/engine startup, and `/health/ready` endpoint verification are pending.

---

## NEXT TASK

In order:

1. **Deploy Docker + run migration**:
   ```bash
   docker compose up -d
   cd services/api
   npx prisma migrate deploy
   npx prisma db seed
   ```
2. **Verify services start** against live infra:
   ```bash
   npm run dev:api
   npm run dev:game-engine
   # Check: http://localhost:3001/api/v1/health → { status: "ok" }
   # Check: http://localhost:3001/api/v1/health/ready → { status: "ok" }
   # Check: http://localhost:3003/api/v1/health → { status: "ok" }
   # Check: http://localhost:3003/api/v1/health/ready → { status: "ok" }
   ```
3. **Final Claude re-review** of Phase 2A with all fixes applied.
4. **Get client confirmation of items 2, 3, 4** before Phase 2B settlement work begins.
5. **On human approval, begin Phase 2B** at step 7 (auth module — argon2id), step 8 (JWT issuer/validator), step 9 (round lifecycle + bet placement envelope), step 10 (settlement envelope — no arithmetic until items 2–4 confirmed).

**Do not start Phase 2B without explicit human approval.** When it starts: no RNG, no payout arithmetic, no commission calculation until client items 2–4 are confirmed and recorded in a new ADR.

---

## REPORTING NOTE

**PHASE 2A REVIEW FIXES COMPLETE AND VERIFIED.** 132/132 tests, 0 lint warnings, clean typecheck (covers packages + services/api + services/game-engine), clean builds. Prisma migration created with all required constraints. Ready for final Phase 2A re-review by Claude Opus.
