/**
 * NestJS DI smoke test for the JITO Game Engine service.
 *
 * Phase 2A review Fix #6: Verifies that the core DI-injected services
 * (EnginePrismaService, EngineRedisService, EngineHealthController) can
 * be resolved by the NestJS DI container without runtime errors.
 *
 * IMPORTANT: This test does NOT import EngineAppModule because that triggers
 * ConfigModule.forRoot({ validate: validateEngineEnv }) which requires
 * DATABASE_URL and REDIS_URL env vars. Instead we compile a targeted
 * TestEngineModule with only the tokens under test.
 *
 * What this test proves:
 *   - EnginePrismaService is imported with a VALUE import (not `import type`)
 *     so Reflect.metadata can resolve it as a DI token.
 *   - EngineRedisService is imported with a VALUE import.
 *   - EngineHealthController constructor injection compiles correctly.
 *   - The @Injectable() / @Controller() decorators are properly applied.
 *
 * For integration tests with real env, use the E2E test suite.
 */
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';

// Value imports required — this is the primary assertion of Fix #1 for engine
import { EnginePrismaService } from './database/prisma.service';
import { EngineHealthController } from './health/health.controller';
import { EngineRedisService } from './redis/redis.service';

// Mock infrastructure values — no real DB or Redis in unit tests
const mockEnginePrismaService = {
  $connect: async () => undefined,
  $disconnect: async () => undefined,
  $queryRaw: async () => [{ '?column?': 1 }],
  onModuleInit: async () => undefined,
  onModuleDestroy: async () => undefined,
  isHealthy: async () => true,
};

const mockEngineRedisService = {
  onModuleInit: async () => undefined,
  onModuleDestroy: async () => undefined,
  isHealthy: async () => true,
  acquireLeaderLock: async () => true,
  renewLeaderLock: async () => true,
  releaseLeaderLock: async () => undefined,
  publishRoundEvent: async () => undefined,
  raw: {},
};

// Minimal module — only the tokens whose DI wiring we need to verify.
// Does NOT include EngineConfigModule / ConfigModule so no env validation runs.
@Module({
  providers: [
    { provide: EnginePrismaService, useValue: mockEnginePrismaService },
    { provide: EngineRedisService, useValue: mockEngineRedisService },
  ],
  controllers: [EngineHealthController],
})
class TestEngineHealthModule {}

describe('Engine DI wiring smoke tests (Fix #1, Fix #6)', () => {
  let moduleRef: Awaited<ReturnType<typeof Test.createTestingModule>['compile']>;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestEngineHealthModule],
    }).compile();
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('compiles DI graph with EnginePrismaService and EngineRedisService as value imports', () => {
    // If DI tokens are `import type`, NestJS throws:
    // "Nest can't resolve dependencies of EngineHealthController"
    expect(moduleRef).toBeDefined();
  });

  it('resolves EnginePrismaService from the DI container', () => {
    const service = moduleRef.get(EnginePrismaService);
    expect(service).toBeDefined();
    expect(service.isHealthy).toBeDefined();
  });

  it('resolves EngineRedisService from the DI container', () => {
    const service = moduleRef.get(EngineRedisService);
    expect(service).toBeDefined();
    expect(service.isHealthy).toBeDefined();
  });

  it('resolves EngineHealthController from the DI container', () => {
    const controller = moduleRef.get(EngineHealthController);
    expect(controller).toBeDefined();
  });

  it('EngineHealthController.liveness() works with DI-resolved dependencies', () => {
    const controller = moduleRef.get(EngineHealthController);
    const result = controller.liveness();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('jito-game-engine');
  });
});
