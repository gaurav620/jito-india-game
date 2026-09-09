# JITO INDIA GAMES — Project Memory

> Running log of project state. Updated after every meaningful development session.

---

## Current State

| Aspect | Status |
|--------|--------|
| Phase | PHASE 1 — Complete, verified by Claude handoff audit 2026-09-09 |
| Repository | Fully initialized & validated |
| Documentation | Complete (8 root context files + 18 docs files updated) |
| Monorepo | Active with npm workspaces (`packages/*`, `apps/*`, `services/*`) |
| Shared Packages | `@jito/types`, `@jito/config`, `@jito/shared`, `@jito/ui`, `@jito/game-core` |
| Applications | `apps/web` (Next.js), `apps/admin` (Next.js), `apps/desktop` (Electron), `apps/mobile` (Capacitor) |
| Services | `services/api`, `services/game-engine` (scaffolded for Phase 6+) |
| Tests | Unit tests configured & passing (24 tests) |
| Build & Lint | `npm run lint` passing (0 warnings), all builds passing |
| Next Recommended Phase | **Phase 2 — but only after client confirms the open items below.** Do not start backend game logic, auth backend, WebSocket engine, RNG, settlement, or points ledger until then. |

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

---

## Known Issues

- Reference screenshots exist only for: landing page, Triple Chance Timer (active + win state), Game History modal, Report modal. `assets/reference/lobby/`, `assets/reference/login/`, `assets/reference/client-reference/`, and `assets/reference/triple-chance-pro-timer/` are empty — the Lobby, Login/Register, and Triple Chance **Pro** Timer screens were built from written spec + inference, not a screenshot. Pro Timer currently renders as the standard Timer page with a "PRO VARIANT TABLE" badge — real Pro-specific rule/layout differences are `NEEDS CLIENT CONFIRMATION` (tracked in `docs/CLIENT_REQUIREMENTS.md` item 4).
- `.nvmrc` pins Node 20; this session's available Node runtime is v24. Builds/tests pass on v24, but CI/dev machines should still install Node 20 per `.nvmrc` for parity.
- `apps/mobile/capacitor.config.ts` has `cleartext: true`, `allowMixedContent: true`, and `webContentsDebuggingEnabled: true` — fine for Phase 1 dev, must be turned off before any real Android release build.

---

## Technical Debt

- Root `tsconfig.json` project references only cover `packages/*` — `apps/*` and `services/*` are not included in `tsc --build`, so their type safety is only checked via each app's own `next build` / `tsc --noEmit`-equivalent path. Acceptable for now; revisit if cross-package type errors start slipping through.

---

## Confirmed vs Pending Client Questions

See `docs/CLIENT_REQUIREMENTS.md` for full breakdown.
- Confirmed: Strictly Points Platform (NO payment gateways, UPI, cards, deposits, withdrawals).
- Confirmed: Number spaces: Singles (0-9), Doubles (00-99), Triples (000-999).
- Confirmed: 3 Concentric Rings on Wheel (Triples, Doubles, Singles).
- Pending Client Confirmation: Exact round countdown seconds (defaults to 90s), exact payout multipliers.
