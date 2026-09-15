/**
 * AuthModule — player authentication and shared guard infrastructure.
 *
 * Provides and exports guards used by UsersModule, AdminModule, and future
 * feature modules:
 *   - PlayerJwtGuard + PlayerJwtStrategy
 *   - AdminJwtGuard + AdminJwtStrategy
 *   - UserStatusGuard
 *   - AdminStatusGuard
 *   - RolesGuard
 *
 * JwtModule is configured async to pull the secret from AppConfigService
 * (which reads from the validated environment at startup).
 *
 * Phase 2B implements:
 *   POST /api/v1/auth/register
 *   POST /api/v1/auth/login
 *   POST /api/v1/auth/refresh
 *   POST /api/v1/auth/logout
 *   POST /api/v1/auth/logout-all
 *   GET  /api/v1/auth/me
 *
 * NOT IN PHASE 2: forgot-password flow (NEEDS CLIENT CONFIRMATION item 3).
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AppConfigService } from '../config/app-config.service';
import { AppConfigModule } from '../config/config.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { AdminJwtGuard } from './guards/admin-jwt.guard';
import { AdminStatusGuard } from './guards/admin-status.guard';
import { PlayerJwtGuard } from './guards/player-jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { UserStatusGuard } from './guards/user-status.guard';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { PlayerJwtStrategy } from './strategies/player-jwt.strategy';

void CurrentUser; // re-exported for external use

@Module({
  imports: [
    AppConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtSecret,
        signOptions: {
          expiresIn: config.jwtAccessTtlSeconds,
          issuer: config.jwtIssuer,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PlayerJwtStrategy,
    AdminJwtStrategy,
    PlayerJwtGuard,
    AdminJwtGuard,
    UserStatusGuard,
    AdminStatusGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    JwtModule,
    PlayerJwtGuard,
    AdminJwtGuard,
    UserStatusGuard,
    AdminStatusGuard,
    RolesGuard,
    PlayerJwtStrategy,
    AdminJwtStrategy,
  ],
})
export class AuthModule {}
