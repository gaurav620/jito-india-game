/**
 * configureApp — global middleware/pipe/filter/interceptor/prefix/CORS
 * registration shared between main.ts's production bootstrap and
 * auth/cookie-refresh.integration.spec.ts.
 *
 * Extracted from main.ts's bootstrap() (Phase 2C hardening, 2026-09-22) so
 * the regression test protecting cookie-parser registration exercises this
 * EXACT function rather than a hand-rolled copy of it. A copy can drift from
 * production and keep passing even if main.ts's real registration breaks;
 * calling the same function cannot — if `app.use(cookieParser())` is ever
 * removed from here, both main.ts and the test lose it identically, and the
 * test (which asserts cookie-based refresh actually works) fails.
 */
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';

/** The subset of AppConfigService this function actually reads. */
export interface BootstrapConfig {
  corsOrigins: string[];
  isProduction: boolean;
}

export function configureApp(app: INestApplication, config: BootstrapConfig): void {
  // Parse the httpOnly refresh-token cookie into req.cookies. Must run
  // before any route handler reads it (AuthController, AdminAuthController).
  app.use(cookieParser());

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
}
