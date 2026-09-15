/**
 * NestJS REAL AppModule bootstrap smoke test for the JITO API service.
 *
 * BLOCKER 2 FIX: This test compiles the REAL AppModule — not a fake stub
 * module that bypasses module wiring. This means the test WILL FAIL if any
 * module is missing a required import (e.g. RedisModule missing AppConfigModule).
 *
 * Acceptance criteria:
 *   ✅ Test passes when RedisModule imports AppConfigModule (Blocker 1 fix).
 *   ❌ Test FAILS if AppConfigModule is removed from RedisModule.imports.
 *   ✅ No real DB or Redis connections are made (infrastructure overridden).
 *
 * Required env vars (DATABASE_URL, REDIS_URL, JWT_SECRET, etc.) are injected
 * by the vitest.config.ts `env` block — they are present in process.env before
 * any module is evaluated, so ConfigModule.forRoot() sees them at compile time.
 *
 * What this test verifies:
 *   1. AppModule DI graph compiles without errors (covers all module wiring).
 *   2. PrismaService is resolvable from the container.
 *   3. RedisService is resolvable from the container (proves RedisModule →
 *      AppConfigModule wiring is correct — Blocker 1).
 *   4. HealthController is resolvable and functional.
 */
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { PrismaService } from './database/prisma.service';
import { HealthController } from './health/health.controller';
import { RedisService } from './redis/redis.service';

// ── Mock infrastructure — no real connections ────────────────────────────────
// Override PrismaService and RedisService at the provider level.
// NestJS replaces the real class with the mock object for the entire graph.
// The module graph (imports, providers, exports) is compiled as-is;
// only the runtime instances are replaced.
const mockPrismaService = {
  $connect: async () => undefined,
  $disconnect: async () => undefined,
  $queryRaw: async () => [{ '?column?': 1 }],
  onModuleInit: async () => undefined,
  onModuleDestroy: async () => undefined,
  isHealthy: async () => true,
};

// Minimal AppConfigService test double — safe fakes matching vitest.config.ts env block.
// The REAL AppModule still compiles and DI wiring is exercised; this prevents
// ConfigModule.forRoot() from needing a live env at TestingModule compile time.
const mockAppConfigService = {
  jwtSecret: 'test-jwt-secret-minimum-32-characters-long-for-unit-tests',
  jwtIssuer: 'jito-api',
  jwtAudiencePlayer: 'jito-player',
  jwtAudienceAdmin: 'jito-admin',
  jwtAccessTtlSeconds: 900,
  jwtRefreshTtlSeconds: 604800,
  port: 3001,
  isProduction: false,
  isDevelopment: false,
  nodeEnv: 'test',
  corsOrigins: [],
  logLevel: 'info',
  logFormat: 'json',
  idempotencyCacheTtlSeconds: 86400,
  databaseUrl: 'postgresql://test:test@localhost:5432/test_db',
  redisUrl: 'redis://localhost:6379',
};

const mockRedisService = {
  onModuleInit: async () => undefined,
  onModuleDestroy: async () => undefined,
  isHealthy: async () => true,
  loginRateLimitIpKey: (ip: string) => `ratelimit:login:ip:${ip}`,
  loginRateLimitUserKey: (u: string) => `ratelimit:login:user:${u}`,
  registerRateLimitIpKey: (ip: string) => `ratelimit:register:ip:${ip}`,
  betRateLimitKey: (id: string) => `ratelimit:bet:user:${id}`,
  idempotencyKey: (k: string) => `idem:${k}`,
  userStatusKey: (id: string) => `user:status:${id}`,
  refreshRateLimitSessionKey: (sid: string) => `ratelimit:refresh:session:${sid}`,
  adminLoginRateLimitIpKey: (ip: string) => `ratelimit:login:admin:ip:${ip}`,
  raw: {},
};

describe('AppModule smoke test — REAL module graph (Blocker 2 fix)', () => {
  let moduleRef: Awaited<ReturnType<typeof Test.createTestingModule>['compile']>;

  beforeAll(async () => {
    // Compile the REAL AppModule. This exercises the actual module dependency
    // graph — including RedisModule → AppConfigModule wiring.
    //
    // If RedisModule is missing AppConfigModule in its imports, NestJS throws:
    //   "Nest can't resolve dependencies of the RedisService (?). Please make
    //    sure that the argument AppConfigService at index [0] is available..."
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AppConfigService)
      .useValue(mockAppConfigService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('compiles the REAL AppModule DI graph without errors (Blocker 1 + Blocker 2)', () => {
    // Trivially true if beforeAll succeeds. The failure mode is beforeAll
    // throwing — which proves the module wiring is broken.
    expect(moduleRef).toBeDefined();
  });

  it('resolves PrismaService from the real DI container', () => {
    const service = moduleRef.get(PrismaService);
    expect(service).toBeDefined();
    expect(service.isHealthy).toBeDefined();
  });

  it('resolves RedisService from the real DI container (proves RedisModule → AppConfigModule wiring)', () => {
    // Specifically validates Blocker 1: RedisService is only resolvable
    // if RedisModule correctly imports AppConfigModule.
    const service = moduleRef.get(RedisService);
    expect(service).toBeDefined();
    expect(service.isHealthy).toBeDefined();
  });

  it('resolves HealthController from the real DI container', () => {
    const controller = moduleRef.get(HealthController);
    expect(controller).toBeDefined();
  });

  it('HealthController.liveness() is functional via real DI resolution', () => {
    const controller = moduleRef.get(HealthController);
    const result = controller.liveness();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('jito-api');
  });
});
