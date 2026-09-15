/**
 * Tests for PrismaService.
 *
 * Uses a mock PrismaClient — no live database connection required.
 * Verifies the NestJS lifecycle contract and the health-check method.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Shared mock functions so we can control behaviour per test
const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDisconnect = vi.fn().mockResolvedValue(undefined);
const mockQueryRaw = vi.fn().mockResolvedValue([{ '?column?': 1 }]);

vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    $connect = mockConnect;
    $disconnect = mockDisconnect;
    $queryRaw = mockQueryRaw;
  }
  return { PrismaClient: MockPrismaClient };
});

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockDisconnect.mockResolvedValue(undefined);
    mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);
  });

  it('can be instantiated', () => {
    const service = new PrismaService();
    expect(service).toBeDefined();
  });

  it('calls $connect on onModuleInit', async () => {
    const service = new PrismaService();
    await service.onModuleInit();
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('calls $disconnect on onModuleDestroy', async () => {
    const service = new PrismaService();
    await service.onModuleInit();
    await service.onModuleDestroy();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('isHealthy returns true when $queryRaw succeeds', async () => {
    const service = new PrismaService();
    const healthy = await service.isHealthy();
    expect(healthy).toBe(true);
  });

  it('isHealthy returns false when $queryRaw throws', async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error('DB unavailable'));
    const service = new PrismaService();
    const healthy = await service.isHealthy();
    expect(healthy).toBe(false);
  });
});
