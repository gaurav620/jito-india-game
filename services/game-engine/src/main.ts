import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { EngineAppModule } from './app.module';
import { EngineConfigService } from './config/engine-config.service';

async function bootstrap(): Promise<void> {
  const logger = new Logger('EngineBootstrap');

  const app = await NestFactory.create(EngineAppModule, {
    logger:
      process.env['NODE_ENV'] === 'production' ? ['error', 'warn'] : undefined,
  });

  const config = app.get(EngineConfigService);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(config.port);
  logger.log(
    `JITO Game Engine (single writer) listening on port ${config.port} [${config.nodeEnv}]`,
  );
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('EngineBootstrap');
  logger.error({ err }, 'Fatal error during engine bootstrap');
  process.exit(1);
});
