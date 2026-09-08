# JITO INDIA GAMES — Authentication

---

## 1. Auth Flow

```
Client                    API                      Database
  │                        │                         │
  │── POST /auth/login ───>│── validate password ───>│
  │                        │<── user record ─────────│
  │                        │── generate JWT ─────>   │
  │                        │── create session ──────>│
  │<── { accessToken,      │                         │
  │      refreshToken } ───│                         │
```

## 2. Token Strategy

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access Token (JWT) | 1 hour | Memory / httpOnly cookie | API authorization |
| Refresh Token | 7 days | httpOnly cookie / secure storage | Token renewal |

## 3. JWT Payload

```json
{
  "sub": "user-uuid",
  "username": "...",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234571490
}
```

## 4. Password Security

- Hash: bcrypt with 12 rounds minimum
- Minimum length: 8 characters (**NEEDS CLIENT CONFIRMATION**)
- Validation: server-side always, client-side for UX

## 5. Session Management

- One active session per device (or configurable — **NEEDS CLIENT CONFIRMATION**)
- Session stored in database with device info
- Refresh token rotation on each use
- Force logout: invalidate all sessions

## 6. Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5 attempts / 15 minutes per IP |
| `/auth/register` | 3 attempts / hour per IP |
| `/auth/refresh` | 10 / minute |
