# JITO INDIA GAMES — Project Context (Cross-Agent Handoff)

> This file is the authoritative cross-agent handoff memory for Claude Code, Antigravity, and any future agent. Read this before touching code. Also read `MEMORY.md` (session log), `DECISIONS.md` (ADRs, append-only), and `docs/CLIENT_REQUIREMENTS.md` (pending client questions).

---

## CURRENT PHASE

**Phase 1 — Complete**

## STATUS

**READY FOR PHASE 2 AFTER CLIENT CONFIRMATIONS**

Phase 1 (Design, UI Foundation & Reference Recreation) was independently verified by a Claude Code handoff audit on 2026-09-09 (build/lint/typecheck/test all re-run from a clean state, source tree cross-checked file-by-file against documentation claims — not just MEMORY.md taken on faith), and re-verified in a final baseline check on 2026-09-09 after the repo's first commit (`a964856`). Phase 2 (server-authoritative game engine, auth backend, WebSocket, RNG, settlement, points ledger) must not start until the client confirmations in `docs/CLIENT_REQUIREMENTS.md` section 2 land and a human explicitly approves moving past Phase 1.

---

## COMPLETED

- Monorepo scaffold: npm workspaces across `packages/*`, `apps/*`, `services/*`. Baseline committed as `a964856` ("feat: complete Phase 0 foundation and Phase 1 design, UI & reference recreation") on the `main` branch; working tree is clean.
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

## PHASE 2 — ARCHITECTURE DESIGNED (NO CODE WRITTEN)

On 2026-09-09 the complete Phase 2 backend architecture was designed and documented. **No Phase 2 code exists** — this is design only, and implementation must not start until the client confirmations below are answered and a human approves.

Seven design documents were produced:

| Document | Covers |
|---|---|
| `docs/DATABASE_V2.md` | 13-table normalized schema, constraints, indexes, integrity invariants |
| `docs/POINTS_SYSTEM.md` | Append-only points ledger, the four hazards and what blocks each |
| `docs/AUTH_V2.md` | Registration, login, token strategy, argon2id, rotation + reuse detection |
| `docs/API_V2.md` | Full REST contract including admin APIs |
| `docs/WEBSOCKET_V2.md` | Events, payload shapes, rooms, time sync, reconnect |
| `docs/GAME_ENGINE_V2.md` | Round lifecycle, single-writer engine, RNG and payout boundaries |
| `docs/PHASE_2_IMPLEMENTATION_PLAN.md` | 14 ordered steps, dependency graph, gating confirmations |

ADRs **014–021** were appended to `DECISIONS.md` covering: points-only naming + integer centipoints, round-state renaming + `ROUND_VOID`, REST-only bet placement, the single-writer game engine, the unimplemented `ResultSource`/`SettlementRules` boundaries, the reconciling scheduler, rebuildable read models, and separate admin identity. `ARCHITECTURE.md` §10 carries the Phase 2 summary.

**Deliberately left unimplemented and unwritten** (per the brief and ADR-018): production RNG, result generation, payout multipliers, settlement arithmetic, commission maths, and any payment capability whatsoever. Phase 2 builds the transactional envelope; the unconfirmed business rules stay outside the codebase behind two interfaces until the client confirms them.

Steps 1–8 of the implementation plan are unblocked and could start on approval. Steps 9–12 are gated on client answers (payout multipliers, win-determination rule, commission structure being the critical path).

### Phase 2 architecture review — 2026-09-09 — **RESOLVED → APPROVED FOR IMPLEMENTATION**

All nine required changes were applied on 2026-09-09. All four CRITICAL and all four HIGH issues are resolved; three of seven MEDIUM issues were fixed as part of the doc-alignment change, one was already scheduled as implementation step 1, and the remaining three (M1 sequential rounds, M2 dead enum value, M3 settlement-event aggregation) are explicitly dispositioned as non-blocking. Full detail in `docs/PHASE_2_ARCHITECTURE_REVIEW.md` → *Resolution*.

Key corrections now in the design: `game_history` is projected once per user at `ROUND_COMPLETED` instead of per bet (ADR-024); canonical lock order is `round → account → bet` with settlement taking the account lock only (ADR-022); `ROUND_VOID` requires zero settlements; a monotonic `state_version` rides on every round-state payload including the snapshot (ADR-023); the bet API is specified as the superset of both submission models with the rate limit raised 30 → 240/min (ADR-025); report columns that have no confirmed formula are nullable so they render blank rather than a misleading `0.00`; and all six V1 docs now carry superseded banners naming their successor and divergences.

**Status: APPROVED FOR IMPLEMENTATION.** No code has been written.

<details>
<summary>Original review findings (2026-09-09, now resolved)</summary>

The Phase 2 design was then formally reviewed (`docs/PHASE_2_ARCHITECTURE_REVIEW.md`). The architecture is structurally sound — server authority, points-only compliance, Redis boundaries, the auth model, the single-writer engine, and the RNG/payout isolation all passed. But the review found **four critical defects** that would each cause a production incident if coded as written, three of them contradictions *between* documents:

| # | Defect | Consequence |
|---|---|---|
| C1 | `game_history` is written per bet but is `UNIQUE (user_id, round_id)` | A player with 2+ bets in a round breaks settlement permanently; the round never completes and — via the one-live-round index — **no further round can open. The game halts for everyone.** |
| C2 | Stated lock order (`account → round`) contradicts the documented bet flow (`round → account`) | Deadlock between the bet and settlement paths, surfacing as intermittent bet failures under load |
| C3 | Voiding a partially-settled round is undefined | Winners paid *and* refunded, with no specified reversal |
| C4 | WebSocket join race: socket joins the room before the snapshot is sent | A stale snapshot overwrites newer state; a reconnecting player can see betting reopen on a locked round |

Plus four HIGH and seven MEDIUM issues, including one **new client question**: whether each chip placement is an immediate server bet or the client batches selections into one bet per round. That materially changes the `POST /bets` contract and the rate limit (currently 30/min, likely too low for per-chip play).

ADRs **022–025** record the decisions arising from the review (canonical lock order, `stateVersion` for realtime ordering, history projection at round completion, bet-API superset).

</details>

---

## IN PROGRESS

Nothing is mid-implementation. Phase 1's stated scope is fully built and Phase 2 is designed but not started. The only open items are the reference-material and client-confirmation gaps listed below.

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

Phase 2 is designed, reviewed, corrected, and **APPROVED FOR IMPLEMENTATION**. Awaiting human go-ahead to begin coding. In priority order:

1. **Get client answers to the three critical-path items**: payout multipliers, the win-determination rule (does a Doubles bet on `72` win when the draw is `772`?), and the commission/rake structure. Without these, settlement cannot be built and Phase 2 stalls at roughly 80%.
2. **Ask confirmation item 13** — is each chip placement an immediate server bet, or are selections batched into one bet per round? Cheap for the client to answer; now affects only client behaviour and rate-limit tuning, not the schema.
3. **Get the missing reference material** (Lobby, Login/Register, Pro Timer screenshots) to close the Phase 1 fidelity gap noted above.
4. **On human approval, begin implementation** at `docs/PHASE_2_IMPLEMENTATION_PLAN.md` step 1 (shared types and points primitives). Steps 1–6 are unblocked by the client; step 7 (bets) is buildable now since the contract is the superset; steps 9–12 need the payout/win/commission answers.

**Do not start Phase 2 implementation without explicit human approval.** When it does start, production RNG, payout calculation, settlement arithmetic, and any payment capability remain out of scope until separately confirmed and recorded in a new ADR.

---

## REPORTING NOTE

**PHASE 1 READY FOR REVIEW.** Phase 1's full stated scope (website shell, auth UI, download page, lobby, both game shells, design system, Phaser wheel prototype, admin shell, Electron shell, Capacitor shell, testing foundation) is implemented, builds clean, lints clean, and passes all 24 unit tests. Remaining gaps are reference-material and client-confirmation gaps, not implementation gaps — see Known Issues above.
