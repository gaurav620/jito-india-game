# JITO INDIA GAMES — Project Context (Cross-Agent Handoff)

> This file is the authoritative cross-agent handoff memory for Claude Code, Antigravity, and any future agent. Read this before touching code. Also read `MEMORY.md` (session log), `DECISIONS.md` (ADRs, append-only), and `docs/CLIENT_REQUIREMENTS.md` (pending client questions).

---

## CURRENT PHASE

**Phase 1 — Design, UI Foundation & Reference Recreation.**

Status: **COMPLETE**, independently verified by a Claude Code handoff audit on 2026-09-09 (build/lint/typecheck/test all re-run from a clean state, source tree cross-checked file-by-file against documentation claims — not just MEMORY.md taken on faith).

---

## COMPLETED

- Monorepo scaffold: npm workspaces across `packages/*`, `apps/*`, `services/*`. No commits exist yet (repo is `git init`'d but nothing has been committed — everything is currently untracked).
- Shared packages: `@jito/types`, `@jito/config`, `@jito/shared` (build to `dist/`, typechecked, unit tested), `@jito/ui` and `@jito/game-core` (consumed directly from `src/*.ts` via each package's `main` field — no build step needed for Next.js to pick them up).
- `@jito/ui` design system: Button, Input, Modal, Chip, GridCell, Countdown, Table, Tabs, Card, GameCard, Badge, Toast, CasinoTopBar, SectionHeader (both inside `header.tsx`), and `OrnateFrame` (baroque gold filigree).
- `@jito/game-core`: pure-math `WheelEngine` (`wheel-renderer.ts`) — takes a `WheelTargetResult` as input and computes ring angles; contains **zero RNG and zero settlement logic**, matching the server-authoritative architecture rule. Wrapped in a `<PhaserWheel />` React container with idle/rotating/slowing/final_result states.
- `apps/web` (Next.js 14, App Router): landing page (`/`), `/login`, `/register`, `/download`, lobby (`/games`), `/games/triple-chance` (full 1:1 recreation of the reference desktop layout — Doubles 00-99 grid, Triples 000-999 grid with range tabs, Singles 0-9 bar, 3-ring wheel, chip tray, DOUBLE/REPEAT/INFO/CLEAR actions, PLAY/WIN counters, Game History + Report modals, and an in-page Phase-1 demo simulator that mocks a full betting → lock → spin → 772-result → payout round using local component state only), `/games/triple-chance-pro` (renders the same page with a "PRO VARIANT TABLE" badge — see Gaps below).
- `apps/admin` (Next.js 14): Dashboard, Users & Points, Points Ledger, Game Rounds, Game History, Reports, Announcements, Downloads, Audit Logs. Points-only — no payment gateway UI anywhere (grep-verified across the whole repo).
- `apps/desktop` (Electron): frameless window, `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, IPC window controls exposed via `contextBridge` in `preload.ts`. Correctly isolated.
- `apps/mobile` (Capacitor): `capacitor.config.ts` targets `com.jitoindia.games`, landscape orientation, points to `apps/web/out` as `webDir`. Debug flags (`cleartext`, `allowMixedContent`, `webContentsDebuggingEnabled`) are all `true` — fine for Phase 1, must be turned off before any real release build.
- `services/api` and `services/game-engine`: intentionally scaffolded to `package.json` only, no source — correctly deferred to Phase 6+ per the "do not start backend game logic" rule.
- Testing: 24 Vitest unit tests passing (wheel engine, UI helpers, shared validation/formatting). ESLint passes with 0 warnings. Both Next.js apps build and statically generate every route.
- Zero payment-gateway/Razorpay/Stripe/UPI/deposit/withdrawal/cashout code anywhere in the source tree — confirmed via a full-repo grep, not just doc review. The two doc-adjacent hits found were negation text ("No payment gateways") and a false-positive substring match on "striped" — nothing to fix.

---

## IN PROGRESS

Nothing is mid-implementation. Phase 1's stated scope is fully built. The only open items are the reference-material and client-confirmation gaps listed below, which block *deepening* Phase 1 fidelity, not Phase 1 completion.

---

## BLOCKED

Nothing is blocked on tooling or code. The remaining open items are blocked on **client input**, tracked in `docs/CLIENT_REQUIREMENTS.md` section 2 (round duration, payout multipliers, commission formula, exact Timer vs Pro Timer rule differences, registration requirements, thermal printer protocol, legacy DB export format) and on **missing reference material** (see Known Issues below).

---

## KNOWN ISSUES

1. **Reference screenshots are incomplete.** Only these exist under `assets/reference/`: `landing-page/`, `triple-chance-timer/` (active + win state), `game-history/`, `report/`. The following folders exist but are **empty**: `lobby/`, `login/`, `client-reference/`, `triple-chance-pro-timer/`. Consequently:
   - The Lobby, Login, and Register screens were built from `docs/UI_SPEC.md` inference and general casino-UI convention, not a client screenshot.
   - Triple Chance **Pro** Timer has no reference image at all. It currently just re-renders the standard Timer page with a "PRO VARIANT TABLE" ribbon badge — there is no visually or behaviorally distinct Pro implementation yet. This is explicitly flagged `NEEDS CLIENT CONFIRMATION` in `docs/GAME_RULES.md` and `docs/CLIENT_REQUIREMENTS.md` item 4.
2. `.nvmrc` pins Node 20; only Node 24 (`C:\Program Files\nodejs`) was found on this machine's PATH during the audit. Everything passes on v24, but install Node 20 for exact parity when possible.
3. `apps/mobile/capacitor.config.ts` ships with debug-friendly flags (`cleartext: true`, `allowMixedContent: true`, `webContentsDebuggingEnabled: true`) that must be disabled before any real Android release.
4. Root `tsconfig.json` project references cover only `packages/*`, not `apps/*`/`services/*` — each app's own type safety runs through its own `next build` step instead of the root `tsc --build`. Not a bug, just worth knowing when debugging cross-package type errors.

---

## FIXED DURING THIS HANDOFF (2026-09-09, Claude Code)

- Found and deleted ~150 stray compiled `.js`/`.js.map`/`.d.ts`/`.d.ts.map` files sitting next to source across `apps/web/src`, `apps/admin/src`, `apps/desktop/src`, `apps/mobile/`, `packages/ui/src`, `packages/game-core/src`. These were dead build output from an earlier ad hoc `tsc` run (traced via each `package.json`'s `main`/`types` field — none of the deleted files were reachable by anything). They were about to be committed permanently since `.gitignore` had no rule for them. Added `.gitignore` patterns to prevent recurrence. Full validation (lint/typecheck/test/build/build:web/build:admin) re-run and passes identically before and after. See `DECISIONS.md` ADR-013 for full detail.
- No business logic, component behavior, or visual output was changed by this fix — it is a pure dead-file cleanup.

---

## NEXT TASK

Two options, both client-input-gated rather than code-gated:

1. **Get the missing reference material** (Lobby, Login/Register, Pro Timer screenshots or written spec from the client) and use it to close the fidelity gap noted above — this is the highest-value next step if the client can supply it.
2. **Answer the open questions in `docs/CLIENT_REQUIREMENTS.md` section 2** (round timing, payout multipliers, commission formula, Timer vs Pro Timer differences, registration fields, printer protocol, legacy DB export) so Phase 2 (server-authoritative game engine, auth, wallet/points ledger, WebSocket round lifecycle) can start from confirmed business rules instead of placeholders.

**Do not start Phase 2 backend game logic (RNG, settlement, betting API, WebSocket game engine, points ledger) until the client confirms the above and a human approves moving past Phase 1.**

---

## REPORTING NOTE

**PHASE 1 READY FOR REVIEW.** Phase 1's full stated scope (website shell, auth UI, download page, lobby, both game shells, design system, Phaser wheel prototype, admin shell, Electron shell, Capacitor shell, testing foundation) is implemented, builds clean, lints clean, and passes all 24 unit tests. Remaining gaps are reference-material and client-confirmation gaps, not implementation gaps — see Known Issues above.
