# JITO INDIA GAMES — Testing Strategy

> Version: 1.0 | Date: 2026-09-08

---

## 1. Testing Pyramid

```
         ┌───────────┐
         │   E2E     │  Few, critical flows
         │ Playwright│
         ├───────────┤
         │Integration│  API, WebSocket, DB
         │  Tests    │
         ├───────────┤
         │   Unit    │  Many, fast, isolated
         │  Vitest   │
         └───────────┘
```

---

## 2. Test Tooling

| Layer | Tool | Location |
|-------|------|----------|
| Unit | Vitest | `packages/**/*.test.ts`, `services/**/*.test.ts` |
| Integration | Vitest + Supertest | `services/**/*.integration.test.ts` |
| API | Vitest + Supertest | `tests/integration/` |
| WebSocket | Vitest + socket.io-client | `tests/integration/` |
| E2E | Playwright | `tests/e2e/` |
| Visual regression | Playwright screenshots | `tests/e2e/` |
| Performance | k6 or Artillery | `tests/performance/` |
| Load | k6 | `tests/performance/` |

---

## 3. Running Tests

```bash
# Unit tests
npm run test                  # All unit tests
npm run test:watch            # Watch mode
npm run test:coverage         # With coverage report

# E2E tests
npm run test:e2e              # All E2E tests

# Specific package
npx vitest run --project packages/types
npx vitest run --project services/api
```

---

## 4. Coverage Targets

| Scope | Target |
|-------|--------|
| `packages/types` | 100% |
| `packages/shared` | 90% |
| `packages/config` | 90% |
| `services/api` | 80% |
| `services/game-engine` | 85% |
| `packages/game-core` | 70% |
| Overall | 80% |

---

## 5. Unit Testing Guidelines

- Test all utility functions
- Test all validation logic
- Test state machine transitions
- Test calculation/formatting functions
- Mock external dependencies (database, Redis, HTTP)
- Each test should be independent and deterministic
- Use descriptive test names: `should reject bet when round is locked`

---

## 6. Integration Testing

### API Integration Tests

- Test complete request/response cycles
- Use test database (separate from development)
- Seed test data before each test suite
- Clean up after tests
- Test auth flows (login, token refresh, protected routes)
- Test error responses and validation

### WebSocket Integration Tests

- Test connection establishment with auth
- Test event publishing and receiving
- Test reconnection behavior
- Test invalid payloads
- Test concurrent connections

### Database Integration Tests

- Test migrations run cleanly
- Test transaction isolation
- Test constraint enforcement
- Test index performance for common queries

---

## 7. E2E Testing

### Critical Flows (Must Test)

1. **Registration** → Login → Lobby → See games
2. **Login** → Select game → Enter game → See countdown
3. **Place bet** → Wait for lock → See result → Check balance
4. **Full round lifecycle**: bet → lock → result → settlement → next round
5. **History**: Play game → Check game history → Verify details
6. **Report**: Play multiple games → View report → Verify data
7. **Logout** → Attempt protected route → Redirect to login

### Desktop-Specific

8. **Launch Electron app** → Login → Navigate lobby
9. **Fullscreen toggle** → Game plays correctly
10. **App restart** → Session preserved (or re-login)

### Android-Specific

11. **Launch app** → Login → Play game
12. **Orientation change** → UI adapts correctly
13. **App backgrounded** → Resume → Reconnect

---

## 8. Game-Specific Tests

### Timer Synchronization

- [ ] Client countdown matches server deadline
- [ ] Timer recovers after network delay
- [ ] Timer handles clock drift
- [ ] Timer handles browser/app backgrounding
- [ ] Timer handles reconnection mid-round

### Bet Validation

- [ ] Bets accepted during betting window
- [ ] Bets rejected after deadline
- [ ] Bets rejected with insufficient balance
- [ ] Duplicate bets handled correctly
- [ ] Maximum bet limits enforced (**NEEDS CLIENT CONFIRMATION**)
- [ ] Bet amounts validated (positive, within range)

### Round Lifecycle

- [ ] Round transitions through all states correctly
- [ ] No bets accepted after lock
- [ ] Result generated after lock period
- [ ] Settlement computed correctly
- [ ] Balance updated atomically
- [ ] History record created
- [ ] Next round starts automatically

### Settlement

- [ ] Winning bets settled correctly (**payout rates NEEDS CLIENT CONFIRMATION**)
- [ ] Losing bets settled correctly
- [ ] No duplicate settlements
- [ ] Settlement transaction is atomic
- [ ] Balance never goes negative from settlement

---

## 9. Security Testing

- [ ] SQL injection attempts blocked
- [ ] XSS payloads sanitized
- [ ] CSRF protection active
- [ ] Auth tokens expire correctly
- [ ] Rate limiting works on auth endpoints
- [ ] Admin routes inaccessible to regular users
- [ ] WebSocket connections require valid auth
- [ ] Sensitive data not exposed in error responses

---

## 10. Performance Testing

| Metric | Target | Tool |
|--------|--------|------|
| API response (p95) | <200ms | k6 |
| WebSocket latency | <100ms | k6 |
| Concurrent users | 1000+ | k6 |
| Game FPS | 60fps | Lighthouse / manual |
| Time to interactive | <3s | Lighthouse |
| Memory usage (client) | <512MB | Chrome DevTools |

---

## 11. Installer Testing

### Windows (Electron)

- [ ] Installer runs without admin (if possible)
- [ ] Install to default path
- [ ] Uninstall removes all files
- [ ] Auto-update downloads and applies correctly
- [ ] App launches after install
- [ ] App launches after update

### Android (Capacitor)

- [ ] APK installs on Android 8+
- [ ] App permissions requested correctly
- [ ] App runs in foreground/background
- [ ] App handles process kill and restart

---

## 12. Manual QA Checklist

> Run through before every release.

### Authentication

- [ ] Login with valid credentials
- [ ] Login with invalid credentials → error message
- [ ] Logout → session cleared
- [ ] Session expiry → forced re-login
- [ ] Register new account
- [ ] Password validation rules

### Lobby

- [ ] All games visible with correct info
- [ ] Game status displayed (active/inactive)
- [ ] Play button launches game

### Game Play

- [ ] Countdown timer visible and accurate
- [ ] Chips selectable
- [ ] Bets placeable on Singles/Doubles/Triples
- [ ] Random Pick works
- [ ] Double works
- [ ] Repeat works
- [ ] Clear works
- [ ] Play total updates correctly
- [ ] "NO MORE PLAY" displayed at deadline
- [ ] All inputs locked after deadline
- [ ] Wheel spins and lands on result
- [ ] Winning numbers highlighted
- [ ] Win total displays correctly
- [ ] Balance updates after settlement

### Post-Game

- [ ] Game History shows recent rounds
- [ ] Report displays correct data
- [ ] Results match what was displayed

### Error Recovery

- [ ] Network disconnect → reconnect → state recovers
- [ ] App restart → re-login → state correct
- [ ] Rapid repeated bets handled without duplicates
- [ ] Slow network → UI remains responsive (loading states)
