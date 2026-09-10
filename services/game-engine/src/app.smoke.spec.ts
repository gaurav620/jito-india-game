/**
 * NestJS REAL EngineAppModule bootstrap smoke test for the JITO Game Engine.
 *
 * BLOCKER 2 FIX: Compiles the REAL EngineAppModule — not a fake stub module.
 * Will FAIL if EngineRedisModule is missing EngineConfigModule in its imports.
 *
 * Acceptance criteria:
 *   ✅ Test passes when EngineRedisModule imports EngineConfigModule (Blocker 1 fix).
 *   ❌ Test FAILS if EngineConfigModule is removed from EngineRedisModule.imports.
 *   ✅ No real DB or Redis connections are made (infrastructure overridden).
 *
 * Required env vars (DATABASE_URL, REDIS_URL) are injected by vitest.config.ts
 * `env` block. See services/api/src/app.smoke.spec.ts for full rationale.
 */
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { EngineAppModule } from './app.module';
import { EnginePrismaService } from './database/prisma.service';
import { EngineHealthController } from './health/health.controller';
import { EngineRedisService } from './redis/redis.service';

// ── Mock infrastructure ───────────────────────────────────────────────────────
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

describe('EngineAppModule smoke test — REAL module graph (Blocker 2 fix)', () => {
  let moduleRef: Awaited<ReturnType<typeof Test.createTestingModule>['compile']>;

  beforeAll(async () => {
    // Compile the REAL EngineAppModule — exercises actual module dependency graph.
    //
    // If EngineRedisModule is missing EngineConfigModule in its imports,
    // NestJS throws:
    //   "Nest can't resolve dependencies of the EngineRedisService (?). Please
    //    make sure that the argument EngineConfigService at index [0] is available..."
    moduleRef = await Test.createTestingModule({
      imports: [EngineAppModule],
    })
      .overrideProvider(EnginePrismaService)
      .useValue(mockEnginePrismaService)
      .overrideProvider(EngineRedisService)
      .useValue(mockEngineRedisService)
      .compile();
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('compiles the REAL EngineAppModule DI graph without errors (Blocker 1 + Blocker 2)', () => {
    expect(moduleRef).toBeDefined();
  });

  it('resolves EnginePrismaService from the real DI container', () => {
    const service = moduleRef.get(EnginePrismaService);
    expect(service).toBeDefined();
    expect(service.isHealthy).toBeDefined();
  });

  it('resolves EngineRedisService from the real DI container (proves EngineRedisModule → EngineConfigModule wiring)', () => {
    const service = moduleRef.get(EngineRedisService);
    expect(service).toBeDefined();
    expect(service.isHealthy).toBeDefined();
  });

  it('resolves EngineHealthController from the real DI container', () => {
    const controller = moduleRef.get(EngineHealthController);
    expect(controller).toBeDefined();
  });

  it('EngineHealthController.liveness() is functional via real DI resolution', () => {
    const controller = moduleRef.get(EngineHealthController);
    const result = controller.liveness();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('jito-game-engine');
  });
});
