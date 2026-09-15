/**
 * Root application module for the JITO Game Engine service.
 *
 * The game engine is a SINGLE WRITER (ADR-017). It is intentionally designed
 * to run as exactly one ECS task instance. This module assembles only the
 * foundation required for Phase 2A. The scheduler (step 9) and settlement
 * (step 10) modules are added in Phase 2B.
 */
import { Module } from '@nestjs/common';

import { EngineConfigModule } from './config/config.module';
import { EnginePrismaModule } from './database/prisma.module';
import { EngineHealthModule } from './health/health.module';
import { EngineRedisModule } from './redis/redis.module';

@Module({
  imports: [
    // Infrastructure (global)
    EngineConfigModule,
    EnginePrismaModule,
    EngineRedisModule,
    // Operational
    EngineHealthModule,
    // Phase 2B modules (not yet implemented):
    //   SchedulerModule (reconciling tick — GAME_ENGINE_V2.md §5)
    //   RoundsModule    (state machine — GAME_ENGINE_V2.md §2)
    //   ResultModule    (ManualResultSource — GAME_ENGINE_V2.md §6)
    //   SettlementModule (envelope only, no arithmetic — GAME_ENGINE_V2.md §7)
  ],
})
export class EngineAppModule {}
