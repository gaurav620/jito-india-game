/**
 * Admin module — scaffold for Phase 2A.
 *
 * Full implementation deferred to Phase 2B (step 12 of the implementation plan).
 * Gated on client confirmation of admin role matrix (NEEDS CLIENT CONFIRMATION item 8).
 *
 * Will implement (all under /api/v1/admin/, aud: jito-admin):
 *   Dashboard, Users, Points Administration, Rounds & Results,
 *   History, Reports, Announcements, Downloads, Audit Logs
 *
 * Security: separate admin_users table + JWT aud: jito-admin (ADR-021).
 * A player token is structurally unusable against any admin endpoint.
 * Every mutating admin call writes an admin_logs row in the same transaction.
 *
 * THERE IS NO PAYMENT ADMINISTRATION. No deposit, withdrawal, or payment
 * endpoint exists or may be added (ADR-011).
 */
import { Module } from '@nestjs/common';

@Module({})
export class AdminModule {}
