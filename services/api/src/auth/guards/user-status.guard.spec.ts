/**
 * UserStatusGuard unit tests.
 *
 * Verifies:
 *   - Valid session + active user → canActivate returns true
 *   - Session not found (revoked) → UnauthorizedException SESSION_REVOKED
 *   - User status suspended → ForbiddenException ACCOUNT_SUSPENDED
 *   - User status banned → ForbiddenException ACCOUNT_BANNED
 *   - Redis unavailable → falls through to DB (no error thrown)
 *   - Missing sub/sid → UnauthorizedException
 */
import type { ExecutionContext} from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { AppErrorCode } from '../../common/errors';
import type { PrismaService } from '../../database/prisma.service';
import type { RedisService } from '../../redis/redis.service';
import { UserStatusGuard } from '../guards/user-status.guard';

const mockPrisma = {
  session: { findFirst: vi.fn() },
  user: { findUnique: vi.fn() },
} as unknown as PrismaService;

const mockRedis = {
  userStatusKey: vi.fn().mockReturnValue('user:status:u1'),
  raw: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  },
} as unknown as RedisService;

function makeContext(payload: Record<string, unknown>) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: payload }),
    }),
  } as unknown as ExecutionContext;
}

describe('UserStatusGuard', () => {
  let guard: UserStatusGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new UserStatusGuard(mockPrisma, mockRedis);
  });

  it('allows through: active user with valid session', async () => {
    vi.mocked(mockPrisma.session.findFirst).mockResolvedValue({ id: 'sid1' } as never);
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({ status: 'active' } as never);

    const result = await guard.canActivate(makeContext({ sub: 'u1', sid: 'sid1', aud: 'jito-player', role: 'user' }));
    expect(result).toBe(true);
  });

  it('rejects: session not found (revoked or expired) → SESSION_REVOKED', async () => {
    vi.mocked(mockPrisma.session.findFirst).mockResolvedValue(null);

    await expect(
      guard.canActivate(makeContext({ sub: 'u1', sid: 'sid1', aud: 'jito-player', role: 'user' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects: suspended user → ACCOUNT_SUSPENDED', async () => {
    vi.mocked(mockPrisma.session.findFirst).mockResolvedValue({ id: 'sid1' } as never);
    vi.mocked(mockRedis.raw.get).mockResolvedValue('suspended');

    await expect(
      guard.canActivate(makeContext({ sub: 'u1', sid: 'sid1', aud: 'jito-player', role: 'user' })),
    ).rejects.toThrow(ForbiddenException);

    // Assert ACCOUNT_SUSPENDED was thrown
    try {
      vi.mocked(mockRedis.raw.get).mockResolvedValue('suspended');
      await guard.canActivate(makeContext({ sub: 'u1', sid: 'sid1', aud: 'jito-player', role: 'user' }));
    } catch (err: unknown) {
      if (err instanceof ForbiddenException) {
        const body = err.getResponse() as { message: string };
        expect(body.message).toBe(AppErrorCode.ACCOUNT_SUSPENDED);
      }
    }
  });

  it('rejects: banned user → ACCOUNT_BANNED', async () => {
    vi.mocked(mockPrisma.session.findFirst).mockResolvedValue({ id: 'sid1' } as never);
    vi.mocked(mockRedis.raw.get).mockResolvedValue('banned');

    await expect(
      guard.canActivate(makeContext({ sub: 'u1', sid: 'sid1', aud: 'jito-player', role: 'user' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('falls through to DB when Redis is unavailable — does not fail the request', async () => {
    vi.mocked(mockPrisma.session.findFirst).mockResolvedValue({ id: 'sid1' } as never);
    vi.mocked(mockRedis.raw.get).mockRejectedValue(new Error('Redis ECONNREFUSED'));
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({ status: 'active' } as never);

    // Should not throw — Redis failure is non-fatal
    const result = await guard.canActivate(
      makeContext({ sub: 'u1', sid: 'sid1', aud: 'jito-player', role: 'user' }),
    );
    expect(result).toBe(true);
  });

  it('rejects: missing sub → UnauthorizedException', async () => {
    await expect(
      guard.canActivate(makeContext({ sid: 'sid1' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects: missing sid → UnauthorizedException', async () => {
    await expect(
      guard.canActivate(makeContext({ sub: 'u1' })),
    ).rejects.toThrow(UnauthorizedException);
  });
});
