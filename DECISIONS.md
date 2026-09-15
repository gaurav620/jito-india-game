# JITO INDIA GAMES — Architecture Decision Records

> Append-only. Never rewrite historical decisions.

---

## ADR-001: Monorepo Architecture with npm Workspaces

**Date**: 2026-09-08
**Decision**: Use a monorepo structure with npm workspaces
**Context**: The project has multiple applications (web, admin, desktop, mobile), services (API, game engine), and shared packages (types, config, shared, ui, game-core) that need to share code and types.
**Alternatives**:
1. Separate repositories per application
2. Turborepo
3. Nx
4. Lerna
5. npm workspaces (built-in)
**Chosen approach**: npm workspaces
**Why**: Built into npm (no additional tooling), sufficient for the project scale, simpler setup, zero-config workspace resolution, TypeScript project references for build orchestration.
**Impact**: All packages share a single `node_modules`, workspace cross-references via `package.json` dependencies, root-level scripts orchestrate builds.

---

## ADR-002: Next.js for Web Frontend

**Date**: 2026-09-08
**Decision**: Use Next.js for the public website and admin panel
**Context**: Need server-side rendering for SEO (public site), modern React with TypeScript, file-based routing, and a mature ecosystem.
**Alternatives**:
1. Vite + React (SPA only)
2. Remix
3. Astro
4. Plain React
**Chosen approach**: Next.js (App Router)
**Why**: SSR/SSG for public pages, excellent TypeScript support, built-in API routes (though main API is NestJS), large ecosystem, mature deployment options, Tailwind CSS integration.
**Impact**: `apps/web` and `apps/admin` both use Next.js. Admin is SPA-like (no SSR needed).

---

## ADR-003: Phaser 3 for Game Rendering

**Date**: 2026-09-08
**Decision**: Use Phaser 3 for game board, wheel, animations, and visual states
**Context**: The game requires smooth animations (spinning wheel, chip interactions, result effects), real-time countdown display, and complex visual state management that standard React/HTML is not optimized for.
**Alternatives**:
1. Plain HTML/CSS/Canvas
2. PixiJS
3. Three.js (3D — overkill)
4. React Canvas components
**Chosen approach**: Phaser 3
**Why**: Industry-standard 2D game engine, WebGL rendering with Canvas fallback, built-in animation and tween systems, scene management, input handling, physics (if needed), large community, TypeScript definitions available.
**Impact**: Game UI lives in `packages/game-core`, rendered within an Electron/Capacitor/browser container. Non-game UI (lobby, history, settings) remains in React.

---

## ADR-004: NestJS for Backend

**Date**: 2026-09-08
**Decision**: Use NestJS as the backend framework
**Context**: Need a structured, modular backend with REST API, WebSocket gateway, authentication guards, validation, and database integration. TypeScript-first is required.
**Alternatives**:
1. Express.js (minimal, unstructured)
2. Fastify (fast, but less opinionated)
3. Hapi
4. Koa
**Chosen approach**: NestJS
**Why**: Enterprise-grade modular architecture, built-in WebSocket gateway, Guards/Pipes/Interceptors for cross-cutting concerns, class-validator integration, TypeORM/Prisma support, excellent TypeScript support, dependency injection.
**Impact**: `services/api` and `services/game-engine` both use NestJS. Modules organized by domain (auth, users, wallet, games, admin).

---

## ADR-005: PostgreSQL for Database

**Date**: 2026-09-08
**Decision**: Use PostgreSQL as the primary database
**Context**: Need ACID-compliant relational database for financial transactions (wallet), game rounds, bets, settlements. Audit trail is critical.
**Alternatives**:
1. MySQL/MariaDB
2. MongoDB (NoSQL)
3. SQLite (too limited)
**Chosen approach**: PostgreSQL (AWS RDS in production)
**Why**: ACID compliance for financial integrity, excellent JSON support for flexible data, mature with decades of reliability, advanced indexing, window functions for reporting, native UUID support, AWS RDS managed service.
**Impact**: All transactional data stored in PostgreSQL. Redis handles caching and real-time state only.

---

## ADR-006: Redis for Cache & Realtime Coordination

**Date**: 2026-09-08
**Decision**: Use Redis for caching, session storage, and real-time game state coordination
**Context**: Need sub-millisecond reads for active game state, pub/sub for WebSocket event distribution, and session caching.
**Alternatives**:
1. Memcached (no persistence, no pub/sub)
2. In-memory only (no horizontal scaling)
**Chosen approach**: Redis (AWS ElastiCache in production)
**Why**: Sub-millisecond latency, pub/sub for real-time event distribution across server instances, sorted sets for leaderboards, expiring keys for sessions, AWS ElastiCache managed service.
**Impact**: Active game rounds cached in Redis, WebSocket events distributed via pub/sub, JWT sessions stored with expiry.

---

## ADR-007: Electron for Windows Desktop

**Date**: 2026-09-08
**Decision**: Use Electron for the Windows desktop application
**Context**: Need a Windows application that runs the game (Phaser + React) with native window management, fullscreen, and auto-update capability.
**Alternatives**:
1. Tauri (Rust-based, smaller binary, but less mature WebView)
2. NW.js (less maintained)
3. Progressive Web App (limited desktop integration)
**Chosen approach**: Electron
**Why**: Mature ecosystem, Chromium guarantees consistent rendering, auto-updater support, native window management, IPC for secure main/renderer separation, large community, proven at scale.
**Impact**: `apps/desktop` uses Electron. Security rules: `nodeIntegration: false`, `contextIsolation: true`, explicit preload scripts.

---

## ADR-008: Capacitor for Android

**Date**: 2026-09-08
**Decision**: Use Capacitor for the Android mobile application
**Context**: Need an Android application that renders the same game (Phaser + React) with native mobile features (orientation, touch, lifecycle).
**Alternatives**:
1. React Native (different rendering model, can't reuse Phaser directly)
2. Flutter (completely different language/framework)
3. Cordova (legacy, Capacitor is its successor)
4. Native Android (Java/Kotlin — no code sharing)
**Chosen approach**: Capacitor
**Why**: Shares web codebase (React + Phaser), modern Cordova successor, native plugin access, native project access for customization, Ionic team maintained, TypeScript native.
**Impact**: `apps/mobile` uses Capacitor. Game rendering shared via `packages/game-core`. Mobile-specific UI adaptations required.

---

## ADR-009: AWS for Infrastructure

**Date**: 2026-09-08
**Decision**: Use AWS as the cloud infrastructure provider
**Context**: Need scalable, managed infrastructure for production deployment with CDN, load balancing, container orchestration, managed database, and monitoring.
**Alternatives**:
1. Google Cloud Platform
2. Azure
3. DigitalOcean (less managed services)
4. Self-hosted (operational burden)
**Chosen approach**: AWS (ECS/Fargate, RDS, ElastiCache, S3, CloudFront, WAF, CloudWatch, Route 53)
**Why**: Most mature cloud platform, managed services reduce operational burden, India region (ap-south-1) for low latency, Fargate for serverless containers, comprehensive monitoring and alerting.
**Impact**: Production runs on ECS/Fargate behind ALB + CloudFront. RDS PostgreSQL for database. ElastiCache Redis for caching. S3 + CloudFront for static assets. WAF for security.

---

## ADR-010: Server-Authoritative Game Architecture

**Date**: 2026-09-08
**Decision**: The server is the single source of truth for all game state, results, and financial operations
**Context**: This is a gaming platform where integrity is paramount. The client cannot be trusted to determine results, validate bets, or manage balances.
**Alternatives**:
1. Client-authoritative (insecure, easily manipulated)
2. Hybrid (complex, still has trust issues)
**Chosen approach**: Server-authoritative
**Why**: Game integrity — prevents cheating, manipulation, and unauthorized balance changes. All results generated server-side. All bets validated server-side. All settlements computed and applied server-side. Client only renders and captures input.
**Impact**: WebSocket pushes state from server to client. Client interpolates countdown from server-provided deadline. All financial mutations happen server-side within database transactions. Audit trail for every state change.

---

## ADR-011: Dedicated Points-Only Architecture (Strictly No Payment Gateways)

**Date**: 2026-09-08
**Decision**: Implement the platform strictly as a points accounting system with zero payment gateways, deposits, or withdrawals.
**Context**: The business requirements explicitly prohibit payment gateways (Razorpay, Stripe, UPI, cards, net banking). Points are allocated and tracked for amusement/gameplay only.
**Alternatives**:
1. Generic wallet with payment gateway stubs
2. Points-only domain model
**Chosen approach**: Points-only domain model
**Why**: Ensures complete regulatory alignment, avoids introducing unnecessary external payment complexity or security liabilities, and strictly honors client instructions.
**Impact**: All wallet services, admin screens, reports, and game balances operate purely on points (`POINTS BALANCE`, `SALE POINT`, `WIN POINT`, `COMMI POINT`, `NTP POINT`).

---

## ADR-012: Phaser 3 React Container with Resilient Fallback

**Date**: 2026-09-08
**Decision**: Wrap Phaser 3 canvas rendering in a dedicated React container component (`@jito/game-core`) with procedural Canvas/CSS fallback.
**Context**: Next.js App Router and SSR environments do not have a DOM/WebGL context during build time. The wheel must render smoothly on both high-end desktop GPUs and lower-end mobile devices.
**Alternatives**:
1. Pure DOM/CSS animations (less performant for complex multi-ring physics)
2. Standalone canvas without React bindings
3. React-Phaser hybrid bridge with WebGL and Canvas fallback
**Chosen approach**: React-Phaser hybrid bridge with WebGL and Canvas fallback
**Why**: Guarantees SSR build compatibility while achieving 60 FPS hardware acceleration on client devices.
**Impact**: `<PhaserWheel />` can be imported safely anywhere in the React tree while keeping game state and rendering decoupled.

---

## ADR-013: Delete Stray In-Place TypeScript Emit; No Root Project-Reference Change

**Date**: 2026-09-09
**Decision**: Delete all `.js`/`.js.map`/`.d.ts`/`.d.ts.map` files found sitting next to `.ts`/`.tsx` sources in `apps/web/src`, `apps/admin/src`, `apps/desktop/src`, `apps/mobile/`, `packages/ui/src`, and `packages/game-core/src`; add `.gitignore` rules to stop them from being re-committed. Did **not** change `tsconfig.json` project references or any app's `outDir`.
**Context**: A Claude handoff audit of the Antigravity-built Phase 1 repo found ~150 compiled artifact files interleaved with source across most of the codebase. None of them were reachable from any `package.json` `main`/`types` field (`packages/types|config|shared` point at `dist/`; `packages/ui|game-core` point straight at `src/*.ts`; the apps use Next.js/Electron's own compilation, not these files) — they were dead output from an earlier ad hoc `tsc` invocation that inherited `declaration`/`sourceMap` from a discovered tsconfig without an `outDir`, most likely run per-file outside the configured `npm run build`/`typecheck` scripts. `.gitignore` had no rule excluding them, so the next `git add .` would have committed stale compiled JS alongside every source file permanently.
**Alternatives**:
1. Leave them — reduces risk of touching Antigravity's tree
2. Delete only the worst offenders (e.g., just `apps/*`)
3. Delete everywhere they're proven dead, plus prevent recurrence via `.gitignore`
**Chosen approach**: Option 3 — full deletion plus `.gitignore` rules.
**Why**: They are unambiguously dead files (verified via `package.json` entry points and successful clean rebuilds before/after deletion), they were about to enter version control permanently since nothing ignored them, and their presence risked confusing tooling that resolves `.js` over `.ts`/`.tsx` (e.g. a stray `page.js` next to `page.tsx` in a Next.js App Router route). This is a mechanical hygiene fix, not an architectural change — no `tsconfig.json`, `package.json`, or business logic was touched.
**Impact**: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run build:web`, and `npm run build:admin` were all re-run after deletion and pass identically to before (24/24 tests, 0 lint warnings, clean typecheck, both Next.js apps compile and statically generate all routes). Future `tsc`/typecheck invocations should always go through the `npm run typecheck`/`build` scripts, which correctly target `dist/` or use `noEmit: true`, to avoid regenerating this debt.

---

> ADRs 014–021 below were recorded during the **Phase 2 architecture design** session on 2026-09-09.
> They are design decisions only — no Phase 2 code has been written.

---

## ADR-014: Points-Only Ledger Naming and Integer Centipoint Storage

**Date**: 2026-09-09
**Decision**: Name the Phase 2 tables `points_accounts` and `points_transactions` (not `wallets`/`wallet_transactions`), and store every points value as a `BIGINT` count of centipoints (1 point = 100) with a `_minor` suffix, rather than `DECIMAL(15,2)`.
**Context**: Phase 1's `docs/DATABASE.md` sketched `wallets`/`wallet_transactions` with `DECIMAL(15,2)`. ADR-011 established that this platform is strictly points-based with no payment capability. The UI displays two decimal places (`64707.00`).
**Alternatives**:
1. Keep `wallets` + `DECIMAL(15,2)`
2. Keep `wallets`, switch to integers
3. Rename to points, keep `DECIMAL`
4. Rename to points **and** use `BIGINT` centipoints
**Chosen approach**: Option 4.
**Why**: (a) "Wallet" language invites payment-shaped thinking and would make a future payment module feel like a natural extension rather than the prohibited change it is; points naming keeps ADR-011 visible in the schema itself. (b) `node-postgres` returns `NUMERIC` as a JavaScript **string** to avoid precision loss — the moment any developer writes `parseFloat(row.balance)` the value enters IEEE-754 floating point, and the resulting rounding bug looks like completely normal code in review. `BIGINT` centipoints are exact in Postgres and exact in JS below 2^53 centipoints (≈90 billion points), far beyond any realistic balance. It also makes the `SUM(ledger) = balance` invariant check exact rather than approximate.
**Impact**: `@jito/types` must rename `Wallet`/`WalletTransaction` → `PointsAccount`/`PointsTransaction`. Every API and WebSocket payload carries `…Minor` integers; conversion to display format happens in exactly one shared helper at the presentation boundary. The V1 `wallet.updated` WebSocket event becomes `points.updated`.

---

## ADR-015: Round State Naming Alignment and the Addition of ROUND_VOID

**Date**: 2026-09-09
**Decision**: Rename `RESULT_GENERATION` → `RESULT_PENDING` and `SETTLEMENT` → `SETTLEMENT_PENDING`, and add a terminal `ROUND_VOID` state.
**Context**: Phase 1's `packages/types` `RoundState` enum and `docs/GAME_STATE_MACHINE.md` used the older names. The Phase 2 brief specifies the `_PENDING` names. Separately, the Phase 1 state machine had no legal terminal state for a round that cannot complete.
**Alternatives**:
1. Keep the Phase 1 names and treat the brief as informal
2. Rename only
3. Rename and add `ROUND_VOID`
**Chosen approach**: Option 3.
**Why**: `RESULT_PENDING` is also more *accurate* for Phase 2, where the server **awaits** a result from a controlled external source rather than generating one (ADR-018) — the old name would actively mislead a reader into expecting generation code. `ROUND_VOID` is necessary because without it, a round that can never produce a result leaves its bets stranded in `accepted` forever, with no legal path to refund them; the state machine would have a hole that operations staff would have to work around manually in the database.
**Impact**: `packages/types` `RoundState` and `docs/GAME_STATE_MACHINE.md` must be updated in Phase 2 step 1. The WebSocket event `game.result.started` becomes `game.result.pending`, and `game.round.void` is added. Phase 1 UI code consuming these enums must be updated in lockstep.

---

## ADR-016: Bets Are Placed Over REST, Not WebSocket

**Date**: 2026-09-09
**Decision**: `POST /api/v1/bets` is the only way to place a bet. Remove the V1 `game.bet.place` WebSocket event. Confirmations are still delivered over WebSocket.
**Context**: `docs/WEBSOCKET.md` (V1) listed `game.bet.place` as a client→server event "alt to REST", leaving two paths for the single most correctness-critical mutation in the product.
**Alternatives**:
1. Support both paths
2. WebSocket only (lowest latency)
3. REST only, WebSocket for confirmation
**Chosen approach**: Option 3.
**Why**: A bet is a financial mutation that needs a mandatory idempotency key, a definite HTTP status code, standard retry semantics, and a response the client can correlate with certainty. WebSocket acknowledgements make "did my bet actually land?" ambiguous precisely when the network is unreliable — which is exactly when the answer matters most. Two code paths would also mean two places to enforce every validation rule, and validation that exists in one path but not the other is a classic source of exploitable divergence. Latency is not a real argument here: bet placement happens during a multi-second betting window, not in a frame budget.
**Impact**: `docs/WEBSOCKET_V2.md` §6 documents the removal. Clients place bets via REST and update the UI on the `game.bet.accepted` event (or the HTTP response, whichever arrives first — handlers must be idempotent).

---

## ADR-017: Single-Writer Game Engine with Layered Enforcement

**Date**: 2026-09-09
**Decision**: `services/game-engine` is the sole writer of round state and runs as exactly one instance, enforced by (1) ECS desired-count 1, (2) a Redis leader lock, and (3) a partial unique index on `game_rounds` permitting at most one non-terminal round per game. `services/api` never transitions a round.
**Context**: Round transitions are check-then-act sequences ("if the deadline has passed, lock the round"). Horizontally scaling that logic means two instances can both observe `BETTING_ACTIVE`, both decide to lock, and both start settlement.
**Alternatives**:
1. Transitions in the horizontally-scaled API, guarded by advisory locks everywhere
2. Single-writer engine, enforced only by ECS desired-count 1
3. Single-writer engine with all three enforcement layers
**Chosen approach**: Option 3.
**Why**: Option 1 requires every future call site to remember to take the lock — a rule that will eventually be missed. Option 2 is insufficient because ECS deliberately runs old and new tasks concurrently during a rolling deploy, which is exactly when a duplicate transition would occur, and it is also the moment least likely to be tested. The three layers have different characters on purpose: ECS count and the leader lock *prevent* concurrent action, while the partial unique index makes the bad outcome *structurally impossible* even if both fail. Only the third layer is a true guarantee; the first two exist so the guarantee is rarely exercised.
**Impact**: The API scales horizontally (it is read-only with respect to round state, and its one mutation — bet placement — is protected by row locks and idempotency keys). The engine is a scaling bottleneck by design; it is CPU-light and its work is naturally serial. Engine restart is safe because the scheduler is a reconciler (ADR-019).

---

## ADR-018: Result Generation and Payout Calculation Isolated Behind Unimplemented Interfaces

**Date**: 2026-09-09
**Decision**: Define `ResultSource` and `SettlementRules` as interfaces. Ship exactly one `ResultSource` implementation in Phase 2 — `ManualResultSource`, an audited admin endpoint. Ship **no** production `SettlementRules` implementation. No RNG anywhere in the repository.
**Context**: The client has not confirmed payout multipliers, commission structure, the win-determination rule, or any RNG/certification requirement. `AGENTS.md` and `RULES.md` both prohibit inventing business rules, and the Phase 2 brief explicitly forbids production RNG, payout, and settlement logic.
**Alternatives**:
1. Implement plausible defaults and mark them TODO
2. Leave the code paths entirely absent
3. Define the interfaces, implement only the audited manual path, leave the arithmetic unwritten
**Chosen approach**: Option 3.
**Why**: Option 1 is the dangerous one: a placeholder multiplier is indistinguishable from a confirmed one a few months later, and a wrong payout that reaches production pays the wrong players real amusement value and destroys trust — "we'll fix the TODO" is not a control. Option 2 would leave the surrounding machinery (transactions, idempotency, retry, resumability) untestable and unbuilt, forcing it to be written under time pressure once rules finally arrive. Option 3 lets Phase 2 build and fully test the hard part — the crash-safe, idempotent, resumable settlement envelope — while the unconfirmed arithmetic stays outside the codebase entirely, reduced to a single interface implementation reviewed on its own merits.
**Impact**: A round can be driven end-to-end in staging with a manually-entered draw and a no-payout stub. Production settlement is disabled by configuration until the rules are confirmed and recorded in a follow-up ADR. `settlements.rules_version` stamps every row so a later rule change never silently reinterprets historical settlements. Adding a certified RNG later requires client confirmation plus its own ADR.

---

## ADR-019: Reconciling Scheduler Instead of In-Memory Timers

**Date**: 2026-09-09
**Decision**: The game-engine advances rounds via a periodic tick (~250 ms) that reads current state from PostgreSQL and derives the next action, rather than scheduling in-memory timers at round start. All time comparisons use the database clock (`now()`), never an application host's clock.
**Context**: Rounds have several timed transitions (lock, reveal, settle, gap). The obvious implementation is `setTimeout` at each transition.
**Alternatives**:
1. In-memory timers per round
2. A durable job queue with scheduled jobs
3. A stateless reconciler polling the database
**Chosen approach**: Option 3.
**Why**: In-memory timers are lost on crash, deploy, or restart, stranding a round mid-lifecycle and requiring bespoke recovery code that only runs in rare, hard-to-test circumstances. A reconciler recovers automatically as an ordinary consequence of its normal operation: it restarts, reads state, sees a round that should have locked 40 seconds ago, and locks it — the recovery path *is* the happy path, so it is exercised continuously. Using the database clock rather than host clocks means there is exactly one clock in the system that matters, so a skewed ECS task cannot lock a round early or late. A job queue (option 2) would add infrastructure for a problem the reconciler solves with no new moving parts.
**Impact**: Every transition is idempotent and guarded by a conditional `UPDATE … WHERE state = $expected`, so a duplicated tick is a no-op. Transition latency is bounded by the tick interval (~250 ms), which is imperceptible against multi-second game phases. Stall detection falls out naturally: a round sitting in a state past its expected duration is visible to every tick and can be alerted on.

---

## ADR-020: History and Reports as Rebuildable Read Models

**Date**: 2026-09-09
**Decision**: Maintain `game_history` (per user per round) and `report_daily_aggregates` (per user per day) as denormalized read models, written in the settlement transaction and by an aggregation job respectively. Both must be fully rebuildable from source tables. Report day buckets use a fixed Asia/Kolkata timezone.
**Context**: The Game History and Report modals are hot player-facing paths whose natural queries join `bets`, `bet_items`, `settlements`, `game_rounds`, and `game_results` per displayed row.
**Alternatives**:
1. Query source tables directly with joins
2. Database views / materialized views
3. Denormalized read-model tables, rebuildable on demand
**Chosen approach**: Option 3.
**Why**: Option 1 degrades as history grows, on a screen players open constantly. Materialized views (option 2) are refreshed wholesale and are awkward to update incrementally within the settlement transaction, where the data is already at hand. Writing `game_history` inside the settlement transaction means the row cannot disagree with the settlement that produced it. The critical constraint is that both remain **caches, not sources of truth** — a `TRUNCATE` and rebuild must lose no information, which keeps them safe to regenerate whenever a bug or a formula change requires it, and is why a rebuild endpoint is part of the admin API.
**Impact**: `report_daily_aggregates` bucketing by Asia/Kolkata rather than UTC is deliberate: UTC bucketing would split an Indian evening's play across two report rows and make operator totals disagree with expectations. The `END`/`COMMI POINT`/`NTP POINT` formulas remain unconfirmed, so those columns return `null` rather than a guessed value.

---

## ADR-021: Separate Admin Identity Table and Token Audience

**Date**: 2026-09-09
**Decision**: Admins live in `admin_users`, entirely separate from `users`. Player and admin tokens carry different `aud` claims (`jito-player` / `jito-admin`), and admin accounts are provisioned, never self-registered.
**Context**: Phase 1's `docs/DATABASE.md` already sketched a separate `admin_users` table, while `packages/types` carries a `UserRole` enum including `Admin`, leaving the intended model ambiguous.
**Alternatives**:
1. One `users` table with a `role` column
2. Separate tables, shared token audience
3. Separate tables **and** separate token audiences
**Chosen approach**: Option 3.
**Why**: With a single table, the public self-service registration endpoint writes to the very table that grants administrative power, putting privilege escalation one mass-assignment bug or one missed `role` filter away — a well-documented failure mode. Separate tables make "a player becomes an admin" require a schema-level mistake rather than a field-level one. The distinct `aud` claim adds a second, independent barrier: a player token is structurally unusable against an admin endpoint even if a route guard is forgotten, which converts a likely future mistake into a non-event.
**Impact**: Two auth flows to build and test, and admin identities cannot be managed through player endpoints — an accepted cost. `packages/types`' `UserRole.Admin` should be reviewed in Phase 2 step 1; player-surface roles no longer need an admin member. The exact admin role set and permission matrix remain `NEEDS CLIENT CONFIRMATION`.

---

> ADRs 022–024 below were recorded during the **Phase 2 architecture review** on 2026-09-09
> (`docs/PHASE_2_ARCHITECTURE_REVIEW.md`). They resolve defects found in the Phase 2 design.
> Still design-only — no Phase 2 code has been written.

---

## ADR-022: Canonical Lock Acquisition Order — Round → Account → Bet

**Date**: 2026-09-09
**Decision**: All transactions acquire row locks in the order **round → account → bet**. Settlement acquires the account lock **only** and takes no round lock.
**Context**: The Phase 2 architecture review found that `docs/POINTS_SYSTEM.md` §6 declared the order "account → round → bet" while §7's own bet-placement flow locked round first, then account. The document contradicted itself on the rule that exists specifically to prevent deadlocks.
**Alternatives**:
1. Enforce the stated account → round → bet order, changing the bet flow
2. Adopt round → account → bet, correcting the stated rule
3. Avoid the second lock entirely by relying on constraints alone
**Chosen approach**: Option 2.
**Why**: Bet placement genuinely needs the round lock **first**, because that lock is what serialises a bet against the engine's `BETTING_LOCKED` transition — taking it second would leave a window where a bet is validated against a round that is being locked concurrently. Settlement, by contrast, needs no round lock at all: by the time it runs the round has already transitioned to `SETTLEMENT_PENDING`, no new bets can arrive, and per-bet transactions only touch one account. Removing settlement's round lock eliminates the cycle rather than merely ordering it, and also removes a contention point where thousands of per-bet transactions would otherwise queue on a single round row. Option 3 was rejected because `CHECK (balance_minor >= 0)` would convert lost races into aborted transactions and failed bets rather than correct serialisation.
**Impact**: `docs/POINTS_SYSTEM.md` §6 must be corrected to state round → account → bet and to note explicitly that settlement takes no round lock. Without this fix the two paths deadlock under load, surfacing as intermittent bet failures that are hardest to reproduce exactly when traffic is highest.

---

## ADR-023: Monotonic `stateVersion` on Rounds for Realtime Ordering

**Date**: 2026-09-09
**Decision**: Add a monotonic `state_version` counter to `game_rounds`, incremented on every state transition, and include it in every round-state WebSocket payload **including the join snapshot**. Clients apply an event only when its `stateVersion` exceeds the last applied value.
**Context**: The review found a join race: `docs/WEBSOCKET_V2.md` §2 joins the socket to the game room (step 6) *before* querying and sending the snapshot (step 7). A transition broadcast in that window reaches the client first, and the older snapshot then overwrites the newer state.
**Alternatives**:
1. Buffer room events until the snapshot is delivered, then flush
2. Query the snapshot before joining the room (leaves the opposite gap — events between query and join are simply lost)
3. Version-stamp all round state and let the client discard non-increasing versions
**Chosen approach**: Option 3.
**Why**: Options 1 and 2 each trade one race for another and require careful per-connection buffering logic that is difficult to test. Version stamping makes ordering a property of the *data* rather than of delivery timing, so it is correct regardless of arrival order, buffering, or duplication. It also delivers a second benefit for free: it makes duplicate event handling idempotent at the client, which the at-most-once delivery contract already required clients to handle. The cost is one `BIGINT` column and one comparison in the client reducer.
**Impact**: `game_rounds` gains `state_version BIGINT NOT NULL DEFAULT 0`, incremented in the same guarded `UPDATE` as each transition. Every round-state payload and `GameStateSnapshotPayload` carries `stateVersion`. Without this, a player reconnecting — the moment the race is most likely, since many clients reconnect together after an instance restart — can see betting reopen on a locked round.

---

## ADR-024: Project `game_history` Once at Round Completion, Not Per Bet

**Date**: 2026-09-09
**Decision**: Write the `game_history` read model **once per user per round at `ROUND_COMPLETED`**, aggregating that user's bets, rather than inserting a row inside each per-bet settlement transaction.
**Context**: The review found that `docs/DATABASE_V2.md` §5.1 defines `UNIQUE (user_id, round_id)` while `docs/POINTS_SYSTEM.md` §8 inserts a `game_history` row inside the per-bet settlement loop. Nothing prevents a user placing multiple bets in one round — `bets` is unique on `(user_id, idempotency_key)`, not `(user_id, round_id)`.
**Alternatives**:
1. Keep the per-bet insert and drop the unique constraint (one history row per bet)
2. Keep the per-bet insert with `ON CONFLICT … DO UPDATE` accumulating totals
3. Project once at `ROUND_COMPLETED`, aggregating the user's bets for that round
**Chosen approach**: Option 3, with option 2 as an acceptable fallback.
**Why**: Option 1 breaks the Game History modal, which shows one row per Game ID (`S NO | Game ID | Played | Won`) — a multi-bet round would display as several rows for the same game. Option 2 is correct but keeps a read-model concern inside the money transaction, where it adds failure surface to the most safety-critical code path in the system. Option 3 keeps per-bet settlement transactions focused purely on money and matches the modal's semantics directly. The severity here is what drove the decision: as written, the second bet's settlement violates the unique constraint, the transaction aborts, the resumable settlement retries and fails again forever, the round never leaves `SETTLEMENT_PENDING`, and because of the partial unique index on live rounds **no further round can open — the game halts for every player**. A single multi-bet player would stop the platform.
**Impact**: `docs/POINTS_SYSTEM.md` §8 removes the `INSERT game_history row` step from the per-bet loop; round completion gains a projection step. `game_history` retains `UNIQUE (user_id, round_id)` and remains a rebuildable read model (ADR-020).

---

> ADR-025 was recorded on 2026-09-09 while **applying** the architecture review corrections.
> Still design-only — no Phase 2 code has been written.

---

## ADR-025: Bet API Specified As The Superset Of Both Submission Models

**Date**: 2026-09-09
**Decision**: Specify the `POST /bets` contract so it is correct whether the client sends one bet per chip placement or batches a round's selections into a single bet, and size the bet rate limit for the per-chip worst case (240/min per user). Do not decide the client's submission model; record it as client confirmation item 13.
**Context**: The architecture review found that no document stated whether each chip placement is an immediate server bet or whether selections are accumulated and submitted once per round. The reference UI shows no submit control (PLAY is a counter, not a button), which hints at immediate placement but confirms nothing. The previously specified rate limit of 30/min — one request every two seconds — would reject normal rapid play under the per-chip model.
**Alternatives**:
1. Assume per-chip placement and design for it
2. Assume batched submission and design for it
3. Block all bet-related work until the client answers
4. Specify the contract as the superset that is correct under either model, and size limits for the worst case
**Chosen approach**: Option 4.
**Why**: Options 1 and 2 would invent a product rule, which `AGENTS.md` and `RULES.md` both prohibit, and guessing wrong means reworking the API, the rate limits, and the history volume assumptions late — during frontend integration, the worst moment to discover it. Option 3 needlessly stalls steps 1–6, which do not depend on the answer at all. The superset is genuinely cheap here because the server already supports multiple bets per round (`bets` is unique on `(user_id, idempotency_key)`, not per round), settlement is already per bet, and `game_history` already aggregates per user per round after ADR-024 — so no schema or transaction change is required either way. Sizing the limit for the worst case is the safe asymmetry: if batching is later confirmed the limit can only be relaxed, whereas an under-sized limit silently breaks gameplay.
**Impact**: `docs/API_V2.md` §6 documents both models and marks the question `NEEDS CLIENT CONFIRMATION`; §10 raises the bet limit from 30/min to 240/min with the rationale. The answer now affects only client behaviour and rate-limit tuning, never the schema or transaction design, so it does not gate steps 1–6 of the implementation plan. Added as item 13 in `docs/CLIENT_REQUIREMENTS.md`.

---

> ADR-026 was recorded on 2026-09-15 during **Phase 2B runtime validation**.

---

## ADR-026: `@jito/shared` Package Output Format — CommonJS (not ESM)

**Date**: 2026-09-15
**Decision**: Set `packages/shared/tsconfig.json` `module` to `"CommonJS"` and `moduleResolution` to `"node"`, so `@jito/shared` emits CJS-compatible output. The prior value was `"ESNext"`.

**Context**: During Phase 2B runtime validation, `npm run dev:game-engine` failed with `ERR_MODULE_NOT_FOUND` when trying to `require('./validation')` inside `@jito/shared`'s compiled output. Root cause: the `ESNext` module target emitted `export {}` syntax (ESM) in `.js` files. Node v24's module resolver detected the ESM syntax but, because `@jito/shared/package.json` has no `"type": "module"` field, refused to load them. NestJS services load via CommonJS `require()` — they cannot consume ESM bare-specifier imports without `.js` extensions. The discrepancy was invisible during typecheck (`tsc --noEmit` never emits) and during Vitest (which uses its own transform). It only manifested at NestJS service bootstrap.

**Alternatives**:
1. Add `"type": "module"` to `packages/shared/package.json` and set `moduleResolution: "bundler"` — genuine ESM, but NestJS v10 + Node's CJS `require()` cannot import ESM without async dynamic import, breaking both services.
2. Dual-format packaging (CJS + ESM, two emit passes with `exports` map) — correct long-term, but no current consumer needs ESM output; overkill for current state.
3. Change `module` to `"CommonJS"` — matches what every current consumer already requires.

**Chosen approach**: Option 3.

**Why**: All current consumers of `@jito/shared` require CJS-compatible output: `services/api` and `services/game-engine` are NestJS apps running under Node's `require()`; `apps/web` and `apps/admin` (Next.js 14) bundle via webpack which handles CJS natively. No browser bundle imports `@jito/shared` directly. Setting `module: "ESNext"` was an incorrect configuration invisible until runtime. Option 3 is a correction, not a new direction. If a future consumer genuinely requires ESM output, dual-format packaging should be introduced at that point with its own ADR.

**Impact**: `packages/shared/tsconfig.json` `module` changed from `"ESNext"` to `"CommonJS"`. All five build targets verified: shared packages, API, game-engine, web (10/10 pages), admin (12/12 pages) — all PASS. Game Engine runtime no longer produces `ERR_MODULE_NOT_FOUND`.

---

> ADR-027 was recorded on 2026-09-15 during the **Phase 2B blocker fix**.

---

## ADR-027: Shared Sessions Table with XOR Ownership, and a Transactional Refresh Critical Section

**Date**: 2026-09-15

**Decision**: Player and admin sessions share one `sessions` table, with ownership expressed as `user_id` XOR `admin_id` enforced by the `chk_sessions_exactly_one_owner` CHECK constraint. Refresh rotation runs its `SELECT … FOR UPDATE` and **all** dependent writes inside a single Prisma interactive transaction, and the outcome is returned from that transaction rather than thrown, so the reuse-detection revocation commits before the 401 is raised.

**Context**: Phase 2B added admin authentication. Admin sessions need the same rotation, reuse detection and revocation semantics as player sessions. Separately, the first implementation took the row lock with a standalone `prisma.$queryRaw` outside any transaction; PostgreSQL committed that implicit single-statement transaction and released the lock immediately, so the lock did not cover the successor-insert and old-session-revoke writes. A Claude review proved against the live database that two concurrent refreshes with the same token both succeeded, leaving **two valid successor sessions** — breaking the single-successor invariant documented in `docs/AUTH_V2.md` §6.

**Alternatives**:
1. Separate `admin_sessions` table — duplicates the rotation/reuse/revocation logic and its tests.
2. Shared table with a nullable owner and no constraint — allows orphan and dual-owner rows.
3. Shared table with an XOR CHECK constraint, plus a single-transaction refresh critical section.
4. Serialize refresh at the application layer (mutex / advisory lock keyed by token hash) instead of a DB transaction.

**Chosen approach**: Option 3.

**Why**: One table means one rotation primitive — `AuthService.refresh()` and `createSession()` are shared by player login, player refresh and admin refresh, so a security fix lands in exactly one place and cannot drift between the two identity domains. The XOR CHECK makes "a session belonging to both a player and an admin" and "a session belonging to nobody" unrepresentable at the database level rather than relying on application discipline. Option 4 was rejected because an in-process mutex does not survive horizontal scaling of `services/api` (the API is explicitly designed to run N instances, ADR-017), whereas a row lock held inside a transaction is correct across every instance — PostgreSQL is already the authority for session state.

Returning the outcome instead of throwing inside the transaction is a deliberate, non-obvious detail: throwing would roll the transaction back, and the reuse path **must** persist its revocation. This is the difference between reuse detection that works and reuse detection that silently undoes itself.

**Impact**:
- `createSession()` and `revokeAllSessions()` take an optional `PrismaExecutor` (root client or `Prisma.TransactionClient`), defaulting to the root client — login paths are unchanged, refresh joins the caller's transaction. No logic is duplicated and no `any` is introduced.
- Admin refresh delegates to the same primitive, so both domains get the fix.
- Refresh now also re-reads the admin's real `role` inside the transaction; previously rotation downgraded the role claim to the literal `'admin'`, which is not a valid `AdminRole`.
- Verified after the fix: two concurrent refreshes with the same token leave **≤ 1** valid session; sequential rotation and sequential reuse detection are unchanged.
- **Note on ADR numbering**: `services/api/prisma/migrations/20260914000000_phase2b_auth/migration.sql` cites "ADR-026" for the session XOR design. That migration is already applied and its checksum is recorded in `_prisma_migrations`; editing the file would break Prisma's migration validation. The citation is therefore left as-is and corrected here — **the session-ownership decision is ADR-027, not ADR-026** (ADR-026 is the `@jito/shared` CommonJS decision). `schema.prisma` and `auth.service.ts` have been updated to cite ADR-027.
