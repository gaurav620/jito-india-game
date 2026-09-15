/**
 * AdminModule — admin authentication and admin-panel access boundary.
 *
 * Phase 2B provides the auth foundation only:
 *   POST /api/v1/admin/auth/login
 *   POST /api/v1/admin/auth/refresh
 *   POST /api/v1/admin/auth/logout
 *   GET  /api/v1/admin/auth/me
 *
 * Admin user management, player management, manual results, commission
 * configuration, and reporting are out of scope for Phase 2B.
 */
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AppConfigModule } from '../config/config.module';

import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';

@Module({
  imports: [AppConfigModule, AuthModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService],
})
export class AdminModule {}
