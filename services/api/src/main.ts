/**
 * JITO API service bootstrap.
 *
 * Bootstrap order:
 *   1. Create NestJS app
 *   2. Enable graceful shutdown hooks (SIGTERM → onModuleDestroy lifecycle)
 *   3. Register cookie-parser (refresh-token cookies — auth.controller.ts, admin-auth.controller.ts)
 *   4. Apply global validation pipe (class-validator DTOs)
 *   5. Apply global exception filter (standard error envelope)
 *   6. Apply global interceptor (X-Request-Id)
 *   7. Set global prefix /api/v1
 *   8. Enable CORS (origins from config)
 *   9. Listen on configured port
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
 *
 * Phase 2C carry-over fix (2026-09-22):
 *   AuthController and AdminAuthController read `req.cookies` for the httpOnly
 *   refresh-token cookie path, but `cookie-parser` was never registered — the
 *   cookie was set correctly on login but `req.cookies` was always undefined,
 *   so refresh silently fell through to the body-only path. See
 *   services/api/src/auth/cookie-refresh.integration.spec.ts.
 *
 * Phase 2C hardening (2026-09-22):
 *   Steps 3-8 (cookie-parser through CORS) live in ./bootstrap.ts's
 *   configureApp(), which the integration spec above also calls — so the
 *   regression test fails if cookie-parser registration is ever removed
 *   from there, not just from a test-local copy of it.
 */
import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
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

  // Cookie-parser, global prefix, validation pipe, exception filter, request
  // ID interceptor, CORS — see ./bootstrap.ts's configureApp() doc comment.
  configureApp(app, config);

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
