import { Global, Module } from '@nestjs/common';

import { EngineRedisService } from './redis.service';

@Global()
@Module({
  providers: [EngineRedisService],
  exports: [EngineRedisService],
})
export class EngineRedisModule {}
