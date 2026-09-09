/**
 * Tests for EngineHealthController (game-engine service).
 */
import { describe, expect, it, vi } from 'vitest';

import { EngineHealthController } from './health.controller';

function makePrisma(healthy = true) {
  return { isHealthy: vi.fn().mockResolvedValue(healthy) };
}

function makeRedis(healthy = true) {
  return { isHealthy: vi.fn().mockResolvedValue(healthy) };
}

describe('EngineHealthController', () => {
  describe('liveness()', () => {
    it('returns status ok with service name jito-game-engine', () => {
      const controller = new EngineHealthController(
        makePrisma() as never,
        makeRedis() as never,
      );
      const result = controller.liveness();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('jito-game-engine');
      expect(result.timestamp).toBeTruthy();
    });
  });

  describe('readiness()', () => {
    it('returns ok when both DB and Redis healthy', async () => {
      const controller = new EngineHealthController(
        makePrisma(true) as never,
        makeRedis(true) as never,
      );
      const result = await controller.readiness();
      expect(result.status).toBe('ok');
      expect(result.checks.database).toBe('up');
      expect(result.checks.redis).toBe('up');
    });

    it('returns degraded when DB is down', async () => {
      const controller = new EngineHealthController(
        makePrisma(false) as never,
        makeRedis(true) as never,
      );
      const result = await controller.readiness();
      expect(result.status).toBe('degraded');
      expect(result.checks.database).toBe('down');
    });

    it('returns degraded when Redis is down', async () => {
      const controller = new EngineHealthController(
        makePrisma(true) as never,
        makeRedis(false) as never,
      );
      const result = await controller.readiness();
      expect(result.status).toBe('degraded');
      expect(result.checks.redis).toBe('down');
    });
  });
});
