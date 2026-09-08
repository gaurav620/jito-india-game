# JITO INDIA GAMES — AI Agent Instructions

> Read ALL 8 context files before starting any meaningful work.
> This file defines how AI agents should behave in this repository.

---

## 1. Mandatory Pre-Work Checklist

Before writing any code, every agent MUST:

1. Read `PRD.md` — understand what we're building
2. Read `AGENTS.md` — understand behavioral rules (this file)
3. Read `DESIGN.md` — understand the design system
4. Read `ARCHITECTURE.md` — understand system structure
5. Read `RULES.md` — understand coding standards
6. Read `MEMORY.md` — understand current project state
7. Read `DECISIONS.md` — understand past decisions
8. Read `TESTING.md` — understand testing requirements

---

## 2. Core Behavioral Rules

### DO

- **Plan before coding** — outline the change before implementing
- **Inspect existing code** before modifying anything
- **Make small, focused changes** before large refactors
- **Ask before destructive refactoring** — explain current vs proposed
- **Run tests** before considering work complete
- **Update `MEMORY.md`** after every meaningful development session
- **Append to `DECISIONS.md`** after every non-trivial decision
- **Update relevant docs** when architecture or APIs change
- **Mark unknowns** as `NEEDS CLIENT CONFIRMATION`
- **Document what changed, where, why** after every feature

### DO NOT

- Do NOT overwrite working systems blindly
- Do NOT delete working code without clear justification
- Do NOT invent business rules (payout rates, timing, commissions)
- Do NOT proceed with large architectural changes without documenting them
- Do NOT skip tests to save time
- Do NOT hardcode secrets or credentials
- Do NOT trust client-side calculations for authoritative state
- Do NOT create massive monolithic components
- Do NOT disable TypeScript strict mode
- Do NOT silently change game rules or formulas

---

## 3. Development Workflow

### For every feature:

```
1. Read context files
2. Inspect current implementation
3. Identify affected modules
4. Create implementation plan
5. Identify risks
6. Implement in small increments
7. Run tests
8. Update documentation
9. Update MEMORY.md
10. Add DECISIONS.md entry if appropriate
```

### For large refactors:

```
STOP.

Document:
- Current architecture
- Proposed architecture
- Affected files
- Risks
- Migration strategy

Wait for approval before proceeding.
```

---

## 4. Commands Reference

### Development

```bash
# Install all dependencies
npm install

# Start development servers
npm run dev:web          # Public website (Next.js)
npm run dev:admin        # Admin panel (Next.js)
npm run dev:api          # Backend API (NestJS)
npm run dev:game-engine  # Game engine service (NestJS)
```

### Build

```bash
npm run build            # Build shared packages
npm run build:web        # Build public website
npm run build:admin      # Build admin panel
npm run build:api        # Build API service
```

### Quality

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix lint issues
npm run typecheck        # TypeScript type checking
npm run format           # Format with Prettier
npm run format:check     # Check formatting
```

### Testing

```bash
npm run test             # Run unit tests (Vitest)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run E2E tests (Playwright)
```

### Maintenance

```bash
npm run clean            # Remove all build artifacts and node_modules
```

---

## 5. Documentation Discipline

For every meaningful feature, record:

| Field | Description |
|-------|-------------|
| WHAT | What changed |
| WHERE | Which files/modules |
| WHY | Business or technical reason |
| HOW | How it works |
| DEPENDENCIES | What it depends on |
| TESTS | What was tested |
| KNOWN ISSUES | Any remaining problems |
| NEXT STEP | What should happen next |

---

## 6. Coding Conventions Summary

See `RULES.md` for full details. Key points:

- TypeScript strict mode — always
- Named exports over default exports
- Functional components for React
- Feature-based folder organization
- All API endpoints validated with DTOs
- All database mutations in transactions where needed
- Server-authoritative game state — mandatory
- No magic numbers — use named constants

---

## 7. File Update Triggers

| Event | Update |
|-------|--------|
| Feature implemented | `MEMORY.md` |
| Bug fixed | `MEMORY.md` |
| Architecture changed | `ARCHITECTURE.md`, `MEMORY.md`, `DECISIONS.md` |
| API changed | `docs/API.md`, `docs/WEBSOCKET.md` |
| Database changed | `docs/DATABASE.md` |
| Non-trivial decision made | `DECISIONS.md` |
| Test strategy changed | `TESTING.md` |
| Design system updated | `DESIGN.md` |
