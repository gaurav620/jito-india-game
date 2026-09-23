-- =============================================================================
-- JITO INDIA GAMES — Phase 2B Auth Migration
-- =============================================================================
-- Adds admin session support to the sessions table (ADR-026).
-- Adds NO application-layer business rules as DB constraints
-- (registration email/phone requirement remains INTERIM — NEEDS CLIENT CONFIRMATION).
--
-- Changes:
--   1. sessions.admin_id — nullable FK to admin_users(id)
--   2. sessions.user_id — made nullable (admin sessions have no user_id)
--   3. FK constraint: fk_sessions_admin_id
--   4. XOR CHECK: exactly one of user_id / admin_id must be non-null
--   5. Index: idx_sessions_admin_id (partial, WHERE admin_id IS NOT NULL)
-- =============================================================================

-- 1. Add admin_id column (nullable)
ALTER TABLE "sessions" ADD COLUMN "admin_id" UUID;

-- 2. Make user_id nullable — admin sessions will have user_id = NULL
ALTER TABLE "sessions" ALTER COLUMN "user_id" DROP NOT NULL;

-- 3. FK to admin_users
ALTER TABLE "sessions" ADD CONSTRAINT "fk_sessions_admin_id"
  FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE CASCADE;

-- 4. Exactly-one-owner constraint (XOR, not OR)
--    A session must belong to either a player OR an admin, never both, never neither.
ALTER TABLE "sessions" ADD CONSTRAINT "chk_sessions_exactly_one_owner" CHECK (
  ("user_id" IS NOT NULL AND "admin_id" IS NULL)
  OR
  ("user_id" IS NULL AND "admin_id" IS NOT NULL)
);

-- 5. Partial index for efficient admin session lookups
CREATE INDEX "idx_sessions_admin_id" ON "sessions"("admin_id")
  WHERE "admin_id" IS NOT NULL;
