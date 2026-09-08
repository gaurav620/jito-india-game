# JITO INDIA GAMES — Database Schema

> PostgreSQL | All tables use UUID primary keys and timestamps.

---

## 1. Entity Relationship Diagram

```
users ──┬── sessions
        ├── wallets ── wallet_transactions
        └── bets ── bet_items
                 └── game_rounds ── game_results
                                 └── settlements

admin_users ── admin_logs

installer_versions
notifications
```

---

## 2. Core Tables

### users

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| username | VARCHAR(50) | UNIQUE, NOT NULL |
| email | VARCHAR(255) | UNIQUE |
| phone | VARCHAR(20) | UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| display_name | VARCHAR(100) | |
| status | ENUM('active','suspended','banned') | DEFAULT 'active' |
| last_login_at | TIMESTAMP | |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

> **NEEDS CLIENT CONFIRMATION**: Required registration fields (email/phone/both)

### sessions

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| refresh_token_hash | VARCHAR(255) | NOT NULL |
| ip_address | INET | |
| user_agent | TEXT | |
| expires_at | TIMESTAMP | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

### wallets

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, UNIQUE |
| balance | DECIMAL(15,2) | NOT NULL, DEFAULT 0, CHECK >= 0 |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

### wallet_transactions

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| wallet_id | UUID | FK → wallets.id |
| type | ENUM('credit','debit') | NOT NULL |
| amount | DECIMAL(15,2) | NOT NULL, CHECK > 0 |
| balance_before | DECIMAL(15,2) | NOT NULL |
| balance_after | DECIMAL(15,2) | NOT NULL |
| reference_type | VARCHAR(50) | e.g., 'bet', 'settlement', 'admin_adjust' |
| reference_id | UUID | |
| description | TEXT | |
| created_at | TIMESTAMP | DEFAULT NOW() |

### game_rounds

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| game_id | VARCHAR(50) | NOT NULL (e.g., 'triple-chance-timer') |
| round_number | INTEGER | NOT NULL |
| state | ENUM(...) | NOT NULL |
| start_time | TIMESTAMP | NOT NULL |
| betting_deadline | TIMESTAMP | NOT NULL |
| lock_time | TIMESTAMP | |
| result_time | TIMESTAMP | |
| completed_at | TIMESTAMP | |
| created_at | TIMESTAMP | DEFAULT NOW() |

### bets

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| round_id | UUID | FK → game_rounds.id |
| total_amount | DECIMAL(15,2) | NOT NULL |
| status | ENUM('pending','settled','cancelled') | DEFAULT 'pending' |
| created_at | TIMESTAMP | DEFAULT NOW() |

### bet_items

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| bet_id | UUID | FK → bets.id |
| category | ENUM('singles','doubles','triples') | NOT NULL |
| selection | JSONB | NOT NULL |
| amount | DECIMAL(15,2) | NOT NULL |
| is_winner | BOOLEAN | |
| payout | DECIMAL(15,2) | |

### game_results

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| round_id | UUID | FK → game_rounds.id, UNIQUE |
| result_data | JSONB | NOT NULL |
| winning_numbers | JSONB | NOT NULL |
| generated_at | TIMESTAMP | DEFAULT NOW() |

### settlements

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| round_id | UUID | FK → game_rounds.id |
| user_id | UUID | FK → users.id |
| bet_id | UUID | FK → bets.id |
| total_bet | DECIMAL(15,2) | NOT NULL |
| total_win | DECIMAL(15,2) | NOT NULL |
| net_amount | DECIMAL(15,2) | NOT NULL |
| settled_at | TIMESTAMP | DEFAULT NOW() |

---

## 3. Admin Tables

### admin_users

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| username | VARCHAR(50) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| role | VARCHAR(50) | DEFAULT 'admin' |
| status | ENUM('active','inactive') | DEFAULT 'active' |
| created_at | TIMESTAMP | DEFAULT NOW() |

### admin_logs

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| admin_id | UUID | FK → admin_users.id |
| action | VARCHAR(100) | NOT NULL |
| target_type | VARCHAR(50) | |
| target_id | UUID | |
| details | JSONB | |
| ip_address | INET | |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

## 4. Supporting Tables

### installer_versions

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| platform | ENUM('windows','android') | NOT NULL |
| version | VARCHAR(20) | NOT NULL |
| download_url | TEXT | NOT NULL |
| checksum | VARCHAR(64) | |
| is_latest | BOOLEAN | DEFAULT false |
| release_notes | TEXT | |
| created_at | TIMESTAMP | DEFAULT NOW() |

### notifications

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NULL for broadcast |
| title | VARCHAR(200) | NOT NULL |
| message | TEXT | NOT NULL |
| type | VARCHAR(50) | |
| is_read | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

## 5. Indexes

```sql
-- Performance indexes
CREATE INDEX idx_bets_round_id ON bets(round_id);
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bet_items_bet_id ON bet_items(bet_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_game_rounds_game_id_state ON game_rounds(game_id, state);
CREATE INDEX idx_game_rounds_created_at ON game_rounds(created_at);
CREATE INDEX idx_settlements_round_id ON settlements(round_id);
CREATE INDEX idx_settlements_user_id ON settlements(user_id);
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);
```

---

## 6. Migration Strategy

- Use a migration tool (TypeORM migrations or Prisma migrate)
- Migrations are versioned and sequential
- Never modify existing migrations — create new ones
- Test migrations in staging before production
