# JITO INDIA GAMES

> A modern cross-platform gaming platform replacing the legacy PHP-based JITO INDIA Games system.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-UNLICENSED-red.svg)]()

---

## Overview

JITO INDIA GAMES is a complete rebuild of the legacy gaming platform, targeting:

- **Windows PC** — Electron desktop application
- **Android** — Capacitor mobile application
- **Web** — Public website + Admin panel

### V1 Games

1. **Triple Chance Timer** — Countdown-based draw game
2. **Triple Chance Pro Timer** — Enhanced variant

---

## Architecture

```
         Website / Desktop / Mobile
                    │
              Login / Auth
                    │
               Game Lobby
                    │
         ┌──────────┴──────────┐
   Triple Chance       Triple Chance
      Timer              Pro Timer
         └──────────┬──────────┘
                    │
           REST API + WebSocket
                    │
              NestJS Backend
                    │
         ┌──────────┼──────────┐
      PostgreSQL   Redis      S3/CDN
```

**Server-authoritative**: The server determines all game results, validates bets, manages balances, and controls round state. The client handles rendering, input, and animation only.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Game Engine | Phaser 3, TypeScript |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL (AWS RDS) |
| Cache | Redis (AWS ElastiCache) |
| Desktop | Electron |
| Mobile | Capacitor |
| Infrastructure | AWS (ECS, CloudFront, WAF, CloudWatch) |
| CI/CD | GitHub Actions, Docker |

---

## Repository Structure

```
├── apps/
│   ├── web/              # Next.js public website
│   ├── admin/            # Next.js admin panel
│   ├── desktop/          # Electron Windows app
│   └── mobile/           # Capacitor Android app
│
├── services/
│   ├── api/              # NestJS REST API + WebSocket
│   └── game-engine/      # Game state machine service
│
├── packages/
│   ├── types/            # Shared TypeScript types
│   ├── shared/           # Shared utilities
│   ├── config/           # Shared configuration
│   ├── ui/               # Shared React components
│   └── game-core/        # Phaser game core
│
├── assets/               # Branding, game assets, sounds
├── docs/                 # Detailed documentation
└── tests/                # E2E, integration, performance tests
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **npm** 10+ (comes with Node.js)
- **Git**

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd jito-game

# Install all dependencies
npm install

# Build shared packages
npm run build

# Copy environment template
cp .env.example .env
# Edit .env with your local values
```

---

## Commands

### Development

```bash
npm run dev:web          # Start public website
npm run dev:admin        # Start admin panel
npm run dev:api          # Start backend API
npm run dev:game-engine  # Start game engine service
```

### Build

```bash
npm run build            # Build shared packages (types, config, shared)
npm run build:web        # Build public website
npm run build:admin      # Build admin panel
npm run build:api        # Build API service
```

### Quality

```bash
npm run lint             # Run ESLint (zero warnings allowed)
npm run lint:fix         # Auto-fix lint issues
npm run typecheck        # TypeScript type checking
npm run format           # Format with Prettier
npm run format:check     # Check formatting without modifying
```

### Testing

```bash
npm run test             # Run all unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run with coverage report
npm run test:e2e         # Run E2E tests
```

### Maintenance

```bash
npm run clean            # Remove node_modules and build artifacts
```

---

## Documentation

### Root Context Files

| File | Description |
|------|-------------|
| [PRD.md](./PRD.md) | Product requirements |
| [AGENTS.md](./AGENTS.md) | AI agent instructions |
| [DESIGN.md](./DESIGN.md) | Design system |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture |
| [RULES.md](./RULES.md) | Coding standards |
| [MEMORY.md](./MEMORY.md) | Project state diary |
| [DECISIONS.md](./DECISIONS.md) | Architecture decisions |
| [TESTING.md](./TESTING.md) | Testing strategy |

### Detailed Documentation (`docs/`)

| File | Description |
|------|-------------|
| [GAME_RULES.md](./docs/GAME_RULES.md) | Game rules and mechanics |
| [GAME_STATE_MACHINE.md](./docs/GAME_STATE_MACHINE.md) | Round state machine |
| [API.md](./docs/API.md) | REST API specification |
| [WEBSOCKET.md](./docs/WEBSOCKET.md) | WebSocket events |
| [DATABASE.md](./docs/DATABASE.md) | Database schema |
| [AUTH.md](./docs/AUTH.md) | Authentication system |
| [WALLET.md](./docs/WALLET.md) | Wallet/points system |
| [ADMIN.md](./docs/ADMIN.md) | Admin panel spec |
| [DESKTOP.md](./docs/DESKTOP.md) | Electron desktop app |
| [ANDROID.md](./docs/ANDROID.md) | Capacitor mobile app |
| [AWS.md](./docs/AWS.md) | AWS infrastructure |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Deployment pipeline |
| [SECURITY.md](./docs/SECURITY.md) | Security requirements |
| [UI_SPEC.md](./docs/UI_SPEC.md) | UI specification |
| [ASSET_PIPELINE.md](./docs/ASSET_PIPELINE.md) | Asset management |
| [CLIENT_REQUIREMENTS.md](./docs/CLIENT_REQUIREMENTS.md) | Client requirement tracker |
| [MIGRATION.md](./docs/MIGRATION.md) | Legacy migration plan |
| [QA_CHECKLIST.md](./docs/QA_CHECKLIST.md) | QA checklist |

---

## Development Workflow

1. Read context files (`PRD.md`, `AGENTS.md`, `ARCHITECTURE.md`, etc.)
2. Create feature branch: `feature/description`
3. Implement changes
4. Run `npm run lint && npm run typecheck && npm run test`
5. Update `MEMORY.md` and `DECISIONS.md` as appropriate
6. Create pull request

---

## Project Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Repository + Documentation + Architecture | ✅ Complete |
| 1 | Branding + Design System | ⬜ Not started |
| 2 | Website + Downloads | ⬜ Not started |
| 3 | Authentication | ⬜ Not started |
| 4 | Lobby | ⬜ Not started |
| 5 | Game Core | ⬜ Not started |
| 6 | Backend / API | ⬜ Not started |
| 7 | WebSocket / Live Game Engine | ⬜ Not started |
| 8 | Triple Chance Timer | ⬜ Not started |
| 9 | Triple Chance Pro Timer | ⬜ Not started |
| 10 | Admin Panel | ⬜ Not started |
| 11 | Windows Packaging | ⬜ Not started |
| 12 | Android Packaging | ⬜ Not started |
| 13 | AWS Deployment | ⬜ Not started |
| 14 | QA / UAT | ⬜ Not started |
| 15 | Production Rollout | ⬜ Not started |

---

## License

UNLICENSED — Private project for JITO INDIA.
