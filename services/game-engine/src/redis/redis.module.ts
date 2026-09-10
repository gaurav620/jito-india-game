/**
 * Redis module for the JITO Game Engine service.
 *
 * Explicitly imports EngineConfigModule so that EngineConfigService is
 * available for injection into EngineRedisService. Although ConfigModule
 * (from @nestjs/config) is registered globally via ConfigModule.forRoot({
 * isGlobal: true }), the EngineConfigService wrapper class is NOT
 * automatically global — it must be explicitly exported by EngineConfigModule
 * and imported by any module that injects it.
 *
 * Blocker fix: EngineRedisService constructor-injects EngineConfigService.
 * Without this import, NestJS cannot resolve the EngineConfigService DI token
 * for EngineRedisService, and the application will throw at startup:
 *   "Nest can't resolve dependencies of the EngineRedisService"
 */
import { Global, Module } from '@nestjs/common';

import { EngineConfigModule } from '../config/config.module';

import { EngineRedisService } from './redis.service';

@Global()
@Module({
  imports: [EngineConfigModule],
  providers: [EngineRedisService],
  exports: [EngineRedisService],
})
export class EngineRedisModule {}
