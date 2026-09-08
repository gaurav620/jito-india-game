# JITO INDIA GAMES — System Architecture

> Version: 1.0 | Date: 2026-09-08

---

## 1. High-Level Architecture

```
                         ┌─────────────────────┐
                         │    JITOINDIA.COM     │
                         │   (CloudFront CDN)   │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
              │  Windows   │  │  Android  │  │    Web     │
              │  Electron  │  │ Capacitor │  │  Browser   │
              └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                              ┌─────┴─────┐
                              │   Login    │
                              │   / Auth   │
                              └─────┬─────┘
                                    │
                              ┌─────┴─────┐
                              │   Game     │
                              │   Lobby    │
                              └─────┬─────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │                               │
          ┌─────────┴─────────┐         ┌──────────┴──────────┐
          │ Triple Chance     │         │ Triple Chance Pro   │
          │ Timer             │         │ Timer               │
          └─────────┬─────────┘         └──────────┬──────────┘
                    │                               │
                    └───────────────┼───────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │  REST API     │  WebSocket    │
                    └───────────────┼───────────────┘
                                    │
                         ┌──────────┴──────────┐
                         │   NestJS Backend    │
                         │   (ECS / Fargate)   │
                         └──────────┬──────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
  ┌───────┴───────┐       ┌────────┴────────┐       ┌───────┴───────┐
  │  Auth Service │       │  Game Engine    │       │ Wallet/Points │
  │               │       │                │       │  Service      │
  └───────┬───────┘       └────────┬────────┘       └───────┬───────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │                               │
              ┌─────┴─────┐                  ┌─────┴─────┐
              │ PostgreSQL │                  │   Redis   │
              │ (AWS RDS)  │                  │(Elasti-   │
              │            │                  │  Cache)   │
              └────────────┘                  └───────────┘
```

---

## 2. Application Boundaries

### Frontend Applications

| App | Tech | Port | Description |
|-----|------|------|-------------|
| `apps/web` | Next.js | 3000 | Public website, landing, downloads |
| `apps/admin` | Next.js | 3002 | Admin panel for operators |
| `apps/desktop` | Electron | — | Windows PC application |
| `apps/mobile` | Capacitor | — | Android application |

### Backend Services

| Service | Tech | Port | Description |
|---------|------|------|-------------|
| `services/api` | NestJS | 3001 | REST API + WebSocket gateway |
| `services/game-engine` | NestJS | 3003 | Game state machine, round lifecycle |

### Shared Packages

| Package | Description |
|---------|-------------|
| `packages/types` | Shared TypeScript interfaces and enums |
| `packages/shared` | Shared utilities and helpers |
| `packages/config` | Shared configuration and constants |
| `packages/ui` | Shared React UI components |
| `packages/game-core` | Phaser game core (rendering, animations) |

---

## 3. Folder Structure

```
jito-game/
├── PRD.md                    # Product requirements
├── AGENTS.md                 # AI agent instructions
├── DESIGN.md                 # Design system
├── ARCHITECTURE.md           # This file
├── RULES.md                  # Coding standards
├── MEMORY.md                 # Project diary
├── DECISIONS.md              # Decision log
├── TESTING.md                # Testing strategy
├── README.md                 # Project overview
│
├── docs/                     # Detailed documentation
│   ├── GAME_RULES.md
│   ├── GAME_STATE_MACHINE.md
│   ├── API.md
│   ├── WEBSOCKET.md
│   ├── DATABASE.md
│   ├── AUTH.md
│   ├── WALLET.md
│   ├── ADMIN.md
│   ├── DESKTOP.md
│   ├── ANDROID.md
│   ├── AWS.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   ├── UI_SPEC.md
│   ├── ASSET_PIPELINE.md
│   ├── CLIENT_REQUIREMENTS.md
│   ├── MIGRATION.md
│   └── QA_CHECKLIST.md
│
├── apps/
│   ├── web/                  # Next.js public website
│   │   ├── src/
│   │   │   ├── app/          # App router pages
│   │   │   ├── components/   # Page-specific components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── lib/          # Utilities, API client
│   │   │   └── styles/       # CSS/Tailwind
│   │   ├── public/           # Static assets
│   │   └── package.json
│   │
│   ├── admin/                # Next.js admin panel
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   ├── desktop/              # Electron Windows app
│   │   ├── src/
│   │   │   ├── main/         # Main process
│   │   │   ├── preload/      # Preload scripts
│   │   │   └── renderer/     # Renderer (loads game)
│   │   └── package.json
│   │
│   └── mobile/               # Capacitor Android app
│       ├── src/
│       ├── android/
│       └── package.json
│
├── services/
│   ├── api/                  # NestJS REST + WebSocket
│   │   ├── src/
│   │   │   ├── auth/         # Auth module
│   │   │   ├── users/        # Users module
│   │   │   ├── wallet/       # Wallet module
│   │   │   ├── games/        # Games module
│   │   │   ├── admin/        # Admin module
│   │   │   ├── common/       # Shared guards, pipes, filters
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── game-engine/          # Game state management
│       ├── src/
│       │   ├── rounds/       # Round lifecycle
│       │   ├── bets/         # Bet validation
│       │   ├── results/      # Result generation
│       │   ├── settlement/   # Settlement processing
│       │   └── main.ts
│       └── package.json
│
├── packages/
│   ├── types/                # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── user.ts
│   │   │   ├── game.ts
│   │   │   ├── wallet.ts
│   │   │   ├── websocket.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── shared/               # Shared utilities
│   │   ├── src/
│   │   │   ├── validation.ts
│   │   │   ├── formatting.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── config/               # Shared configuration
│   │   ├── src/
│   │   │   ├── constants.ts
│   │   │   ├── environment.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ui/                   # Shared React components & Design System
│   │   ├── src/
│   │   │   ├── components/   # Button, Input, Modal, Chip, GridCell, Countdown, Table, Tabs, etc.
│   │   │   ├── styles/       # Tokens, OrnateFrame (baroque gold filigree)
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── game-core/            # Phaser 3 & Canvas game rendering engine
│       ├── src/
│       │   ├── types.ts          # Wheel animation state types
│       │   ├── wheel-renderer.ts # Pure mathematical wheel engine
│       │   ├── phaser-container.tsx # 3-ring concentric wheel React container
│       │   └── index.ts
│       └── package.json
│
├── assets/
│   ├── branding/             # Logos, brand marks
│   ├── game/                 # Game textures, sprites
│   ├── sounds/               # Sound effects, music
│   ├── animations/           # Animation assets
│   └── reference/            # Reference screenshots/videos
│
└── tests/                    # Cross-cutting test suites
    ├── e2e/
    ├── integration/
    └── performance/
```

---

## 4. Data Flow

### Game Round Lifecycle

```
Server                                      Client
  │                                           │
  │──── game.round.started ──────────────────>│
  │     { roundId, startTime, deadline }      │ Start countdown
  │                                           │
  │<──── POST /bets ─────────────────────────│
  │      { roundId, bets[] }                  │ Place bets
  │──── game.bet.accepted ───────────────────>│
  │     { betId, updatedBalance }             │ Confirm bet
  │                                           │
  │──── game.betting.locked ─────────────────>│
  │     { roundId }                           │ Lock UI
  │                                           │
  │  [Server generates result]                │
  │                                           │
  │──── game.result.published ───────────────>│
  │     { roundId, result, winningNumbers }   │ Show result
  │                                           │
  │──── game.settlement.completed ───────────>│
  │     { roundId, settlements[], balance }   │ Update balance
  │                                           │
  │──── game.round.completed ────────────────>│
  │     { roundId, nextRoundId }              │ Prepare next
  │                                           │
```

### Authentication Flow

```
Client                    API                     Database
  │                        │                        │
  │── POST /auth/login ───>│                        │
  │   { username, pass }   │── validate ───────────>│
  │                        │<── user record ────────│
  │                        │                        │
  │                        │── generate JWT ──>     │
  │                        │── create session ─────>│
  │                        │                        │
  │<── { token, refresh }──│                        │
  │                        │                        │
  │── GET /me ────────────>│                        │
  │   Authorization: JWT   │── verify JWT ──>       │
  │                        │── fetch user ─────────>│
  │<── { user } ──────────│<── user data ──────────│
  │                        │                        │
```

---

## 5. Tech Stack Rationale

| Technology | Purpose | Why Chosen |
|-----------|---------|------------|
| Next.js | Web frontend | SSR, file routing, React ecosystem, TypeScript native |
| Phaser 3 | Game rendering | Industry-standard 2D game engine, WebGL, animation system |
| NestJS | Backend | Modular architecture, TypeScript native, WebSocket support, enterprise patterns |
| PostgreSQL | Database | ACID compliance, JSON support, mature, AWS RDS available |
| Redis | Cache/realtime | Sub-millisecond latency, pub/sub for realtime coordination |
| Electron | Desktop | Cross-platform desktop, Chromium for web tech, auto-updates |
| Capacitor | Mobile | Native mobile from web codebase, Cordova plugin compatibility |
| Tailwind CSS | Styling | Rapid UI development, design system tokens, purge unused CSS |
| TypeScript | Language | Type safety across entire stack, better tooling, fewer bugs |
| AWS | Infrastructure | Scalable, managed services, CDN, WAF, monitoring |

---

## 6. Server-Authoritative Architecture

> This is a **mandatory architectural principle**.

### Server Controls

- Round state and transitions
- Betting deadlines (server timestamp)
- Bet validation and acceptance
- Result generation
- Settlement and balance mutations
- Transaction integrity
- Game history and audit trail

### Client Responsibilities

- Rendering and UI updates
- User input capture
- Animation playback
- Local countdown interpolation (from server deadline)
- Visual state synchronization
- Reconnection handling

### Client NEVER Determines

- Final game result
- Official countdown deadline
- Bet validity
- Settlement amounts
- Wallet balance
- Official game state

---

## 7. Deployment Architecture (AWS)

```
                    ┌──────────────┐
                    │  Route 53    │
                    │  (DNS)       │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │ CloudFront   │
                    │ (CDN)        │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │    WAF       │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │    ALB       │
                    │ (Load Bal.)  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴────┐ ┌────┴─────┐ ┌────┴─────┐
        │ ECS Task │ │ ECS Task │ │ ECS Task │
        │ (API)    │ │ (API)    │ │ (Game    │
        │          │ │          │ │  Engine) │
        └─────┬────┘ └────┬─────┘ └────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              │                         │
        ┌─────┴─────┐            ┌─────┴─────┐
        │  RDS      │            │ ElastiCache│
        │ PostgreSQL│            │   Redis    │
        └───────────┘            └───────────┘
```

### Environments

| Environment | Purpose |
|-------------|---------|
| Development | Local development (Docker Compose) |
| Staging | Pre-production testing, UAT |
| Production | Live system |

---

## 8. Security Architecture

- JWT authentication with refresh tokens
- Role-based access control (user / admin)
- API rate limiting per user/IP
- WebSocket connection authentication
- Database parameterized queries (no raw SQL)
- Input validation on all endpoints (class-validator)
- HTTPS termination at ALB
- WAF rules for common attack patterns
- Audit logging for all admin operations
- Secrets managed via environment variables / AWS Secrets Manager

---

## 9. Monitoring & Observability

| Layer | Tool | Metrics |
|-------|------|---------|
| Application | CloudWatch Logs | Request logs, errors, game events |
| Infrastructure | CloudWatch Metrics | CPU, memory, network |
| APM | CloudWatch + custom | API latency, WebSocket latency |
| Alerts | CloudWatch Alarms | Error rate, latency p95, CPU threshold |
| Uptime | Route 53 Health Checks | Endpoint availability |

---

## 10. Disaster Recovery

- **Database**: Automated RDS backups, point-in-time recovery
- **Redis**: ElastiCache snapshots
- **Application**: Blue/green deployments via ECS
- **Static assets**: S3 versioning, cross-region replication (if needed)
- **Rollback**: ECS task definition revision rollback
- **RTO target**: <1 hour
- **RPO target**: <5 minutes
