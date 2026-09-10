/**
 * Redis module for the JITO API service.
 *
 * Explicitly imports AppConfigModule so that AppConfigService is available
 * for injection into RedisService. Although ConfigModule (from @nestjs/config)
 * is registered globally via ConfigModule.forRoot({ isGlobal: true }), the
 * AppConfigService wrapper class is NOT automatically global — it must be
 * explicitly exported by AppConfigModule and imported by any module that injects it.
 *
 * Blocker fix: RedisService constructor-injects AppConfigService. Without this
 * import, NestJS cannot resolve the AppConfigService DI token for RedisService,
 * and the application will throw at startup:
 *   "Nest can't resolve dependencies of the RedisService"
 */
import { Global, Module } from '@nestjs/common';

import { AppConfigModule } from '../config/config.module';

import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
