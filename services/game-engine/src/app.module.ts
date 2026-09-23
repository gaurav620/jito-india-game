/**
 * Root application module for the JITO Game Engine service.
 *
 * The game engine is a SINGLE WRITER (ADR-017). It is intentionally designed
 * to run as exactly one ECS task instance.
 *
 * Phase 2D / Step 6 adds RoundsModule: the round lifecycle state machine
 * (ROUND_CREATED → BETTING_OPEN → BETTING_LOCKED only — see rounds.service.ts
 * doc comment for the exact Step 6 boundary) plus the reconciling scheduler
 * tick and leader-lock wiring (docs/GAME_ENGINE_V2.md §5, ADR-019).
 */
import { Module } from '@nestjs/common';

import { EngineConfigModule } from './config/config.module';
import { EnginePrismaModule } from './database/prisma.module';
import { EngineHealthModule } from './health/health.module';
import { EngineRedisModule } from './redis/redis.module';
import { RoundsModule } from './rounds/rounds.module';

@Module({
  imports: [
    // Infrastructure (global)
    EngineConfigModule,
    EnginePrismaModule,
    EngineRedisModule,
    // Operational
    EngineHealthModule,
    // Round lifecycle (Phase 2D, Step 6)
    RoundsModule,
    // Not yet implemented:
    //   ResultModule    (ManualResultSource — GAME_ENGINE_V2.md §6, Step 9)
    //   SettlementModule (envelope only, no arithmetic — GAME_ENGINE_V2.md §7, Step 10)
  ],
})
export class EngineAppModule {}
