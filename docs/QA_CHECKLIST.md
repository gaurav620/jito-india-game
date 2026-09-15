# JITO INDIA GAMES — QA Checklist

> Run through before every release. Mark items with ✅ or ❌.

---

## Pre-Release Checklist

### Build & Deploy
- [ ] `npm run lint` — zero errors
- [ ] `npm run typecheck` — zero errors
- [ ] `npm run test` — all pass
- [ ] `npm run build` — successful
- [ ] Docker images build successfully
- [ ] Staging deployment successful

### Authentication
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials → proper error
- [ ] Token refresh works
- [ ] Logout clears session
- [ ] Expired token → redirect to login

### Game Lobby
- [ ] All V1 games visible
- [ ] Game cards show correct info
- [ ] Play button launches correct game

### Game Play — Triple Chance Timer
- [ ] Countdown timer accurate (synced with server)
- [ ] All chip denominations selectable
- [ ] Bets placeable on singles
- [ ] Bets placeable on doubles
- [ ] Bets placeable on triples
- [ ] Play total updates correctly
- [ ] Random Pick works
- [ ] Double works
- [ ] Repeat works
- [ ] Clear works
- [ ] "NO MORE PLAY" at deadline
- [ ] All inputs locked after deadline
- [ ] Wheel animation plays
- [ ] Result displayed correctly
- [ ] Winning numbers highlighted
- [ ] Win total correct
- [ ] Balance updated after settlement

### Game Play — Triple Chance Pro Timer
- [ ] Same checklist as above
- [ ] Pro-specific features work (**NEEDS CLIENT CONFIRMATION**)

### History & Reports
- [ ] Game history shows recent rounds
- [ ] History details accurate
- [ ] Report data correct
- [ ] Pagination works

### Wallet
- [ ] Balance displays correctly
- [ ] Transaction history accurate
- [ ] Insufficient balance → proper error

### Error Recovery
- [ ] Network disconnect → reconnect → state recovers
- [ ] App restart → session check → appropriate redirect
- [ ] Slow network → loading states visible
- [ ] Duplicate bet submission → handled

### Desktop (Windows)
- [ ] Installer runs successfully
- [ ] App launches after install
- [ ] Fullscreen toggle works
- [ ] Auto-update works (if configured)
- [ ] Uninstall works

### Android
- [ ] APK installs on target devices
- [ ] App launches correctly
- [ ] Orientation handling works
- [ ] Touch interactions responsive
- [ ] Background/foreground transition

### Admin Panel
- [ ] Dashboard loads with data
- [ ] User list and search work
- [ ] User detail page loads
- [ ] Wallet adjustment works
- [ ] Game round history visible
- [ ] Reports generate correctly
- [ ] Audit logs recording

### Performance
- [ ] API response < 200ms (p95)
- [ ] Game FPS ≥ 55fps
- [ ] No memory leaks after 30min play
- [ ] WebSocket reconnects within 2s

### Security
- [ ] No sensitive data in browser console
- [ ] Admin routes protected from regular users
- [ ] Rate limiting active on auth endpoints
- [ ] HTTPS enforced
