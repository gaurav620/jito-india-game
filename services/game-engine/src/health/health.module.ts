import { Module } from '@nestjs/common';

import { EngineHealthController } from './health.controller';

@Module({
  controllers: [EngineHealthController],
})
export class EngineHealthModule {}
