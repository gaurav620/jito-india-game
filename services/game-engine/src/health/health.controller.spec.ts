/**
 * Tests for EngineHealthController (game-engine service).
 *
 * Phase 2A review fixes covered by this test:
 *   Fix #3 — readiness returns HTTP 503 when any dependency is unhealthy
 */
import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { EngineHealthController } from './health.controller';

function makePrisma(healthy = true) {
  return { isHealthy: vi.fn().mockResolvedValue(healthy) };
}

function makeRedis(healthy = true) {
  return { isHealthy: vi.fn().mockResolvedValue(healthy) };
}

function makeRes() {
  const json = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json };
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
    it('returns HTTP 200 ok when both DB and Redis healthy', async () => {
      const controller = new EngineHealthController(
        makePrisma(true) as never,
        makeRedis(true) as never,
      );
      const res = makeRes() as never;
      await controller.readiness(res);

      expect((res as { status: ReturnType<typeof vi.fn> }).status).toHaveBeenCalledWith(HttpStatus.OK);
      const body = (res as { json: ReturnType<typeof vi.fn> }).json.mock.calls[0][0] as {
        status: string; checks: { database: string; redis: string };
      };
      expect(body.status).toBe('ok');
      expect(body.checks.database).toBe('up');
      expect(body.checks.redis).toBe('up');
    });

    it('returns HTTP 503 degraded when DB is down (Fix #3)', async () => {
      const controller = new EngineHealthController(
        makePrisma(false) as never,
        makeRedis(true) as never,
      );
      const res = makeRes() as never;
      await controller.readiness(res);

      expect((res as { status: ReturnType<typeof vi.fn> }).status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      const body = (res as { json: ReturnType<typeof vi.fn> }).json.mock.calls[0][0] as {
        status: string; checks: { database: string };
      };
      expect(body.status).toBe('degraded');
      expect(body.checks.database).toBe('down');
    });

    it('returns HTTP 503 degraded when Redis is down (Fix #3)', async () => {
      const controller = new EngineHealthController(
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
  });
});
