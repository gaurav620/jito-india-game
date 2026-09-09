# JITO INDIA GAMES — Product Requirements Document

> Version: 1.0 | Date: 2026-09-08 | Status: DRAFT

---

## 1. Problem Statement

The existing JITO INDIA Games platform is built on a legacy PHP-based system that
suffers from lag, UI performance problems, difficult maintenance, aging architecture,
and increasing difficulty making reliable changes. The client requires a complete
rebuild from zero using modern technologies.

### Existing System Problems

- Lag and poor responsiveness
- UI rendering performance issues
- Difficult to maintain codebase
- Difficult to add new features
- Recurring bugs from legacy dependencies
- Aging architecture limits development flexibility
- Poor developer experience

---

## 2. Target Users

### Player (Primary)

- Plays Triple Chance Timer and Triple Chance Pro Timer games
- Accesses via Windows PC or Android device
- Expects fast, responsive, lag-free experience
- Familiar with the existing game interface and flow
- Needs clear betting interface, real-time countdown, and instant results

### Admin / Operator

- Manages users, wallets/points, game rounds, reports
- Monitors game activity and system health
- Accesses via web-based admin panel
- Needs audit trails and operational controls

### System Administrator

- Manages deployments, infrastructure, monitoring
- Configures game parameters and system settings
- Needs logging, metrics, and alerting

---

## 3. Product Goals

1. Replace the legacy PHP platform with a modern, performant system
2. Eliminate lag — target <100ms UI response times
3. Preserve the existing user experience and game flow
4. Support Windows PC and Android platforms
5. Server-authoritative architecture for game integrity
6. Auditable wallet/points system
7. Scalable infrastructure on AWS
8. Maintainable, testable codebase

---

## 4. MVP / V1 Scope

### V1 Games

1. **Triple Chance Timer** — Countdown-based draw game with singles/doubles/triples betting
2. **Triple Chance Pro Timer** — Enhanced variant of Triple Chance Timer

### V1 Platforms

1. **Windows PC** — Electron desktop application
2. **Android** — Capacitor mobile application

### V1 Web Surfaces

1. **Public Website** — Landing page, downloads, company info
2. **Authentication** — Login, registration, session management
3. **Game Lobby** — Game selection and launch
4. **Admin Panel** — User/game/wallet management
5. **Download Management** — Installer distribution
6. **Reports / History** — Game history and reporting

### V1 Features

- User registration and authentication
- Secure login/logout with session management
- Game lobby with game cards
- Real-time countdown timer (server-synced)
- Betting interface: Singles, Doubles, Triples
- Chip denomination selector
- Action buttons: Random Pick, Double, Repeat, Clear
- Central multi-ring wheel animation
- Result display and settlement
- Play total / Win total display
- Game History view
- Report view
- Wallet/points balance management
- Admin dashboard
- Admin user management
- Admin game round management
- Admin reports

---

## 5. Game Visual Elements

The Triple Chance game family contains these visual elements:

- Countdown timer
- Singles grid
- Doubles grid
- Triples grid
- Central multi-ring wheel
- Number grids
- Chip denomination selector
- Random Pick button
- Double button
- Repeat button
- Info button
- Clear button
- Play total display
- Win total display
- Game History panel
- Report panel
- Betting state indicator
- No More Play state indicator
- Result/winning highlight state

> [!IMPORTANT]
> **NEEDS CLIENT CONFIRMATION**: Exact game mathematics, payout rates, RNG requirements,
> timing rules, commission calculations, and winning formulas must NOT be invented.
> All unknown business rules are documented and marked for client confirmation.

---

## 6. Authentication Requirements

- Login with credentials
- User registration
- Forgot password (if supported — **NEEDS CLIENT CONFIRMATION**)
- Server-backed session management
- Secure credential storage (hashed passwords)
- JWT-based authentication tokens
- Session expiry and refresh
- Logout

---

## 7. Performance Requirements

> Primary client complaint: LAG

| Metric | Target |
|--------|--------|
| UI frame rate | 60 FPS |
| API response time | <200ms (p95) |
| WebSocket latency | <100ms |
| Time to interactive | <3s |
| Reconnect time | <2s |
| Installer launch time | <5s |
| Memory usage (client) | <512MB |

---

## 8. Security Requirements

- HTTPS everywhere
- Password hashing (bcrypt/argon2)
- Input validation on all endpoints
- Authorization on all protected routes
- Rate limiting on auth endpoints
- Audit logging for admin actions
- WAF protection
- Secure HTTP headers
- SQL injection protection (parameterized queries)
- XSS protection
- CSRF strategy
- WebSocket authorization
- Idempotency for financial operations
- No secrets in source code

---

## 9. Scalability Requirements

- Horizontal scaling via ECS/Fargate
- Database connection pooling
- Redis caching for hot data
- CDN for static assets
- Stateless application servers
- WebSocket connection management at scale

---

## 10. Success Metrics

1. Zero lag complaints from existing user base
2. Feature parity with legacy system
3. <1% error rate in production
4. 99.9% uptime target
5. Successful migration of all existing users
6. Positive client UAT signoff

---

## 11. Future Scope (Post-V1)

- Additional game types
- iOS platform
- Advanced analytics and fraud detection
- Multi-language support
- Push notifications
- Tournament/competition modes
- Social features
- Advanced admin role-based permissions

---

## 12. Explicitly Out of Scope

- iOS application (V1 targets Windows + Android only)
- Payment gateway integration — **CONFIRMED OUT OF SCOPE, PERMANENTLY.** The platform is strictly points-based: no payment gateway, Razorpay, Stripe, UPI, deposit, withdrawal, cashout, or real-money wallet. Adding any of these requires a new client-confirmed ADR (ADR-011).
- Social features
- Chat/messaging system
- Third-party game integration
- Multi-tenant architecture
- White-labeling

---

## 13. Client Confirmations Needed

| # | Question | Impact |
|---|----------|--------|
| 1 | Exact countdown durations for each game variant | Game engine timing |
| 2 | Payout multipliers for Singles, Doubles, Triples | Settlement logic |
| 3 | RNG algorithm requirements or certification needs | Result generation |
| 4 | ~~Wallet: real money vs points? Deposit/withdrawal rules?~~ **CONFIRMED: POINTS ONLY.** No payment gateway, deposit, withdrawal, cashout, or real-money wallet (ADR-011). | Resolved — see `docs/POINTS_SYSTEM.md` |
| 5 | Registration fields: phone/email/both? KYC? | Auth system |
| 6 | Admin role levels and permissions | Admin panel |
| 7 | Legacy database format and schema | Migration plan |
| 8 | Android distribution: Play Store or direct APK? | Build pipeline |
| 9 | Commission/rake structure | Settlement logic |
| 10 | Maximum bet limits per round | Bet validation |
| 11 | Minimum/maximum wallet balance | Wallet constraints |
| 12 | Game operating hours or 24/7? | Game scheduling |
| 13 | Number of concurrent users expected | Infrastructure sizing |
