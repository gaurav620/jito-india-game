/**
 * Cookie-refresh HTTP integration test — proves the Phase 2C carry-over fix,
 * AND protects against it silently regressing (Phase 2C hardening,
 * 2026-09-22).
 *
 * ROOT CAUSE (found during the Phase 2B PR review, docs/AUTH_V2.md §4):
 * AuthController and AdminAuthController read `req.cookies` for the httpOnly
 * refresh-token cookie, but `cookie-parser` was never registered as Express
 * middleware in main.ts. The cookie was set correctly on login (`Set-Cookie`
 * header present, `HttpOnly; SameSite=Strict`), but `req.cookies` was always
 * `undefined` at read time, so refresh silently fell through to the
 * body-only fallback and a cookie-only request returned
 * `401 "No refresh token provided"`.
 *
 * WHY THIS TEST PROTECTS main.ts, NOT JUST cookie-parser ITSELF:
 * The first version of this spec called `app.use(cookieParser())` directly,
 * inline in the test. That proved cookie-parser's own behavior but did NOT
 * fail if someone later deleted the registration from main.ts — the test
 * had its own independent copy. This version instead imports and calls
 * `configureApp()` from `../bootstrap` — the SAME function main.ts calls to
 * register cookie-parser (and everything else) in production. If
 * `app.use(cookieParser())` is ever removed from `configureApp()`, both
 * main.ts and this test lose it identically, and test 1 below (which
 * asserts the cookie is actually parsed) fails.
 *
 * TEST STRATEGY — real Nest app + a manually-wired route, not
 * Test.createTestingModule: this vitest project (`vitest.config.ts`) has no
 * decorator-metadata plugin, and esbuild (which Vite uses for the TS
 * transform) does not emit `design:paramtypes` the way `tsc` does.
 * Constructor-based Nest DI therefore silently resolves injected properties
 * to `undefined` inside `Test.createTestingModule`-based tests in THIS
 * project the moment a test calls a method that dereferences one —
 * confirmed by direct `Reflect.getMetadata('design:paramtypes',
 * AuthController)` returning `undefined` under this vitest config. This
 * applies to registering `AuthController` itself via Nest's `controllers:
 * [...]` array too (Nest resolves a controller's own constructor
 * dependencies the same way). So this suite:
 *   - builds a REAL `INestApplication` via `NestFactory.create()` on an
 *     empty module (no controllers/providers to resolve — nothing for the
 *     metadata gap to break) and runs the real `configureApp()` on it, and
 *   - instantiates `AuthController` directly (`new AuthController(stub,
 *     stub)`, bypassing Nest DI for the controller's own constructor, which
 *     is the part `Test.createTestingModule` cannot do reliably here) and
 *     wires its `refresh` method onto the app's underlying Express instance
 *     via `getHttpAdapter().getInstance()`.
 * Production is unaffected: `services/api/tsconfig.json` sets
 * `emitDecoratorMetadata: true` and the real build (`nest build` → `tsc`)
 * emits correct metadata, which is why the live-server curl testing in the
 * Phase 2B PR review worked.
 *
 * What this proves, using the actual production `configureApp()` and the
 * actual production `AuthController.refresh()` method body, unmodified:
 *   1. With `configureApp()` run (main.ts's real bootstrap path) — a refresh
 *      request with the token ONLY in the Cookie header (no body) reaches
 *      `AuthService.refresh()` with the correct raw token and returns 200.
 *   2. Without it — the same request reproduces the original bug (401,
 *      body-only fallback) — a regression guard proving test 1 actually
 *      exercises the fix rather than passing vacuously.
 *   3. The body-fallback path (desktop/mobile clients with no cookie jar)
 *      still works unchanged.
 */
import { Module } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BootstrapConfig } from '../bootstrap';
import { configureApp } from '../bootstrap';
import type { AppConfigService } from '../config/app-config.service';

import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

const REFRESH_COOKIE_NAME = 'jito_refresh';
const STUB_ROTATED_TOKENS = {
  accessToken: 'access.token.stub',
  refreshToken: 'new-rotated-refresh-token',
  expiresIn: 900,
};

@Module({})
class EmptyTestModule {}

function buildStubAuthService(): AuthService {
  return {
    refresh: vi.fn().mockResolvedValue(STUB_ROTATED_TOKENS),
  } as unknown as AuthService;
}

function buildStubConfigService(): AppConfigService {
  return {
    isProduction: false,
    jwtRefreshTtlSeconds: 604800,
  } as unknown as AppConfigService;
}

function buildStubBootstrapConfig(): BootstrapConfig {
  return { corsOrigins: [], isProduction: false };
}

/**
 * Build a real Nest app, optionally running the SAME `configureApp()`
 * production bootstrap uses, then mount the REAL `AuthController.refresh`
 * handler directly on its underlying Express instance. `withConfigureApp`
 * toggles the exact fix under test.
 */
async function buildNestServer(
  authController: AuthController,
  withConfigureApp: boolean,
): Promise<INestApplication> {
  const app = await NestFactory.create(EmptyTestModule, { logger: false });

  if (withConfigureApp) {
    configureApp(app, buildStubBootstrapConfig());
  }

  const expressInstance = app.getHttpAdapter().getInstance() as express.Application;

  // Nest's own default body-parser middleware attaches lazily (during
  // app.listen()/init()), which would run AFTER the route registered below
  // in Express's middleware order — leaving req.body undefined for it.
  // Register explicitly, synchronously, before the route, regardless of
  // configureApp (this is test scaffolding, not part of the fix under test).
  expressInstance.use(express.json());

  // Same method, same `this` binding, same production logic as the real
  // POST /api/v1/auth/refresh route — just invoked without Nest's own
  // controller routing layer (see file doc comment for why).
  expressInstance.post('/api/v1/auth/refresh', (req, res, next) => {
    authController.refresh(req.body, req as never, res as never).then(
      (body) => res.status(200).json(body),
      (err: unknown) => next(err),
    );
  });

  // Minimal error handler mirroring GlobalExceptionFilter's status-code passthrough.
  expressInstance.use(
    (
      err: { status?: number; getStatus?: () => number; message?: string },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const status = typeof err.getStatus === 'function' ? err.getStatus() : (err.status ?? 500);
      res.status(status).json({ success: false, message: err.message ?? 'error' });
    },
  );

  await app.listen(0, '127.0.0.1');
  return app;
}

describe('Cookie-only refresh (Phase 2C carry-over fix + regression guard)', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('1. FIX: configureApp() registered cookie-parser — refresh with token ONLY in the cookie succeeds', async () => {
    const authService = buildStubAuthService();
    const controller = new AuthController(authService, buildStubConfigService());
    app = await buildNestServer(controller, /* withConfigureApp */ true);
    const baseUrl = await app.getUrl();

    const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Token ONLY in the cookie — body deliberately omits refreshToken.
        Cookie: `${REFRESH_COOKIE_NAME}=cookie-only-raw-token`,
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; accessToken: string };
    expect(body.success).toBe(true);
    expect(body.accessToken).toBe(STUB_ROTATED_TOKENS.accessToken);

    // The critical assertion: AuthService.refresh() must have received the
    // RAW TOKEN FROM THE COOKIE, proving req.cookies was actually populated
    // — not just that the route didn't crash.
    expect(authService.refresh).toHaveBeenCalledWith('cookie-only-raw-token', expect.any(String));

    // New rotated cookie must be set on the response, with unchanged security attributes.
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain(`${REFRESH_COOKIE_NAME}=${STUB_ROTATED_TOKENS.refreshToken}`);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    expect(setCookie).toContain('Path=/api/v1/auth');
  });

  it('2. REGRESSION GUARD: without configureApp(), the same request reproduces the original bug', async () => {
    const authService = buildStubAuthService();
    const controller = new AuthController(authService, buildStubConfigService());
    app = await buildNestServer(controller, /* withConfigureApp */ false);
    const baseUrl = await app.getUrl();

    const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${REFRESH_COOKIE_NAME}=cookie-only-raw-token`,
      },
      body: JSON.stringify({}),
    });

    // Reproduces the exact bug found in the PR review: req.cookies is
    // undefined without the middleware, so the controller falls through to
    // the (absent) body token and rejects with 401.
    expect(res.status).toBe(401);
    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it('3. Body-fallback path still works (desktop/mobile clients with no cookie jar)', async () => {
    const authService = buildStubAuthService();
    const controller = new AuthController(authService, buildStubConfigService());
    app = await buildNestServer(controller, /* withConfigureApp */ true);
    const baseUrl = await app.getUrl();

    const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'body-only-raw-token' }),
    });

    expect(res.status).toBe(200);
    expect(authService.refresh).toHaveBeenCalledWith('body-only-raw-token', expect.any(String));
  });
});
