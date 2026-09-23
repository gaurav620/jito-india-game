/**
 * RoundsModule — round lifecycle state machine + reconciling scheduler
 * (docs/GAME_ENGINE_V2.md §2, §5; docs/PHASE_2_IMPLEMENTATION_PLAN.md Step 6).
 *
 * EngineConfigModule is imported explicitly: EngineConfigService is NOT
 * global (only the underlying @nestjs/config ConfigModule is) — same
 * requirement documented in EngineRedisModule.
 *
 * EnginePrismaModule and EngineRedisModule are both @Global() already
 * (registered once in EngineAppModule), so they need no explicit import here.
 */
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { EngineConfigModule } from '../config/config.module';

import { RoundSchedulerService } from './round-scheduler.service';
import { RoundsService } from './rounds.service';

@Module({
  imports: [EngineConfigModule, ScheduleModule.forRoot()],
  providers: [RoundsService, RoundSchedulerService],
  exports: [RoundsService],
})
export class RoundsModule {}
