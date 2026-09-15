# JITO INDIA GAMES — Authentication & Authorization V2 (Phase 2)

> Version: 2.2 | Date: 2026-09-15 | Status: **IMPLEMENTED (Phase 2B scope)**
> Supersedes `docs/AUTH.md` for Phase 2 onward. Runtime-verified 2026-09-15: player registration, login, refresh rotation, reuse detection (sequential **and** concurrent), PostgreSQL-authoritative session revocation, admin auth, audience isolation, rate-limiting (HTTP 429 + `Retry-After`), lockout — all PASS. See MEMORY.md Phase 2B and PROJECT_CONTEXT.md.
>
> The concurrent-refresh divergence previously flagged in §6 is **RESOLVED** (ADR-027) — the critical section now runs in a single transaction and is covered by a real concurrency test.
>
> Items in §12 (Open Items) remain **PENDING** and are unaffected by Phase 2B.

> **No KYC.** No identity documents, no age/address verification, no third-party identity provider. Nothing in this design collects or stores identity documents. KYC is out of scope unless the client explicitly requires it, at which point it needs its own ADR.

---

## 1. Two Separate Authentication Domains

| | Player auth | Admin auth |
|---|---|---|
| Identity table | `users` | `admin_users` |
| Surface | `apps/web`, desktop, mobile | `apps/admin` |
| Route prefix | `/api/v1/auth/*` | `/api/v1/admin/auth/*` |
| Token audience (`aud`) | `jito-player` | `jito-admin` |
| Self-registration | Yes | **Never** — admins are provisioned |
| WebSocket access | Yes (game namespace) | Read-only ops namespace |

**Why fully separate rather than one `users` table with a `role` column** (ADR-021): a single table means the self-service registration endpoint writes to the same table that grants administrative power, and privilege escalation is then one mass-assignment bug or one missed `role` filter away. Separate tables make "a player becomes an admin" require a schema-level mistake rather than a field-level one. The `aud` claim ensures a player token is structurally unusable against an admin endpoint even if a guard is forgotten.

---

## 2. Registration (Player)

```
Client                      API                        PostgreSQL
  │                          │                              │
  │─ POST /auth/register ───►│                              │
  │                          │─ validate DTO                │
  │                          │─ check uniqueness ──────────►│
  │                          │─ hash password (argon2id)    │
  │                          │─ BEGIN ─────────────────────►│
  │                          │─ INSERT users ──────────────►│
  │                          │─ INSERT points_accounts ────►│  balance 0
  │                          │─ COMMIT ────────────────────►│
  │◄─ 201 { user }           │                              │
```

- The user row and its points account are created **in one transaction**. A user without an account would break every balance read; there is no code path that can produce one.
- Starting balance is **0**. Points only enter via admin adjustment (`docs/POINTS_SYSTEM.md` §9).
- Registration does **not** auto-login — it returns the created user, and the client then calls `/auth/login`. This keeps token issuance in exactly one place.
- Uniqueness violations return a **generic** "username or contact already registered" rather than naming which field collided, to avoid turning registration into an account-enumeration oracle.

> **NEEDS CLIENT CONFIRMATION** (`docs/CLIENT_REQUIREMENTS.md` item 5): which fields are mandatory — username only, username + phone, username + email, or both contacts. The Phase 1 UI accepts both flexibly. Until confirmed, the DTO requires `username` + `password` and accepts either contact, matching the `CHECK (email IS NOT NULL OR phone IS NOT NULL)` constraint.

> **NEEDS CLIENT CONFIRMATION**: password policy. Placeholder: minimum 8 characters, no composition rules, checked against a common-password denylist. Length beats composition rules for real-world strength, but the client may have its own requirement.

---

## 3. Login

```
Client                      API                        PostgreSQL
  │─ POST /auth/login ──────►│                              │
  │  { username, password }  │─ rate limit check (Redis)    │
  │                          │─ SELECT user ───────────────►│
  │                          │─ verify argon2id hash        │  constant-time
  │                          │─ check status / locked_until │
  │                          │─ BEGIN ─────────────────────►│
  │                          │─ INSERT sessions ───────────►│  refresh hash only
  │                          │─ UPDATE last_login_at ──────►│
  │                          │─ COMMIT ────────────────────►│
  │◄─ 200 { access, refresh }│                              │
```

- **The password hash is always verified, even when the username does not exist** — against a dummy hash. Skipping verification for unknown users creates a timing difference that reliably enumerates valid accounts.
- Failure responses are identical for "no such user", "wrong password", and "suspended", for the same reason.
- `status = suspended | banned` blocks login; `locked_until > now()` blocks login (§7).

---

## 4. Token Strategy

| Token | Lifetime | Transport | Contents |
|---|---|---|---|
| Access (JWT) | **15 minutes** | `Authorization: Bearer` header | Claims below — stateless, not checked against the DB |
| Refresh (opaque random) | **7 days** | httpOnly + Secure + SameSite=Strict cookie (web); OS secure storage (desktop/mobile) | Nothing — it is a random 256-bit value; only its hash is stored |

**Access token claims:**

```jsonc
{
  "sub": "user-uuid",
  "aud": "jito-player",        // or "jito-admin" — audience separation
  "role": "user",
  "sid": "session-uuid",       // ties the access token to a revocable session
  "iat": 1757000000,
  "exp": 1757000900,
  "jti": "token-uuid"
}
```

**Why 15 minutes rather than the 1 hour in Phase 1's `AUTH.md`:** access tokens are deliberately not checked against the database on each request (that would erase the performance benefit of statelessness), so a revoked session stays usable until its access token expires. That window is the entire cost of a ban or a forced logout not taking effect. 15 minutes bounds it acceptably; 1 hour means a banned player can keep playing for up to an hour.

**Why the refresh token is opaque rather than a JWT:** it must be revocable and reuse-detectable, which requires server state anyway. A random value with only its hash stored means a database leak yields nothing usable.

`sid` lets an access token be traced to its session for audit, and lets a future high-security endpoint opt into a live session check without changing the token format.

---

## 5. Password Hashing

**argon2id**, parameters: `memoryCost 19456 KiB (19 MiB)`, `timeCost 2`, `parallelism 1` (OWASP baseline).

Phase 1's docs specified bcrypt(12). argon2id is chosen instead because bcrypt is cheap to attack on GPUs — its work factor is CPU-time only, while argon2id is *memory*-hard, which is what makes offline cracking of a leaked hash expensive on the hardware attackers actually use. bcrypt also silently truncates input beyond 72 bytes.

- Parameters are stored in the hash string, so they can be raised later without invalidating existing hashes.
- On successful login, if a hash used older parameters, it is transparently re-hashed with current ones.
- Hashes are never logged, never returned by any endpoint, and excluded from every serializer by default.

> This supersedes `RULES.md` §10's "bcrypt (min 12 rounds)" and `docs/SECURITY.md` §2. Those lines should be updated when Phase 2 is implemented.

---

## 6. Refresh & Rotation

```
Client                          API                     PostgreSQL
  │─ POST /auth/refresh ────────►│                            │
  │  (cookie / stored token)     │─ hash token, look up ─────►│
  │                              │─ session valid? not revoked?│
  │                              │─ BEGIN ───────────────────►│
  │                              │─ revoke old session ──────►│  revoked_at = now()
  │                              │─ INSERT new session ──────►│  replaced_by chain
  │                              │─ COMMIT ──────────────────►│
  │◄─ { new access, new refresh }│                            │
```

**Rotation on every use**, with **reuse detection**: if a refresh token that is already `revoked_at` is presented, that means the token was captured and replayed (the legitimate client already rotated it). The response is to **revoke the entire session chain for that user** and force a full re-login. Silently issuing a new token there would let an attacker with a stolen token stay authenticated indefinitely.

This is the single most valuable property of the token design and the reason `replaced_by_session_id` exists in the schema.

> [!NOTE]
> **Implementation status (2026-09-15): RESOLVED — the `BEGIN … COMMIT` boundary shown above is enforced (ADR-027).**
>
> A Phase 2B review found that `AuthService.refresh()` originally took its `SELECT … FOR UPDATE` via a standalone
> `prisma.$queryRaw`, outside any transaction. PostgreSQL committed that implicit single-statement transaction and
> released the row lock immediately, so it did not cover the successor-insert and old-session-revoke writes.
> Two concurrent refreshes with the same token both succeeded, leaving **two valid sessions**.
>
> **Fix:** the entire read-check-rotate sequence now runs inside one `prisma.$transaction`. The `FOR UPDATE` read,
> the successor insert and the old-session revoke all use the same transaction client, so the row lock is held to
> COMMIT. `createSession()` and `revokeAllSessions()` accept an optional executor (root client or transaction
> client) so login paths are unchanged and no logic is duplicated.
>
> One subtlety worth preserving: the outcome is **returned** from the transaction and the 401 is thrown *after* it
> commits. Throwing inside the transaction would roll back the reuse-detection revocation — silently undoing the
> very thing reuse detection exists to do.
>
> **Verified:** 5/5 concurrent races against live PostgreSQL leave **≤ 1** valid session (observed: exactly one
> request rotates, the loser trips reuse detection, which revokes the chain → 0 valid — the approved
> security-first outcome). Covered by integration test 5, which now calls the real `AuthService.refresh()`
> twice via `Promise.allSettled`.

---

## 7. Rate Limiting & Lockout

Enforced in Redis (`docs/API_V2.md` §10), keyed by IP **and** by account.

| Endpoint | Limit |
|---|---|
| `POST /auth/login` | 5 / 15 min per IP **and** 10 / 15 min per username |
| `POST /auth/register` | 3 / hour per IP |
| `POST /auth/refresh` | 10 / min per session |
| `POST /admin/auth/login` | 5 / 15 min per IP, alert on breach |

Per-account limiting matters independently of per-IP: a distributed credential-stuffing attack spreads across thousands of IPs, and per-IP limits alone never trigger.

**Account lockout:** after 10 consecutive failures, `locked_until = now() + 15 min`, cleared on any successful login. Counters are persisted on the user row (not only Redis) so a cache flush cannot reset an attack in progress.

---

## 8. Logout

| Action | Effect |
|---|---|
| `POST /auth/logout` | Revokes the current session; clears the refresh cookie |
| `POST /auth/logout-all` | Revokes every session for the user |
| Admin forced logout | Revokes all sessions; also disconnects live WebSockets |

Access tokens already issued remain cryptographically valid until they expire (≤15 min) — an accepted, bounded consequence of stateless access tokens. Where immediate cutoff is required (ban, fraud), the WebSocket layer disconnects the user immediately, so they cannot continue to play even while a token is technically unexpired.

---

## 9. Authorization

**Guard chain**, applied in this order:

1. `JwtAuthGuard` — signature, expiry, and **`aud` claim matches this surface**.
2. `UserStatusGuard` — rejects `suspended` / `banned` (checked against the DB, cached briefly in Redis).
3. `RolesGuard` — role requirements for admin routes.
4. `ResourceOwnershipGuard` — the authenticated `sub` owns the requested resource.

**Ownership is never inferred from the request.** Every player-scoped query filters by `sub` from the token; the API has no endpoint shaped like `GET /users/:id/points` where `:id` is trusted. History, reports, bets, and balances are always read as "the current user's", making cross-account access a structural impossibility rather than a guard that could be forgotten.

Admin access to another user's data is a separate, explicitly-authorized, always-audited path (`/admin/users/:id/...`).

---

## 10. WebSocket Authentication

Full detail in `docs/WEBSOCKET_V2.md` §3. Summary:

- The access token is presented in the connection handshake; an unauthenticated socket is rejected before joining any room.
- The token is verified **once at connect** and its expiry tracked; on expiry the server emits `auth.expired` and the client refreshes and reconnects rather than being silently dropped.
- Socket identity is bound server-side to `sub`/`sid`. Every inbound message is attributed to that identity — **the client never sends a user id**, so it cannot act as another user.

---

## 11. Transport & Storage Rules

- HTTPS/WSS only; HSTS enabled.
- Refresh cookie: `httpOnly`, `Secure`, `SameSite=Strict`, path-scoped to `/api/v1/auth`.
- `SameSite=Strict` on the refresh cookie is the primary CSRF defence for the refresh endpoint; all other state-changing endpoints use the `Authorization` header, which is not automatically attached by browsers and therefore not CSRF-exposed.
- Desktop (Electron) and mobile (Capacitor) store the refresh token in OS-provided secure storage, never in `localStorage`.
- No token, hash, or password ever appears in logs, error responses, or telemetry.

---

## 12. Open Items

| # | Item | Blocks |
|---|------|--------|
| 1 | Mandatory registration fields (email / phone / both) | Registration DTO + `users` constraint |
| 2 | Password policy (min length, rules) | Validation |
| 3 | Forgot-password / reset flow — required at all? Delivery channel (SMS/email)? | Whole reset feature |
| 4 | One session per device, or unlimited concurrent sessions? | Session policy |
| 5 | Admin role set and permission matrix | `RolesGuard` |
| 6 | Whether player accounts are self-registered or operator-provisioned in production | Registration endpoint exposure |
