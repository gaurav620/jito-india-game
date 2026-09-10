/**
 * Users module — scaffold for Phase 2A.
 *
 * Full implementation deferred to Phase 2B (step 4 of the implementation plan).
 *
 * Will implement:
 *   GET   /api/v1/users/profile   — own profile (from token, no :id)
 *   PATCH /api/v1/users/profile   — update displayName
 *   PATCH /api/v1/users/password  — change password (requires current password)
 *
 * NOTE: There is no /users/:id endpoint. Every player-scoped route resolves
 * the user from the token (docs/AUTH_V2.md §9). Cross-account access is a
 * structural impossibility, not a guard that could be forgotten.
 */
import { Module } from '@nestjs/common';

@Module({})
export class UsersModule {}
