/**
 * Root application module for the JITO API service.
 *
 * Module assembly order is deliberate:
 *   1. AppConfigModule (global) — validates env before anything else tries to read it
 *   2. PrismaModule (global)    — DB connection available everywhere
 *   3. RedisModule (global)     — Redis connection available everywhere
 *   4. HealthModule             — health endpoints, no auth required
 *   5. Feature modules          — scaffolded for Phase 2B implementation
 */
import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BetsModule } from './bets/bets.module';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma.module';
import { GamesModule } from './games/games.module';
import { HealthModule } from './health/health.module';
import { HistoryModule } from './history/history.module';
import { PointsModule } from './points/points.module';
import { RedisModule } from './redis/redis.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Infrastructure (global)
    AppConfigModule,
    PrismaModule,
    RedisModule,
    // Operational
    HealthModule,
    // Feature modules (scaffolded — full implementation in Phase 2B)
    AuthModule,
    UsersModule,
    PointsModule,
    GamesModule,
    BetsModule,
    HistoryModule,
    ReportsModule,
    AdminModule,
  ],
})
export class AppModule {}
