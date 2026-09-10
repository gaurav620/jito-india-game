/**
 * JITO API service bootstrap.
 *
 * Bootstrap order:
 *   1. Create NestJS app
 *   2. Enable graceful shutdown hooks (SIGTERM → onModuleDestroy lifecycle)
 *   3. Apply global validation pipe (class-validator DTOs)
 *   4. Apply global exception filter (standard error envelope)
 *   5. Apply global interceptor (X-Request-Id)
 *   6. Set global prefix /api/v1
 *   7. Enable CORS (origins from config)
 *   8. Listen on configured port
 *
 * Security notes:
 *   - ValidationPipe: whitelist + forbidNonWhitelisted to prevent field smuggling
 *   - ExceptionFilter: no stack traces in production responses
 *   - CORS: origins from env, not wildcard in production
 *
 * Phase 2A review fixes (2026-09-10):
 *   Fix #5  — app.enableShutdownHooks() so SIGTERM triggers onModuleDestroy
 *             on PrismaService and RedisService for clean connection shutdown.
 *   Fix #10 — Removed unused pino/pino-http deps; using NestJS built-in logger.
 *   Fix #11 — Logger.error() calls use NestJS signature (message, stack).
 */
import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // Use NestJS built-in logger. Pino integration can be added later via
    // nestjs-pino if structured logging is needed in production — see PROJECT_CONTEXT.md.
    logger: process.env['NODE_ENV'] === 'production' ? ['error', 'warn'] : undefined,
  });

  // Fix #5: Enable graceful shutdown so SIGTERM from ECS/Docker triggers
  // onModuleDestroy() on all services (Prisma disconnects, Redis quits).
  // Without this, containers are force-killed after the timeout with open connections.
  app.enableShutdownHooks();

  const config = app.get(AppConfigService);

  // Global route prefix
  app.setGlobalPrefix('api/v1');

  // Input validation — strip unknown fields, fail on non-whitelisted
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  // Standard error envelope — no stack traces in responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Request ID correlation
  app.useGlobalInterceptors(new RequestIdInterceptor());

  // CORS
  const origins = config.corsOrigins;
  if (origins.length > 0) {
    app.enableCors({ origin: origins, credentials: true });
  } else if (!config.isProduction) {
    app.enableCors({ origin: true, credentials: true });
  }

  await app.listen(config.port);
  logger.log(`JITO API listening on port ${config.port} [${config.nodeEnv}]`);
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  // Fix #11: NestJS Logger.error(message, stack) — correct signature.
  logger.error(`Fatal error during bootstrap: ${message}`, stack);
  process.exit(1);
});
