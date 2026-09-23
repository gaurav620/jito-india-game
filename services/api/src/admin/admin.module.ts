/**
 * AdminModule — admin authentication, points adjustment, and admin-panel
 * access boundary.
 *
 * Phase 2B provided the auth foundation:
 *   POST /api/v1/admin/auth/login
 *   POST /api/v1/admin/auth/refresh
 *   POST /api/v1/admin/auth/logout
 *   GET  /api/v1/admin/auth/me
 *
 * Phase 2C adds points administration (docs/API_V2.md §8.2):
 *   POST /api/v1/admin/users/:id/points/adjust
 *
 * PointsModule is imported to reuse PointsLedgerService — the same
 * transactional mutation primitive used everywhere else points are moved
 * (ADR-028). AdminPointsService composes it into a transaction that also
 * writes the admin_logs audit row.
 *
 * Admin user management, player management, manual results, commission
 * configuration, and reporting remain out of scope for Phase 2C.
 */
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AppConfigModule } from '../config/config.module';
import { PointsModule } from '../points/points.module';

import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminPointsController } from './points/admin-points.controller';
import { AdminPointsService } from './points/admin-points.service';

@Module({
  imports: [AppConfigModule, AuthModule, PointsModule],
  controllers: [AdminAuthController, AdminPointsController],
  providers: [AdminAuthService, AdminPointsService],
})
export class AdminModule {}
