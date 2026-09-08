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
