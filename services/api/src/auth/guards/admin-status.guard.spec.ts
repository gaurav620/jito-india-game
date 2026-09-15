/**
 * AdminStatusGuard unit tests.
 *
 * Verifies:
 *   - Active admin + valid session → allows through
 *   - Session not found → UnauthorizedException
 *   - Inactive admin → ForbiddenException FORBIDDEN
 */
import type { ExecutionContext} from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { PrismaService } from '../../database/prisma.service';
import { AdminStatusGuard } from '../guards/admin-status.guard';

const mockPrisma = {
  session: { findFirst: vi.fn() },
  adminUser: { findUnique: vi.fn() },
} as unknown as PrismaService;

function makeContext(payload: Record<string, unknown>) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: payload }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminStatusGuard', () => {
  let guard: AdminStatusGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new AdminStatusGuard(mockPrisma);
  });

  it('allows through: active admin with valid session', async () => {
    vi.mocked(mockPrisma.session.findFirst).mockResolvedValue({ id: 'asid1' } as never);
    vi.mocked(mockPrisma.adminUser.findUnique).mockResolvedValue({ status: 'active' } as never);

    const result = await guard.canActivate(
      makeContext({ sub: 'admin-1', sid: 'asid1', aud: 'jito-admin', role: 'super_admin' }),
    );
    expect(result).toBe(true);
  });

  it('rejects: session not found → UnauthorizedException', async () => {
    vi.mocked(mockPrisma.session.findFirst).mockResolvedValue(null);

    await expect(
      guard.canActivate(makeContext({ sub: 'admin-1', sid: 'asid1', aud: 'jito-admin', role: 'super_admin' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects: inactive admin → FORBIDDEN (403)', async () => {
    vi.mocked(mockPrisma.session.findFirst).mockResolvedValue({ id: 'asid1' } as never);
    vi.mocked(mockPrisma.adminUser.findUnique).mockResolvedValue({ status: 'inactive' } as never);

    await expect(
      guard.canActivate(makeContext({ sub: 'admin-1', sid: 'asid1', aud: 'jito-admin', role: 'super_admin' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects: admin not found in DB → UnauthorizedException', async () => {
    vi.mocked(mockPrisma.session.findFirst).mockResolvedValue({ id: 'asid1' } as never);
    vi.mocked(mockPrisma.adminUser.findUnique).mockResolvedValue(null);

    await expect(
      guard.canActivate(makeContext({ sub: 'admin-1', sid: 'asid1', aud: 'jito-admin', role: 'super_admin' })),
    ).rejects.toThrow(UnauthorizedException);
  });
});
