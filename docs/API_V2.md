# JITO INDIA GAMES — REST API V2 (Phase 2)

> Version: 2.0 | Date: 2026-09-09 | Status: **PARTIALLY IMPLEMENTED**
> Supersedes `docs/API.md` for Phase 2 onward. All endpoints prefixed `/api/v1/`.
>
> **Implementation status by domain (as of 2026-09-15):**
> - §2 Authentication, §3 Users, §8.1 Admin authentication — **IMPLEMENTED and runtime-verified** (Phase 2B).
> - §4 Points, §5 Games & Rounds, §6 Bets, §7 History & Reports, and the remainder of §8 Admin — **PLANNED, NOT IMPLEMENTED.** These remain design specifications for Phase 2C and later.
>
> Do not read this document as a description of shipped behaviour outside the domains marked implemented above.

> **No payment endpoints exist.** There is no deposit, withdrawal, cashout, top-up, payment-method, or payment-webhook route, and none may be added without a client-confirmed ADR.

---

## 1. Conventions

- JSON only; `Content-Type: application/json`.
- Auth via `Authorization: Bearer <accessToken>` unless marked Public.
- All points values are **integer centipoints** with a `Minor` suffix (`docs/DATABASE_V2.md` §3). The API never sends or accepts decimal point values.
- All timestamps are ISO 8601 UTC.
- Request validation via `class-validator` DTOs; unknown properties are **stripped**, not ignored — `forbidNonWhitelisted` prevents a client from smuggling fields a future refactor might start reading.
- Every response carries `X-Request-Id` for correlation with logs.

### Response envelopes

```jsonc
// success
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }

// error
{ "success": false, "statusCode": 400, "code": "INSUFFICIENT_POINTS",
  "message": "Not enough points for this bet",
  "errors": [{ "field": "items[0].amountMinor", "message": "Must be positive" }],
  "requestId": "req_01J…" }
```

`code` is a stable machine-readable identifier. Clients branch on `code`, never on `message` — messages are for humans and may be reworded or localised at any time.

---

## 2. Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create a player account (+ its points account) |
| POST | `/auth/login` | Public | Issue access + refresh tokens |
| POST | `/auth/refresh` | Refresh token | Rotate tokens (reuse-detecting) |
| POST | `/auth/logout` | Bearer | Revoke current session |
| POST | `/auth/logout-all` | Bearer | Revoke all sessions |
| GET | `/auth/me` | Bearer | Current user + balance |

```jsonc
// POST /auth/register
{ "username": "pintu", "password": "…", "phone": "+91…", "email": "…", "displayName": "Pintu" }
// → 201 { "success": true, "data": { "user": { "id", "username", "displayName", "createdAt" } } }

// POST /auth/login
{ "username": "pintu", "password": "…" }
// → 200 { "accessToken", "refreshToken", "expiresIn": 900,
//         "user": { "id", "username", "displayName" }, "balanceMinor": 6470700 }
```

Login/registration failures are deliberately generic (`AUTH_INVALID_CREDENTIALS`) and never reveal whether the account exists (`docs/AUTH_V2.md` §3).

---

## 3. Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users/profile` | Bearer | Own profile |
| PATCH | `/users/profile` | Bearer | Update `displayName` (and contact, pending confirmation) |
| PATCH | `/users/password` | Bearer | Change password (requires current password) |

Changing a password revokes all other sessions but keeps the current one.

**There is no `/users/:id`.** Every player-scoped route resolves the user from the token, so cross-account access has no route to travel through (`docs/AUTH_V2.md` §9).

---

## 4. Points

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/points/balance` | Bearer | Current balance |
| GET | `/points/transactions` | Bearer | Own ledger, paginated, filterable by date and `referenceType` |

```jsonc
// GET /points/balance → 200
{ "success": true, "data": { "balanceMinor": 6470700, "updatedAt": "2026-09-09T10:15:00Z" } }
```

Read-only. **Points are only mutated by placing a bet, by settlement, or by an audited admin adjustment** — never by a player-facing write endpoint.

---

## 5. Games & Rounds

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/games` | Bearer | List active games |
| GET | `/games/:gameId` | Bearer | Game details + limits |
| GET | `/games/:gameId/current-round` | Bearer | Current round state — the REST equivalent of the WS snapshot |
| GET | `/games/:gameId/recent-results` | Bearer | Last N draws (history strip) |

```jsonc
// GET /games/triple-chance-timer/current-round → 200
{ "success": true, "data": {
  "round": { "roundId", "roundNumber": 658, "displayCode": "736TC658",
             "state": "BETTING_ACTIVE",
             "opensAt": "…", "bettingDeadline": "2026-09-09T10:16:30Z" },
  "serverTime": "2026-09-09T10:15:17Z",
  "drawValue": null,
  "myBets": [ … ],
  "balanceMinor": 6470700 } }
```

This endpoint is the **reconnect and cold-start path** (`docs/WEBSOCKET_V2.md` §9) and the polling fallback when WebSockets are unavailable. `serverTime` lets a client establish clock offset without a socket.

---

## 6. Bets

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/bets` | Bearer | **Place a bet** (idempotent) |
| GET | `/bets/round/:roundId` | Bearer | Own bets for a round |
| GET | `/bets/:betId` | Bearer | Own bet detail |

```jsonc
// POST /bets
// Headers: Idempotency-Key: bet:8f3c…:a91b…:c7d2e4     (REQUIRED)
{
  "roundId": "a91b…",
  "gameId": "triple-chance-timer",
  "items": [
    { "category": "doubles", "selection": 72,  "amountMinor": 400 },
    { "category": "triples", "selection": 63,  "amountMinor": 400 },
    { "category": "singles", "selection": 2,   "amountMinor": 400 }
  ]
}
// → 201
{ "success": true, "data": {
    "betId": "…", "roundId": "…", "totalAmountMinor": 1200,
    "balanceMinor": 6469500, "status": "accepted", "acceptedAt": "…" } }
```

**`Idempotency-Key` is mandatory.** A request without one is rejected `400 IDEMPOTENCY_KEY_REQUIRED` — making it optional would leave the door open for exactly the double-charge this design exists to prevent.

- Replay of the same key + same body → `200` with the original result and `Idempotency-Replayed: true`.
- Same key + **different** body → `409 IDEMPOTENCY_KEY_REUSED` (a client bug that must be surfaced, not silently resolved).

**Client obligation — one key per intent, reused across every retry.** The client generates the key once per user *intent* and reuses it for every retry of that intent (timeout, dropped connection, app resume, user re-tapping with no visible response). A fresh key is generated **only** for a genuinely new bet.

A client that mints a new key per attempt legitimately double-bets, because each attempt is — as far as the server can tell — a distinct intent. This is the one path that defeats all three server-side protection layers, so it is a hard requirement on every client (web, Electron, Capacitor), not a suggestion. See `docs/POINTS_SYSTEM.md` §5.

**Duplicate selections within one request are merged, not rejected.** If `items` contains the same `(category, selection)` more than once, the API sums their `amountMinor` into a single `bet_items` row before insert — matching the "more chips on the same cell" semantics of `UNIQUE (bet_id, category, selection)` (`docs/DATABASE_V2.md` §4.7). Merging rather than rejecting is deliberate: a repeated cell is a perfectly natural client payload, and letting it reach the database would surface as an unhandled constraint violation (a `500`) on a valid user action.
- Server-side validation, all inside one transaction: round is current and accepting, `now()` (DB clock) < `bettingDeadline`, selections in range for their category, amounts positive and within limits, balance sufficient.

**Bets are REST-only** — the WebSocket `game.bet.place` event from V1 is removed (ADR-016, `docs/WEBSOCKET_V2.md` §6).

**Error codes:** `ROUND_NOT_ACCEPTING`, `ROUND_MISMATCH`, `DEADLINE_PASSED`, `INSUFFICIENT_POINTS`, `INVALID_SELECTION`, `LIMIT_EXCEEDED`, `IDEMPOTENCY_KEY_REQUIRED`, `IDEMPOTENCY_KEY_REUSED`.

> **NEEDS CLIENT CONFIRMATION**: min/max bet per selection and per round drive `LIMIT_EXCEEDED`. No limits are enforced until confirmed.

### Bet submission model — server supports both, pending confirmation

> **NEEDS CLIENT CONFIRMATION** (`docs/CLIENT_REQUIREMENTS.md` item 13): is **each chip placement an immediate `POST /bets`**, or does the client accumulate selections locally and submit **one bet per round**? The reference UI shows no submit control (PLAY is a counter, not a button), which suggests immediate placement, but this is not confirmed and is **not** inferred here.

The server contract is deliberately specified as the **superset that is correct under either model**, so this answer changes client behaviour and tuning — never the schema or the transaction design:

- **Multiple bets per round per user are supported and expected.** `bets` is unique on `(user_id, idempotency_key)`, not on `(user_id, round_id)`. Each `POST /bets` creates an independent, independently-settled bet.
- **Settlement is per bet**, so N bets in a round settle as N transactions (`docs/POINTS_SYSTEM.md` §8).
- **`game_history` aggregates per user per round**, projected once at `ROUND_COMPLETED` — which is exactly what makes many small bets safe (ADR-024).
- **Rate limits are sized for the per-chip worst case** (§10), so confirming batching later can only relax them.

Because the superset is already correct, steps 1–6 of the implementation plan are unaffected by this answer; only the `POST /bets` client contract and rate-limit tuning depend on it.

---

## 7. History & Reports

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/history/rounds` | Bearer | Game History modal: `S NO`, `Game ID`, `Played`, `Won` |
| GET | `/history/rounds/:roundId` | Bearer | Per-round detail with item breakdown |
| GET | `/reports/daily?from=&to=` | Bearer | Report modal: `DATE`, `SALE POINT`, `WIN POINT`, `END`, `COMMI POINT`, `NTP POINT` |

```jsonc
// GET /history/rounds?page=1&limit=20 → 200
{ "success": true, "data": [
  { "sno": 1, "roundId": "…", "displayCode": "623TC2314",
    "drawValue": 772, "playedMinor": 4000, "wonMinor": 0, "completedAt": "…" }
], "meta": { "page": 1, "limit": 20, "total": 137, "totalPages": 7 } }
```

Both read from the read models (`docs/DATABASE_V2.md` §5). `from`/`to` are dates in the fixed reporting timezone (Asia/Kolkata) and the range is capped (e.g. 90 days) to bound query cost.

> **NEEDS CLIENT CONFIRMATION**: `END`, `COMMI POINT`, `NTP POINT` derivations. The endpoint shape is fixed; those three fields return `null` until the formulas are confirmed rather than shipping a guess.

The three columns are **nullable in the schema with no default** (`docs/DATABASE_V2.md` §5.2), so `null` genuinely means "not computed" rather than being indistinguishable from a computed zero. Clients must render `null` as blank or `—`, **never as `0.00`** — an operator reading `0.00` would reasonably take it for a real figure.

---

## 8. Admin API

All under `/api/v1/admin/`, requiring an admin token (`aud: jito-admin`). **Every mutating admin call writes an `admin_logs` row in the same transaction as its effect.**

### 8.1 Dashboard & Users

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/admin/dashboard` | viewer+ | Live counters: active players, live rounds, today's sale/win points |
| GET | `/admin/users` | viewer+ | Search/filter/paginate players |
| GET | `/admin/users/:id` | viewer+ | Player detail + balance |
| PATCH | `/admin/users/:id/status` | operator+ | `active` / `suspended` / `banned` (disconnects live sockets) |

### 8.2 Points Administration

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/admin/users/:id/points` | viewer+ | Balance + ledger for one player |
| POST | `/admin/users/:id/points/adjust` | operator+ | **Credit or debit points** (idempotent, audited) |
| GET | `/admin/points/ledger` | viewer+ | Global ledger, filterable |

```jsonc
// POST /admin/users/{id}/points/adjust
// Headers: Idempotency-Key: adj:{adminId}:{uuid}     (REQUIRED)
{ "direction": "credit", "amountMinor": 500000, "reason": "Opening balance — approved by ops" }
// → 201 { "transactionId", "balanceBeforeMinor", "balanceAfterMinor", "auditLogId" }
```

`reason` is mandatory and non-empty. A debit that would push the balance below zero is rejected (`INSUFFICIENT_POINTS`), not clamped.

**This is the only inflow of points into the platform** (`docs/POINTS_SYSTEM.md` §9). It is not a payment, a deposit, or a purchase — it is an operator-granted amusement balance.

### 8.3 Rounds & Results

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/admin/rounds` | viewer+ | Live and historical rounds |
| GET | `/admin/rounds/:id` | viewer+ | Round detail: bets, result, settlement status |
| POST | `/admin/rounds/:id/result` | operator+ | **Submit the draw** for a round in `RESULT_PENDING` |
| POST | `/admin/rounds/:id/void` | super_admin | Void a round and refund all bets |
| POST | `/admin/rounds/:id/resettle` | super_admin | Re-run settlement for unsettled bets only |

```jsonc
// POST /admin/rounds/{id}/result
{ "drawValue": 772, "note": "Draw entered from official source" }
// → 201 { "roundId", "drawValue": 772, "publishedAt", "auditLogId" }
```

This is the `ManualResultSource` implementation (`docs/GAME_ENGINE_V2.md` §6) — **the only way a result enters the system in Phase 2.** Rejected unless the round is exactly in `RESULT_PENDING`; `UNIQUE (round_id)` on `game_results` makes a second submission impossible.

`resettle` only processes bets with no `settlements` row — it can never double-pay, because `UNIQUE (bet_id)` forbids it.

**`void` is permitted only while the round has zero settlements.** The endpoint checks `COUNT(settlements WHERE round_id) = 0` and re-checks it inside the void transaction under the round lock; otherwise it returns `409 ROUND_PARTIALLY_SETTLED`. Voiding after partial settlement would refund everyone while already-credited winners kept their payouts, creating points from nothing — and the ledger would stay internally consistent, so nothing would flag it. A partially-settled round is **completed by retry**, not voided; there is no automatic reversal path, and adding one would require a client decision and its own ADR (`docs/GAME_ENGINE_V2.md` §8).

### 8.4 History, Reports, Announcements, Downloads, Audit

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/admin/history` | viewer+ | Global round history |
| GET | `/admin/reports/daily?from=&to=` | viewer+ | Operator daily report |
| POST | `/admin/reports/rebuild` | super_admin | Recompute report aggregates for a date range |
| GET/POST/PATCH/DELETE | `/admin/announcements` | operator+ | Ticker + maintenance notices |
| GET/POST | `/admin/downloads` | operator+ | Installer versions (Windows / Android / Print) |
| GET | `/admin/audit-logs` | viewer+ | Audit trail, filterable by admin, action, target, date |

`reports/rebuild` exists because the aggregates are a rebuildable cache — being able to regenerate them from the ledger on demand is what makes it safe to treat them as a cache at all.

**There is no payment administration of any kind.**

---

## 9. Idempotency (Summary)

| Endpoint | Key | Source |
|---|---|---|
| `POST /bets` | `Idempotency-Key` (**required**) | Client, per user action |
| `POST /admin/users/:id/points/adjust` | `Idempotency-Key` (**required**) | Admin client |
| `POST /admin/rounds/:id/result` | Natural: `UNIQUE (round_id)` | Server |
| Settlement / refunds (internal) | Derived: `settle:{round}:{bet}` / `refund:{round}:{bet}` | Server |

Full semantics in `docs/POINTS_SYSTEM.md` §5.

---

## 10. Rate Limiting

Redis-backed, per IP and per identity.

| Scope | Limit |
|---|---|
| `POST /auth/login` | 5 / 15 min per IP; 10 / 15 min per username |
| `POST /auth/register` | 3 / hour per IP |
| `POST /auth/refresh` | 10 / min per session |
| `POST /bets` | **240 / min per user** (see note) |
| Authenticated reads | 300 / min per user |
| Admin mutations | 60 / min per admin |
| `POST /admin/rounds/:id/result` | 10 / min per admin, alert on breach |

Responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`; exceeding returns `429 RATE_LIMIT_EXCEEDED` with `Retry-After`.

**The bet limit is sized for the per-chip worst case.** The previous value of 30/min (one request every two seconds) would have rejected normal rapid chip placement if each placement is an immediate `POST /bets` — players would experience the platform as broken, and the fault would only surface during frontend integration. 240/min (4/sec) comfortably exceeds human placement speed while still bounding abuse, and is safe under either submission model (§6). If the client confirms batched submission, this can be tightened to ~30/min; confirming batching can only relax the limit, never require raising it.

Bet placement is additionally bounded by the betting window itself and by the balance — a player cannot place more bets than they have points for.

---

## 11. Status Codes

| Code | Use |
|---|---|
| 200 / 201 | Success / created |
| 400 | Validation failure |
| 401 | Missing/invalid/expired token |
| 403 | Authenticated but not permitted (role, ownership, suspended) |
| 404 | Not found, **or** found but not owned by the caller |
| 409 | Conflict: idempotency reuse, illegal state transition, `ROUND_PARTIALLY_SETTLED` |
| 422 | Semantically invalid (e.g. `DEADLINE_PASSED`) |
| 429 | Rate limited |
| 500 | Server error (generic message; details only in logs) |

A resource that exists but belongs to another user returns **404, not 403** — 403 would confirm the id exists, which is an enumeration oracle.

---

## 12. Open Items

| # | Item | Blocks |
|---|------|--------|
| 1 | Min/max bet per selection and per round | `LIMIT_EXCEEDED` |
| 2 | `END` / `COMMI POINT` / `NTP POINT` formulas | `/reports/daily` |
| 3 | Admin role → permission matrix | Role guards on every admin route |
| 4 | Mandatory registration fields | `/auth/register` DTO |
| 5 | Forgot-password flow (needed? channel?) | Reset endpoints |
| 6 | History/report retention window | Query caps |
