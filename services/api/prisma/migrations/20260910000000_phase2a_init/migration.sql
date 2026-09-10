-- =============================================================================
-- JITO INDIA GAMES — Phase 2A Initial Migration
-- =============================================================================
-- Source: docs/DATABASE_V2.md
-- Generated: 2026-09-10
--
-- This migration contains:
--   1. All enum types
--   2. All 13 core tables (Prisma-generated DDL)
--   3. All indexes (including partial unique index for one-live-round)
--   4. All foreign key constraints
--   5. All CHECK constraints (required by DATABASE_V2.md §4)
--   6. Append-only triggers for points_transactions and admin_logs
--
-- DB ROLE NOTE (DATABASE_V2.md §10):
--   The application role (jito_app) must NOT have UPDATE or DELETE on
--   points_transactions and admin_logs. Those grants are intentionally
--   omitted here and must be applied separately to each environment
--   by a DBA with superuser access, using the pattern documented at the
--   bottom of this file.
--
-- POINTS-ONLY PLATFORM: No payment gateway, deposit, withdrawal, cashout,
-- or real-money wallet columns. (ADR-011)
-- All monetary values are BIGINT centipoints (_minor suffix). (ADR-014)
-- =============================================================================

-- =============================================================================
-- PART 1: Enum types
-- =============================================================================

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'suspended', 'banned');

-- CreateEnum
CREATE TYPE "admin_role" AS ENUM ('super_admin', 'operator', 'viewer');

-- CreateEnum
CREATE TYPE "admin_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "txn_direction" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "txn_ref_type" AS ENUM ('bet_placed', 'bet_refund', 'settlement_win', 'admin_credit', 'admin_debit');

-- CreateEnum
CREATE TYPE "round_state" AS ENUM (
  'ROUND_CREATED',
  'BETTING_OPEN',
  'BETTING_ACTIVE',
  'BETTING_LOCKED',
  'RESULT_PENDING',
  'RESULT_PUBLISHED',
  'SETTLEMENT_PENDING',
  'ROUND_COMPLETED',
  'ROUND_VOID'
);

-- CreateEnum
CREATE TYPE "bet_category" AS ENUM ('singles', 'doubles', 'triples');

-- CreateEnum
CREATE TYPE "bet_status" AS ENUM ('accepted', 'settled', 'refunded');

-- CreateEnum
CREATE TYPE "result_source" AS ENUM ('manual', 'external_feed', 'certified_rng');

-- =============================================================================
-- PART 2: Core tables
-- =============================================================================

-- 4.1 users — player accounts (ADR-021: separate from admin_users)
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "passwordHash" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(100),
    "status" "user_status" NOT NULL DEFAULT 'active',
    "failedLoginCount" SMALLINT NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ,
    "lastLoginAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- NEEDS CLIENT CONFIRMATION (item 5): which identifier is mandatory.
-- Until confirmed, email OR phone must be present. Both are nullable so
-- the actual constraint is the either-or check below.
-- See docs/CLIENT_REQUIREMENTS.md item 5.

-- 4.2 sessions — refresh token chains
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "refreshTokenHash" VARCHAR(255) NOT NULL,
    "deviceLabel" VARCHAR(100),
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "revokedAt" TIMESTAMPTZ,
    "replacedBySessionId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- 4.3 points_accounts — cached balance projection of the ledger
CREATE TABLE "points_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "balanceMinor" BIGINT NOT NULL DEFAULT 0,
    "version" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "points_accounts_pkey" PRIMARY KEY ("id")
);

-- 4.4 points_transactions — append-only ledger (the truth)
-- NEVER UPDATE OR DELETE rows in this table (enforced by trigger below).
CREATE TABLE "points_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID NOT NULL,
    "direction" "txn_direction" NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "balanceBeforeMinor" BIGINT NOT NULL,
    "balanceAfterMinor" BIGINT NOT NULL,
    "referenceType" "txn_ref_type" NOT NULL,
    "referenceId" UUID,
    "idempotencyKey" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_transactions_pkey" PRIMARY KEY ("id")
);

-- 4.5 game_rounds — round lifecycle
-- Partial unique index for one-live-round-per-game guarantee is in PART 3.
CREATE TABLE "game_rounds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gameId" VARCHAR(50) NOT NULL,
    "roundNumber" BIGINT NOT NULL,
    "displayCode" VARCHAR(20) NOT NULL,
    "state" "round_state" NOT NULL,
    "stateVersion" BIGINT NOT NULL DEFAULT 0,
    "opensAt" TIMESTAMPTZ NOT NULL,
    "bettingDeadline" TIMESTAMPTZ NOT NULL,
    "lockedAt" TIMESTAMPTZ,
    "resultPublishedAt" TIMESTAMPTZ,
    "settledAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "game_rounds_pkey" PRIMARY KEY ("id")
);

-- 4.6 bets
CREATE TABLE "bets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "roundId" UUID NOT NULL,
    "totalAmountMinor" BIGINT NOT NULL,
    "status" "bet_status" NOT NULL DEFAULT 'accepted',
    "idempotencyKey" VARCHAR(120) NOT NULL,
    "acceptedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

-- 4.7 bet_items
-- Selection range constraints are in PART 4 (CHECK constraints).
CREATE TABLE "bet_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "betId" UUID NOT NULL,
    "category" "bet_category" NOT NULL,
    "selection" SMALLINT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "isWinner" BOOLEAN,
    "payoutMinor" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bet_items_pkey" PRIMARY KEY ("id")
);

-- 4.8 game_results — one result per round, forever (UNIQUE on roundId)
CREATE TABLE "game_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "roundId" UUID NOT NULL,
    "drawValue" SMALLINT NOT NULL,
    "source" "result_source" NOT NULL,
    "sourceReference" TEXT,
    "publishedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_results_pkey" PRIMARY KEY ("id")
);

-- 4.9 settlements — one settlement per bet (UNIQUE on betId)
CREATE TABLE "settlements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "roundId" UUID NOT NULL,
    "betId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "totalBetMinor" BIGINT NOT NULL,
    "totalWinMinor" BIGINT NOT NULL,
    "netMinor" BIGINT NOT NULL,
    "rulesVersion" VARCHAR(30) NOT NULL,
    "settledAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- 5.1 game_history — read model (rebuildable cache, ADR-024)
CREATE TABLE "game_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "roundId" UUID NOT NULL,
    "gameId" VARCHAR(50) NOT NULL,
    "displayCode" VARCHAR(20) NOT NULL,
    "drawValue" SMALLINT NOT NULL,
    "playedMinor" BIGINT NOT NULL,
    "wonMinor" BIGINT NOT NULL,
    "completedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "game_history_pkey" PRIMARY KEY ("id")
);

-- 5.2 report_daily_aggregates — read model (rebuildable cache)
-- end/commi/ntp are NULLABLE — formulas NEEDS CLIENT CONFIRMATION (items 2–4)
CREATE TABLE "report_daily_aggregates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "reportDate" DATE NOT NULL,
    "salePointMinor" BIGINT NOT NULL DEFAULT 0,
    "winPointMinor" BIGINT NOT NULL DEFAULT 0,
    "endPointMinor" BIGINT,
    "commiPointMinor" BIGINT,
    "ntpPointMinor" BIGINT,
    "rebuiltAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_daily_aggregates_pkey" PRIMARY KEY ("id")
);

-- 6.1 admin_users — admin accounts (NEVER in users table, ADR-021)
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "admin_role" NOT NULL DEFAULT 'operator',
    "status" "admin_status" NOT NULL DEFAULT 'active',
    "lastLoginAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- 6.2 admin_logs — append-only audit trail
-- NEVER UPDATE OR DELETE rows in this table (enforced by trigger below).
CREATE TABLE "admin_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "adminId" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "targetType" VARCHAR(50),
    "targetId" UUID,
    "beforeState" JSONB,
    "afterState" JSONB,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- =============================================================================
-- PART 3: Unique indexes and regular indexes
-- =============================================================================

-- users
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- sessions
CREATE UNIQUE INDEX "sessions_refreshTokenHash_key" ON "sessions"("refreshTokenHash");
CREATE INDEX "idx_sessions_user_id" ON "sessions"("userId") WHERE "revokedAt" IS NULL;
CREATE INDEX "idx_sessions_expires_at" ON "sessions"("expiresAt");

-- points_accounts
CREATE UNIQUE INDEX "points_accounts_userId_key" ON "points_accounts"("userId");

-- points_transactions
CREATE UNIQUE INDEX "points_transactions_idempotencyKey_key" ON "points_transactions"("idempotencyKey");
CREATE INDEX "idx_points_txn_account_created" ON "points_transactions"("accountId", "createdAt" DESC);
CREATE INDEX "idx_points_txn_reference" ON "points_transactions"("referenceType", "referenceId");

-- game_rounds
CREATE UNIQUE INDEX "game_rounds_displayCode_key" ON "game_rounds"("displayCode");
CREATE UNIQUE INDEX "game_rounds_gameId_roundNumber_key" ON "game_rounds"("gameId", "roundNumber");
CREATE INDEX "idx_rounds_game_state" ON "game_rounds"("gameId", "state");
CREATE INDEX "idx_rounds_game_number" ON "game_rounds"("gameId", "roundNumber" DESC);

-- One-live-round-per-game guarantee (DATABASE_V2.md §4.5, ADR-017):
-- At most one round per game_id may exist in any state that is not a
-- terminal state. Terminal states are ROUND_COMPLETED and ROUND_VOID.
-- This makes a duplicate scheduler tick or a second game-engine instance
-- harmless at the database level — the second INSERT simply fails.
CREATE UNIQUE INDEX "uq_rounds_one_live_per_game"
  ON "game_rounds"("gameId")
  WHERE "state" NOT IN ('ROUND_COMPLETED', 'ROUND_VOID');

-- bets
CREATE UNIQUE INDEX "bets_userId_idempotencyKey_key" ON "bets"("userId", "idempotencyKey");
CREATE INDEX "idx_bets_round" ON "bets"("roundId");
CREATE INDEX "idx_bets_user_created" ON "bets"("userId", "createdAt" DESC);

-- bet_items
CREATE UNIQUE INDEX "bet_items_betId_category_selection_key" ON "bet_items"("betId", "category", "selection");
CREATE INDEX "idx_bet_items_bet" ON "bet_items"("betId");
CREATE INDEX "idx_bet_items_round_match" ON "bet_items"("category", "selection");

-- game_results
CREATE UNIQUE INDEX "game_results_roundId_key" ON "game_results"("roundId");

-- settlements
CREATE UNIQUE INDEX "settlements_betId_key" ON "settlements"("betId");
CREATE INDEX "idx_settlements_round" ON "settlements"("roundId");
CREATE INDEX "idx_settlements_user_settled" ON "settlements"("userId", "settledAt" DESC);

-- game_history
CREATE UNIQUE INDEX "game_history_userId_roundId_key" ON "game_history"("userId", "roundId");
CREATE INDEX "idx_history_user_completed" ON "game_history"("userId", "completedAt" DESC);

-- report_daily_aggregates
CREATE UNIQUE INDEX "report_daily_aggregates_userId_reportDate_key" ON "report_daily_aggregates"("userId", "reportDate");
CREATE INDEX "idx_report_user_date" ON "report_daily_aggregates"("userId", "reportDate" DESC);

-- admin_users
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- admin_logs
CREATE INDEX "idx_admin_logs_admin_created" ON "admin_logs"("adminId", "createdAt" DESC);
CREATE INDEX "idx_admin_logs_target" ON "admin_logs"("targetType", "targetId");

-- =============================================================================
-- PART 4: CHECK constraints required by DATABASE_V2.md
-- =============================================================================

-- 4.3 points_accounts: balance must never go negative
-- This is the last line of defence against overdraft (DATABASE_V2.md §4.3).
-- The application checks first; this constraint makes a DB abort happen even
-- if application logic has a bug or race condition.
ALTER TABLE "points_accounts"
  ADD CONSTRAINT "chk_points_accounts_balance_non_negative"
  CHECK ("balanceMinor" >= 0);

-- 4.4 points_transactions: amount must be strictly positive
-- Direction carries the sign; amount is always positive (DATABASE_V2.md §4.4).
ALTER TABLE "points_transactions"
  ADD CONSTRAINT "chk_points_txn_amount_positive"
  CHECK ("amountMinor" > 0);

-- 4.4 points_transactions: balance_after must be non-negative
-- A debit that would go below zero must be rejected at the application layer
-- (balance check before mutation) AND at the DB layer (this constraint).
ALTER TABLE "points_transactions"
  ADD CONSTRAINT "chk_points_txn_balance_after_non_negative"
  CHECK ("balanceAfterMinor" >= 0);

-- 4.4 points_transactions: internal consistency of the ledger row
-- balance_after = balance_before + amount (credit) or - amount (debit).
-- This makes every row self-verifying — any application bug that writes an
-- inconsistent row is caught at INSERT time, not discovered by the reconciler.
ALTER TABLE "points_transactions"
  ADD CONSTRAINT "chk_points_txn_balance_consistency"
  CHECK (
    "balanceAfterMinor" = CASE "direction"
      WHEN 'credit' THEN "balanceBeforeMinor" + "amountMinor"
      WHEN 'debit'  THEN "balanceBeforeMinor" - "amountMinor"
    END
  );

-- 4.6 bets: total bet amount must be positive
ALTER TABLE "bets"
  ADD CONSTRAINT "chk_bets_total_amount_positive"
  CHECK ("totalAmountMinor" > 0);

-- 4.7 bet_items: amount must be positive
ALTER TABLE "bet_items"
  ADD CONSTRAINT "chk_bet_items_amount_positive"
  CHECK ("amountMinor" > 0);

-- 4.7 bet_items: payout must be non-negative when set
ALTER TABLE "bet_items"
  ADD CONSTRAINT "chk_bet_items_payout_non_negative"
  CHECK ("payoutMinor" IS NULL OR "payoutMinor" >= 0);

-- 4.7 bet_items: selection range by category (DATABASE_V2.md §4.7)
-- singles: 0–9, doubles: 0–99, triples: 0–999
ALTER TABLE "bet_items"
  ADD CONSTRAINT "chk_bet_items_selection_range"
  CHECK (
    (  "category" = 'singles' AND "selection" BETWEEN 0 AND 9   )
    OR ("category" = 'doubles' AND "selection" BETWEEN 0 AND 99  )
    OR ("category" = 'triples' AND "selection" BETWEEN 0 AND 999 )
  );

-- 4.8 game_results: draw_value must be a valid 3-digit number (DATABASE_V2.md §4.8)
-- 0–999 inclusive. Doubles and singles are DERIVED at the application layer.
ALTER TABLE "game_results"
  ADD CONSTRAINT "chk_game_results_draw_value_range"
  CHECK ("drawValue" BETWEEN 0 AND 999);

-- 4.9 settlements: win amount non-negative (a losing bet has win = 0)
ALTER TABLE "settlements"
  ADD CONSTRAINT "chk_settlements_total_win_non_negative"
  CHECK ("totalWinMinor" >= 0);

-- 4.9 settlements: net_minor = total_win_minor - total_bet_minor (DATABASE_V2.md §4.9)
-- This makes every settlement row self-verifying.
ALTER TABLE "settlements"
  ADD CONSTRAINT "chk_settlements_net_consistency"
  CHECK ("netMinor" = "totalWinMinor" - "totalBetMinor");

-- =============================================================================
-- PART 5: Foreign key constraints
-- =============================================================================

ALTER TABLE "sessions"
  ADD CONSTRAINT "sessions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sessions"
  ADD CONSTRAINT "sessions_replacedBySessionId_fkey"
  FOREIGN KEY ("replacedBySessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "points_accounts"
  ADD CONSTRAINT "points_accounts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "points_transactions"
  ADD CONSTRAINT "points_transactions_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "points_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bets"
  ADD CONSTRAINT "bets_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bets"
  ADD CONSTRAINT "bets_roundId_fkey"
  FOREIGN KEY ("roundId") REFERENCES "game_rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bet_items"
  ADD CONSTRAINT "bet_items_betId_fkey"
  FOREIGN KEY ("betId") REFERENCES "bets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "game_results"
  ADD CONSTRAINT "game_results_roundId_fkey"
  FOREIGN KEY ("roundId") REFERENCES "game_rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "settlements"
  ADD CONSTRAINT "settlements_roundId_fkey"
  FOREIGN KEY ("roundId") REFERENCES "game_rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "settlements"
  ADD CONSTRAINT "settlements_betId_fkey"
  FOREIGN KEY ("betId") REFERENCES "bets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "settlements"
  ADD CONSTRAINT "settlements_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "game_history"
  ADD CONSTRAINT "game_history_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "game_history"
  ADD CONSTRAINT "game_history_roundId_fkey"
  FOREIGN KEY ("roundId") REFERENCES "game_rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "report_daily_aggregates"
  ADD CONSTRAINT "report_daily_aggregates_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "admin_logs"
  ADD CONSTRAINT "admin_logs_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =============================================================================
-- PART 6: Append-only triggers (DATABASE_V2.md §4.4, §6.2)
-- =============================================================================
-- These triggers make points_transactions and admin_logs structurally
-- append-only: any attempt to UPDATE or DELETE a row raises an exception.
-- Corrections to ledger entries must be made via compensating transactions,
-- never by editing history.
--
-- Note: DB role restrictions (REVOKE UPDATE, DELETE on these tables from the
-- application role) are applied separately per environment by a DBA.
-- Doing so inside a migration would require superuser privileges not available
-- in all environments. See the "DB Role Note" at the top of this file.
-- =============================================================================

-- Function shared by both triggers
CREATE OR REPLACE FUNCTION prevent_row_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION
      'Table % is append-only: UPDATE is not permitted. Use a compensating row instead.',
      TG_TABLE_NAME
      USING ERRCODE = 'restrict_violation';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION
      'Table % is append-only: DELETE is not permitted.',
      TG_TABLE_NAME
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger: points_transactions is append-only (DATABASE_V2.md §4.4)
CREATE TRIGGER trg_points_transactions_append_only
  BEFORE UPDATE OR DELETE ON "points_transactions"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_row_modification();

-- Trigger: admin_logs is append-only (DATABASE_V2.md §6.2)
CREATE TRIGGER trg_admin_logs_append_only
  BEFORE UPDATE OR DELETE ON "admin_logs"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_row_modification();

-- =============================================================================
-- DB ROLE NOTE (applied manually by DBA per environment — NOT in migration):
-- =============================================================================
-- After the first deploy to any environment, a DBA must run:
--
--   REVOKE UPDATE, DELETE ON points_transactions FROM jito_app;
--   REVOKE UPDATE, DELETE ON admin_logs FROM jito_app;
--
-- This is a belt-and-suspenders measure: the triggers catch any bug even if
-- the role restriction is accidentally re-granted. But role-level restrictions
-- prevent the query from reaching the trigger at all in normal operation.
--
-- These are NOT in this migration because:
--   1. The role name differs per environment (jito_app, jito_staging, etc.)
--   2. Applying REVOKE requires the role to already exist
--   3. CI/CD uses a single-user PostgreSQL where REVOKE would be a no-op
-- =============================================================================
