/**
 * Tests for HealthController (API service).
 *
 * Verifies the liveness and readiness response shapes without starting NestJS.
 */
import { describe, expect, it, vi } from 'vitest';

import { HealthController } from './health.controller';

function makePrisma(healthy = true) {
  return { isHealthy: vi.fn().mockResolvedValue(healthy) };
}

function makeRedis(healthy = true) {
  return { isHealthy: vi.fn().mockResolvedValue(healthy) };
}

describe('HealthController', () => {
  describe('liveness()', () => {
    it('returns status ok with service name', () => {
      const controller = new HealthController(
        makePrisma() as never,
        makeRedis() as never,
      );
      const result = controller.liveness();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('jito-api');
      expect(result.timestamp).toBeTruthy();
    });

    it('timestamp is a valid ISO string', () => {
      const controller = new HealthController(
        makePrisma() as never,
        makeRedis() as never,
      );
      const result = controller.liveness();
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  describe('readiness()', () => {
    it('returns status ok when both DB and Redis are healthy', async () => {
      const controller = new HealthController(
        makePrisma(true) as never,
        makeRedis(true) as never,
      );
      const result = await controller.readiness();
      expect(result.status).toBe('ok');
      expect(result.checks.database).toBe('up');
      expect(result.checks.redis).toBe('up');
    });

    it('returns status degraded when DB is down', async () => {
      const controller = new HealthController(
        makePrisma(false) as never,
        makeRedis(true) as never,
      );
      const result = await controller.readiness();
      expect(result.status).toBe('degraded');
      expect(result.checks.database).toBe('down');
      expect(result.checks.redis).toBe('up');
    });

    it('returns status degraded when Redis is down', async () => {
      const controller = new HealthController(
        makePrisma(true) as never,
        makeRedis(false) as never,
      );
      const result = await controller.readiness();
      expect(result.status).toBe('degraded');
      expect(result.checks.database).toBe('up');
      expect(result.checks.redis).toBe('down');
    });

    it('returns status degraded when both are down', async () => {
      const controller = new HealthController(
        makePrisma(false) as never,
        makeRedis(false) as never,
      );
      const result = await controller.readiness();
      expect(result.status).toBe('degraded');
      expect(result.checks.database).toBe('down');
      expect(result.checks.redis).toBe('down');
    });

    it('service name is always jito-api', async () => {
      const controller = new HealthController(
        makePrisma() as never,
        makeRedis() as never,
      );
      const result = await controller.readiness();
      expect(result.service).toBe('jito-api');
    });
  });
});
