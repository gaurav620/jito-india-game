/**
 * NestJS module bootstrap smoke test for the JITO API service.
 *
 * Phase 2A review Fix #6: Adds a TestingModule.compile() smoke test that
 * verifies the DI wiring of the core infrastructure modules compiles without
 * runtime errors. This catches:
 *   - `import type` used where a value import is required (DI token missing)
 *   - Missing @Module providers/exports
 *   - Circular dependency issues
 *   - Decorator metadata errors
 *
 * This test does NOT compile the full AppModule (which requires env validation
 * via validateEnv) — instead, it compiles the core DI-wired modules with
 * mocked infrastructure. This is intentional: the full AppModule is exercised
 * by integration tests that provide env vars.
 *
 * The primary value is verifying that the DI token resolution works:
 *   - PrismaService can be injected (not `import type`)
 *   - RedisService can be injected (not `import type`)
 *   - HealthController can receive both via constructor injection
 */
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';

import { bigIntReplacer, safeJsonStringify } from './common/bigint-serializer';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PrismaService } from './database/prisma.service';
import { HealthController } from './health/health.controller';
import { RedisService } from './redis/redis.service';

// Mock infrastructure values — no real DB or Redis
const mockPrismaService = {
  $connect: async () => undefined,
  $disconnect: async () => undefined,
  $queryRaw: async () => [{ '?column?': 1 }],
  onModuleInit: async () => undefined,
  onModuleDestroy: async () => undefined,
  isHealthy: async () => true,
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
  raw: {},
};

// Minimal test module with only the DI tokens under test
@Module({
  providers: [
    { provide: PrismaService, useValue: mockPrismaService },
    { provide: RedisService, useValue: mockRedisService },
  ],
  controllers: [HealthController],
})
class TestHealthModule {}

describe('DI wiring smoke tests (Fix #1, Fix #6)', () => {
  let moduleRef: Awaited<ReturnType<typeof Test.createTestingModule>['compile']>;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestHealthModule],
    }).compile();
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('compiles DI graph with PrismaService and RedisService as value imports', () => {
    // If DI tokens are `import type`, this beforeAll throws:
    // "Nest can't resolve dependencies of HealthController"
    expect(moduleRef).toBeDefined();
  });

  it('resolves PrismaService from the DI container', () => {
    const service = moduleRef.get(PrismaService);
    expect(service).toBeDefined();
    expect(service.isHealthy).toBeDefined();
  });

  it('resolves RedisService from the DI container', () => {
    const service = moduleRef.get(RedisService);
    expect(service).toBeDefined();
    expect(service.isHealthy).toBeDefined();
  });

  it('resolves HealthController from the DI container', () => {
    const controller = moduleRef.get(HealthController);
    expect(controller).toBeDefined();
  });

  it('HealthController.liveness() works with DI-resolved dependencies', () => {
    const controller = moduleRef.get(HealthController);
    const result = controller.liveness();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('jito-api');
  });
});

describe('GlobalExceptionFilter can be instantiated (Fix #6)', () => {
  it('GlobalExceptionFilter instantiates without DI errors', () => {
    const filter = new GlobalExceptionFilter();
    expect(filter).toBeDefined();
  });
});

describe('BigInt serializer is importable and functional (Fix #9)', () => {
  it('safeJsonStringify converts BigInt fields', () => {
    const result = safeJsonStringify({ balance: 1000n });
    expect(result).toBe('{"balance":"1000"}');
  });

  it('bigIntReplacer converts BigInt values', () => {
    expect(bigIntReplacer('key', 500n)).toBe('500');
  });
});
