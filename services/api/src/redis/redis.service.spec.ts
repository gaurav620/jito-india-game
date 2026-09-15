/**
 * Tests for RedisService.
 *
 * Uses a mock ioredis client — no live Redis connection required.
 * Verifies lifecycle, health check, and key-namespacing helpers.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock ioredis before importing RedisService
const mockRedisInstance = {
  on: vi.fn().mockReturnThis(),
  ping: vi.fn().mockResolvedValue('PONG'),
  quit: vi.fn().mockResolvedValue('OK'),
};

vi.mock('ioredis', () => ({
  default: vi.fn(() => mockRedisInstance),
}));

// Mock AppConfigService with minimal shape needed by RedisService
const mockConfig = {
  redisUrl: 'redis://localhost:6379',
};

import type { AppConfigService } from '../config/app-config.service';

import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    // Reset mocks between tests
    vi.clearAllMocks();
    mockRedisInstance.on.mockReturnThis();
    mockRedisInstance.ping.mockResolvedValue('PONG');
    mockRedisInstance.quit.mockResolvedValue('OK');

    service = new RedisService(mockConfig as unknown as AppConfigService);
    await service.onModuleInit();
  });

  it('can be instantiated', () => {
    expect(service).toBeDefined();
  });

  it('isHealthy returns true when PONG received', async () => {
    const healthy = await service.isHealthy();
    expect(healthy).toBe(true);
  });

  it('isHealthy returns false when ping throws', async () => {
    mockRedisInstance.ping.mockRejectedValueOnce(new Error('Connection refused'));
    const healthy = await service.isHealthy();
    expect(healthy).toBe(false);
  });

  it('isHealthy returns false when ping returns non-PONG', async () => {
    mockRedisInstance.ping.mockResolvedValueOnce('ERROR');
    const healthy = await service.isHealthy();
    expect(healthy).toBe(false);
  });

  it('calls quit on onModuleDestroy', async () => {
    await service.onModuleDestroy();
    expect(mockRedisInstance.quit).toHaveBeenCalled();
  });

  describe('key helpers', () => {
    it('loginRateLimitIpKey returns namespaced key', () => {
      expect(service.loginRateLimitIpKey('1.2.3.4')).toBe('ratelimit:login:ip:1.2.3.4');
    });

    it('loginRateLimitUserKey returns namespaced key', () => {
      expect(service.loginRateLimitUserKey('testuser')).toBe('ratelimit:login:user:testuser');
    });

    it('betRateLimitKey returns namespaced key', () => {
      const userId = 'user-uuid-123';
      expect(service.betRateLimitKey(userId)).toBe(`ratelimit:bet:user:${userId}`);
    });

    it('idempotencyKey returns namespaced key', () => {
      expect(service.idempotencyKey('my-key')).toBe('idem:my-key');
    });

    it('userStatusKey returns namespaced key', () => {
      expect(service.userStatusKey('uid-456')).toBe('user:status:uid-456');
    });
  });
});
