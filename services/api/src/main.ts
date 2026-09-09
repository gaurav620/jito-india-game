/**
 * JITO API service bootstrap.
 *
 * Bootstrap order:
 *   1. Create NestJS app
 *   2. Apply global validation pipe (class-validator DTOs)
 *   3. Apply global exception filter (standard error envelope)
 *   4. Apply global interceptor (X-Request-Id)
 *   5. Set global prefix /api/v1
 *   6. Enable CORS (origins from config)
 *   7. Listen on configured port
 *
 * Security notes:
 *   - ValidationPipe: whitelist + forbidNonWhitelisted to prevent field smuggling
 *   - ExceptionFilter: no stack traces in production responses
 *   - CORS: origins from env, not wildcard in production
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
    // Disable NestJS default logger in production; structured logging via pino
    logger: process.env['NODE_ENV'] === 'production' ? ['error', 'warn'] : undefined,
  });

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
  logger.error({ err }, 'Fatal error during bootstrap');
  process.exit(1);
});
