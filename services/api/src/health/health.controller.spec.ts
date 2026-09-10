/**
 * Tests for HealthController (API service).
 *
 * Verifies the liveness and readiness response shapes without starting NestJS.
 *
 * Phase 2A review fixes covered by this test:
 *   Fix #3 — readiness returns HTTP 503 when any dependency is unhealthy
 *   Fix #1 — smoke coverage that controller can be instantiated (DI imports OK)
 */
import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { HealthController } from './health.controller';

// Mock PrismaService and RedisService shapes
function makePrisma(healthy = true) {
  return { isHealthy: vi.fn().mockResolvedValue(healthy) };
}

function makeRedis(healthy = true) {
  return { isHealthy: vi.fn().mockResolvedValue(healthy) };
}

// Helper to create a mock Express Response that records calls
function makeRes() {
  const json = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json };
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
    it('returns HTTP 200 and status ok when both DB and Redis are healthy', async () => {
      const controller = new HealthController(
        makePrisma(true) as never,
        makeRedis(true) as never,
      );
      const res = makeRes() as never;
      await controller.readiness(res);

      // Fix #3: must return 200 when healthy
      expect((res as { status: ReturnType<typeof vi.fn> }).status).toHaveBeenCalledWith(HttpStatus.OK);
      const body = (res as { json: ReturnType<typeof vi.fn> }).json.mock.calls[0][0] as {
        status: string; checks: { database: string; redis: string };
      };
      expect(body.status).toBe('ok');
      expect(body.checks.database).toBe('up');
      expect(body.checks.redis).toBe('up');
    });

    it('returns HTTP 503 and status degraded when DB is down (Fix #3)', async () => {
      const controller = new HealthController(
        makePrisma(false) as never,
        makeRedis(true) as never,
      );
      const res = makeRes() as never;
      await controller.readiness(res);

      // Fix #3: must return 503 when degraded, not 200
      expect((res as { status: ReturnType<typeof vi.fn> }).status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      const body = (res as { json: ReturnType<typeof vi.fn> }).json.mock.calls[0][0] as {
        status: string; checks: { database: string };
      };
      expect(body.status).toBe('degraded');
      expect(body.checks.database).toBe('down');
    });

    it('returns HTTP 503 and status degraded when Redis is down (Fix #3)', async () => {
      const controller = new HealthController(
        makePrisma(true) as never,
        makeRedis(false) as never,
      );
      const res = makeRes() as never;
      await controller.readiness(res);

      expect((res as { status: ReturnType<typeof vi.fn> }).status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      const body = (res as { json: ReturnType<typeof vi.fn> }).json.mock.calls[0][0] as {
        status: string; checks: { redis: string };
      };
      expect(body.status).toBe('degraded');
      expect(body.checks.redis).toBe('down');
    });

    it('returns HTTP 503 and status degraded when both are down (Fix #3)', async () => {
      const controller = new HealthController(
        makePrisma(false) as never,
        makeRedis(false) as never,
      );
      const res = makeRes() as never;
      await controller.readiness(res);

      expect((res as { status: ReturnType<typeof vi.fn> }).status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      const body = (res as { json: ReturnType<typeof vi.fn> }).json.mock.calls[0][0] as {
        status: string; checks: { database: string; redis: string };
      };
      expect(body.status).toBe('degraded');
      expect(body.checks.database).toBe('down');
      expect(body.checks.redis).toBe('down');
    });

    it('service name is always jito-api', async () => {
      const controller = new HealthController(
        makePrisma() as never,
        makeRedis() as never,
      );
      const res = makeRes() as never;
      await controller.readiness(res);
      const body = (res as { json: ReturnType<typeof vi.fn> }).json.mock.calls[0][0] as { service: string };
      expect(body.service).toBe('jito-api');
    });
  });
});
