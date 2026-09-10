import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EngineConfigService } from './engine-config.service';
import { validateEngineEnv } from './env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEngineEnv,
      ignoreEnvFile: process.env['NODE_ENV'] === 'production',
    }),
  ],
  providers: [EngineConfigService],
  exports: [EngineConfigService],
})
export class EngineConfigModule {}
