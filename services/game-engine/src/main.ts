/**
 * JITO Game Engine service bootstrap.
 *
 * Phase 2A review fixes (2026-09-10):
 *   Fix #5  — app.enableShutdownHooks() so SIGTERM triggers onModuleDestroy
 *             on EnginePrismaService and EngineRedisService.
 *   Fix #10 — Removed unused pino reference; using NestJS built-in logger.
 *   Fix #11 — Logger.error() uses NestJS signature (message, stack).
 */
import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { EngineAppModule } from './app.module';
import { EngineExceptionFilter } from './common/filters/engine-exception.filter';
import { EngineConfigService } from './config/engine-config.service';

async function bootstrap(): Promise<void> {
  const logger = new Logger('EngineBootstrap');

  const app = await NestFactory.create(EngineAppModule, {
    logger:
      process.env['NODE_ENV'] === 'production' ? ['error', 'warn'] : undefined,
  });

  // Fix #5: Enable graceful shutdown so SIGTERM triggers onModuleDestroy()
  // on EnginePrismaService (Prisma disconnects) and EngineRedisService (quits).
  app.enableShutdownHooks();

  const config = app.get(EngineConfigService);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Apply the engine exception filter globally
  app.useGlobalFilters(new EngineExceptionFilter());

  await app.listen(config.port);
  logger.log(
    `JITO Game Engine (single writer) listening on port ${config.port} [${config.nodeEnv}]`,
  );
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('EngineBootstrap');
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  // Fix #11: NestJS Logger.error(message, stack) — correct signature.
  logger.error(`Fatal error during engine bootstrap: ${message}`, stack);
  process.exit(1);
});
