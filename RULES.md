# JITO INDIA GAMES — Coding Rules & Standards

> All agents and developers must follow these rules.

---

## 1. TypeScript

- **Strict mode**: Always enabled (`strict: true`)
- **No `any`**: Avoid `any` — use `unknown` and narrow with type guards
- **Consistent type imports**: Use `import type { X }` for type-only imports
- **Explicit return types**: Required for exported functions and API handlers
- **No assertions**: Avoid `as` casts — prefer type narrowing
- **No non-null assertions**: Avoid `!` — handle null/undefined explicitly

---

## 2. Naming Conventions

### Files & Folders

| Type | Convention | Example |
|------|-----------|---------|
| Component files | PascalCase | `GameLobby.tsx` |
| Utility files | camelCase | `formatCurrency.ts` |
| Type files | camelCase | `gameTypes.ts` |
| Test files | `*.test.ts` | `wallet.test.ts` |
| Constants | camelCase file, SCREAMING_SNAKE values | `gameConstants.ts` → `MAX_BET_AMOUNT` |
| CSS modules | camelCase | `gameLobby.module.css` |
| Folders | kebab-case | `game-core/`, `triple-chance/` |

### Code

| Type | Convention | Example |
|------|-----------|---------|
| Variables | camelCase | `roundId`, `currentBalance` |
| Functions | camelCase | `calculatePayout()`, `validateBet()` |
| Classes | PascalCase | `GameEngine`, `WalletService` |
| Interfaces | PascalCase (no I prefix) | `User`, `GameRound` |
| Enums | PascalCase + PascalCase members | `GameState.BettingOpen` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PLAYERS`, `ROUND_DURATION_MS` |
| Types | PascalCase | `BetPayload`, `RoundResult` |
| React components | PascalCase | `<ChipSelector />` |
| React hooks | camelCase with `use` prefix | `useGameState()` |
| Event handlers | camelCase with `handle/on` prefix | `handleBetPlace()`, `onRoundStart()` |

---

## 3. Folder Conventions

### Feature-based Organization

```
feature/
├── components/       # UI components for this feature
├── hooks/           # Custom hooks
├── services/        # API calls, business logic
├── types.ts         # Feature-specific types
├── constants.ts     # Feature-specific constants
├── utils.ts         # Feature-specific utilities
└── index.ts         # Public exports
```

### Export Rules

- Use **named exports** — avoid default exports (except Next.js pages)
- Every folder with multiple files should have an `index.ts` barrel export
- Do not re-export types from barrel files unnecessarily

---

## 4. Component Rules (React)

- Functional components only — no class components
- Props interface defined above component
- Destructure props in function signature
- One component per file (co-located small sub-components allowed)
- Keep components under 200 lines — extract if larger
- Use composition over prop drilling

---

## 5. API Conventions (NestJS)

### Endpoints

| Method | Purpose | Naming |
|--------|---------|--------|
| GET | Read | `/api/v1/resource` |
| POST | Create | `/api/v1/resource` |
| PATCH | Partial update | `/api/v1/resource/:id` |
| PUT | Full replace | `/api/v1/resource/:id` |
| DELETE | Remove | `/api/v1/resource/:id` |

### Rules

- All endpoints prefixed with `/api/v1/`
- Request validation via DTOs with `class-validator`
- Response DTOs for consistent shape
- Proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Error responses follow standard format:
  ```json
  {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": [{ "field": "amount", "message": "Must be positive" }]
  }
  ```

---

## 6. Database Conventions

### Naming

| Type | Convention | Example |
|------|-----------|---------|
| Tables | snake_case, plural | `game_rounds`, `wallet_transactions` |
| Columns | snake_case | `created_at`, `round_id`, `bet_amount` |
| Primary keys | `id` (UUID) | `id UUID PRIMARY KEY` |
| Foreign keys | `{table_singular}_id` | `user_id`, `round_id` |
| Indexes | `idx_{table}_{columns}` | `idx_bets_round_id` |
| Timestamps | `created_at`, `updated_at` | Auto-managed |

### Rules

- Use UUIDs for primary keys
- Always include `created_at` and `updated_at`
- Use migrations for schema changes — never modify directly
- All financial mutations wrapped in database transactions
- Use parameterized queries — never interpolate user input into SQL

---

## 7. Error Handling

- Catch errors at appropriate boundaries
- Log errors with context (userId, roundId, action)
- Return user-friendly messages — never expose stack traces
- Use custom exception classes for domain errors
- Propagate errors up — don't swallow silently
- Distinguish between recoverable and fatal errors

---

## 8. Validation

- Validate ALL user input on the server
- Client-side validation is UX only — never trust it
- Use DTOs with decorators for API validation
- Validate WebSocket payloads before processing
- Sanitize all string inputs
- Validate numeric ranges (bet amounts, quantities)

---

## 9. Logging

- Structured JSON logging in production
- Log levels: `error`, `warn`, `info`, `debug`
- Include context: `userId`, `roundId`, `action`, `timestamp`
- Do NOT log sensitive data (passwords, tokens, full card numbers)
- Log all admin actions for audit
- Log game state transitions

---

## 10. Security Rules

- HTTPS everywhere
- JWT stored in httpOnly cookies or secure storage
- Passwords hashed with bcrypt (min 12 rounds)
- Rate limit auth endpoints (5 attempts / 15 min)
- CORS configured per environment
- Content Security Policy headers
- No `eval()` or `innerHTML` with user data
- Electron: `nodeIntegration: false`, `contextIsolation: true`

---

## 11. Testing Rules

- Unit tests for all utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Test files co-located with source: `feature.test.ts`
- Minimum coverage target: 80% for packages, 60% for services
- All tests must pass before merging
- No `.skip` tests in main branch

---

## 12. Git Workflow

### Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `feature/*` | Feature development |
| `bugfix/*` | Bug fixes |
| `hotfix/*` | Production emergency fixes |
| `release/*` | Release preparation |

### Commit Convention (Conventional Commits)

```
type(scope): description

feat(game): add countdown timer synchronization
fix(wallet): prevent duplicate settlement
docs(api): update WebSocket event documentation
refactor(auth): extract token validation middleware
test(game): add round lifecycle integration tests
chore(deps): update TypeScript to 5.4
```

### Pull Request Rules

- Descriptive title following commit convention
- Link related issues
- Include testing evidence
- No unresolved conversations
- All CI checks pass
- At least one approval (when team grows)

---

## 13. NEVER Do These

- ❌ Hardcode secret keys or credentials
- ❌ Commit `.env` files
- ❌ Trust client-generated game results
- ❌ Trust client wallet balances
- ❌ Trust client timestamps for authoritative state
- ❌ Duplicate business logic across client and server
- ❌ Create components over 300 lines
- ❌ Use magic numbers without named constants
- ❌ Disable TypeScript strict mode or use `@ts-ignore`
- ❌ Ignore or skip failing tests
- ❌ Modify unrelated modules in the same PR
- ❌ Silently change game rules or formulas
- ❌ Use `console.log` in production code (use logger)
- ❌ Store state in global variables
- ❌ Use synchronous file I/O in request handlers
