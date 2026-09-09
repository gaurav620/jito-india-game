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
| Phase 2 | **Architecture DESIGNED, REVIEWED, and CORRECTED 2026-09-09 — APPROVED FOR IMPLEMENTATION. Implementation NOT started.** 7 design docs + `docs/PHASE_2_ARCHITECTURE_REVIEW.md`; ADR-014–025. |
| Next Recommended Phase | **Phase 2 implementation, on human approval** — begin at `docs/PHASE_2_IMPLEMENTATION_PLAN.md` step 1. Steps 1–6 unblocked; steps 9–12 gated on payout multipliers, the win-determination rule, and commission structure. |

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
