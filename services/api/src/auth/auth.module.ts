/**
 * Auth module — scaffold for Phase 2A.
 *
 * Full implementation deferred to Phase 2B (step 4 of the implementation plan).
 * Requires: JWT secret confirmed, argon2id parameters finalised (AUTH_V2.md §5).
 *
 * Will implement:
 *   POST /api/v1/auth/register   — create player + points account (one transaction)
 *   POST /api/v1/auth/login      — argon2id verify, issue access+refresh tokens
 *   POST /api/v1/auth/refresh    — rotate refresh token with reuse detection
 *   POST /api/v1/auth/logout     — revoke session
 *   POST /api/v1/auth/logout-all — revoke all user sessions
 *   GET  /api/v1/auth/me         — current user + balance
 *
 * NOT IN PHASE 2: forgot-password flow (NEEDS CLIENT CONFIRMATION item 5).
 */
import { Module } from '@nestjs/common';

@Module({})
export class AuthModule {}
