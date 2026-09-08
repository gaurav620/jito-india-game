# JITO INDIA GAMES — REST API Specification

> Version: 1.0 | All endpoints prefixed with `/api/v1/`

---

## 1. Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login | Public |
| POST | `/auth/refresh` | Refresh access token | Refresh token |
| POST | `/auth/logout` | Logout | JWT |
| GET | `/auth/me` | Get current user | JWT |

---

## 2. Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/profile` | Get user profile | JWT |
| PATCH | `/users/profile` | Update profile | JWT |
| PATCH | `/users/password` | Change password | JWT |

---

## 3. Wallet

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/wallet/balance` | Get current balance | JWT |
| GET | `/wallet/transactions` | Get transaction history | JWT |

---

## 4. Games

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/games` | List available games | JWT |
| GET | `/games/:gameId` | Get game details | JWT |
| GET | `/games/:gameId/current-round` | Get current round state | JWT |

---

## 5. Bets

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/bets` | Place bet(s) for current round | JWT |
| GET | `/bets/round/:roundId` | Get bets for a round | JWT |

---

## 6. History

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/history/games` | Get game history | JWT |
| GET | `/history/games/:roundId` | Get round details | JWT |

---

## 7. Reports

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/reports/summary` | Get player summary report | JWT |
| GET | `/reports/daily` | Get daily report | JWT |

---

## 8. Admin Endpoints

> Prefixed with `/api/v1/admin/` — requires admin role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Dashboard statistics |
| GET | `/admin/users` | List all users |
| GET | `/admin/users/:id` | User details |
| PATCH | `/admin/users/:id` | Update user |
| GET | `/admin/users/:id/wallet` | User wallet details |
| POST | `/admin/users/:id/wallet/adjust` | Adjust user balance |
| GET | `/admin/rounds` | List game rounds |
| GET | `/admin/rounds/:id` | Round details |
| GET | `/admin/reports` | Admin reports |
| GET | `/admin/audit-logs` | Audit logs |
| GET | `/admin/downloads` | Installer management |
| POST | `/admin/downloads` | Upload new installer |

---

## 9. Standard Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "amount", "message": "Must be a positive number" }
  ]
}
```

---

## 10. Authentication Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 11. Pagination

All list endpoints support:

| Param | Default | Description |
|-------|---------|-------------|
| `page` | 1 | Page number |
| `limit` | 20 | Items per page (max 100) |
| `sort` | `created_at` | Sort field |
| `order` | `desc` | Sort direction |
