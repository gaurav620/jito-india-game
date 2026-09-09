-- =============================================================================
-- JITO INDIA GAMES — PostgreSQL init script (local dev only)
-- =============================================================================
-- This script runs once when the Docker container is first created.
-- It creates the extensions required by Prisma (uuid-ossp, pgcrypto).
-- The actual schema is managed by Prisma migrations (prisma migrate dev).
-- =============================================================================

-- Enable gen_random_uuid() for UUID primary keys
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
