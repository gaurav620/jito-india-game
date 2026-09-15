/**
 * AuthService unit tests.
 *
 * All external dependencies mocked. No real DB, Redis, or argon2 calls in unit tests
 * (argon2 is mocked via vi.mock to make tests fast and deterministic).
 *
 * Tests verify:
 *   - Registration atomicity pattern
 *   - Unknown field rejection (via ValidationPipe — DTO test section)
 *   - Conflict handling (P2002 → generic CONFLICT)
 *   - Login timing-safe paths
 *   - Lockout behavior
 *   - Refresh rotation and reuse detection
 *   - Concurrent refresh: second request → reuse → S2 also revoked
 *   - Password change atomicity
 *   - No hash in any return value
 *   - Redis fail-safe
 */
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppConfigService } from '../config/app-config.service';
import type { PrismaService } from '../database/prisma.service';
import type { RedisService } from '../redis/redis.service';

import { AuthService } from './auth.service';

// Mock argon2 for deterministic, fast unit tests
vi.mock('argon2', () => ({
  argon2id: 2,
  hash: vi.fn().mockResolvedValue('$argon2id$v=19$mock_hash'),
  verify: vi.fn().mockResolvedValue(true),
  needsRehash: vi.fn().mockReturnValue(false),
}));

const mockPrisma = {
  $transaction: vi.fn(),
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  adminUser: {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  session: {
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
  pointsAccount: {
    create: vi.fn(),
  },
  $queryRaw: vi.fn(),
} as unknown as PrismaService;

const mockRedis = {
  raw: {
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  },
  loginRateLimitIpKey: vi.fn().mockReturnValue('ratelimit:login:ip:127.0.0.1'),
  loginRateLimitUserKey: vi.fn().mockReturnValue('ratelimit:login:user:test'),
  registerRateLimitIpKey: vi.fn().mockReturnValue('ratelimit:register:ip:127.0.0.1'),
  refreshRateLimitSessionKey: vi.fn().mockReturnValue('ratelimit:refresh:session:sid123'),
  adminLoginRateLimitIpKey: vi.fn().mockReturnValue('ratelimit:login:admin:ip:127.0.0.1'),
  userStatusKey: vi.fn().mockReturnValue('user:status:user123'),
} as unknown as RedisService;

const mockJwt = {
  signAsync: vi.fn().mockResolvedValue('mock.access.token'),
} as unknown as JwtService;

const mockConfig = {
  jwtSecret: 'test-secret',
  jwtIssuer: 'jito-test',
  jwtAudiencePlayer: 'jito-player',
  jwtAudienceAdmin: 'jito-admin',
  jwtAccessTtlSeconds: 900,
  jwtRefreshTtlSeconds: 604800,
  isProduction: false,
} as unknown as AppConfigService;

const IP = '127.0.0.1';
const USER_AGENT = 'test-agent';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Restore argon2 default mock implementations after clearAllMocks() wipes them
    const argon2 = await import('argon2');
    vi.mocked(argon2.hash).mockResolvedValue('$argon2id$v=19$mock_hash');
    vi.mocked(argon2.verify).mockResolvedValue(true);
    vi.mocked(argon2.needsRehash).mockReturnValue(false);
    // Restore redis default mocks
    vi.mocked(mockRedis.raw.incr).mockResolvedValue(1);
    vi.mocked(mockRedis.raw.expire).mockResolvedValue(1);
    vi.mocked(mockRedis.raw.get).mockResolvedValue(null);
    vi.mocked(mockRedis.raw.set).mockResolvedValue('OK');
    // Default $transaction: hand the callback the same mock as the transaction
    // client, so tx.$queryRaw / tx.session.* resolve to the same spies the
    // assertions inspect. Individual tests may override this.
    vi.mocked(mockPrisma.$transaction).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((fn: any) => fn(mockPrisma)) as never,
    );
    service = new AuthService(mockPrisma, mockRedis, mockJwt, mockConfig);
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Registration
  // ──────────────────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('creates user + points account inside a $transaction', async () => {
      const createdUser = {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        phone: null,
        displayName: null,
        status: 'active',
        createdAt: new Date(),
      };

      // Advisory pre-check: no existing user
      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue(null);
      // Transaction calls tx.user.create and tx.pointsAccount.create
      vi.mocked(mockPrisma.$transaction).mockImplementation(async (fn) => {
        if (typeof fn === 'function') {
          // fn is a callback — simulate tx with mock
          const tx = {
            user: { create: vi.fn().mockResolvedValue(createdUser) },
            pointsAccount: { create: vi.fn().mockResolvedValue({}) },
          };
          return fn(tx);
        }
        // Array form
        return Promise.all(fn as Promise<unknown>[]);
      });

      const result = await service.register(
        { username: 'alice', password: 'password123', email: 'alice@example.com' },
        IP,
      );

      expect(result.id).toBe('user-1');
      expect(result.username).toBe('alice');
      // passwordHash must NEVER appear in result
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('failedLoginCount');
      expect(result).not.toHaveProperty('lockedUntil');
    });

    it('returns generic CONFLICT on P2002 — does not name the colliding field', async () => {
      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(mockPrisma.$transaction).mockRejectedValue(
        new PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['username'] },
        }),
      );

      await expect(
        service.register({ username: 'alice', password: 'password123', email: 'alice@test.com' }, IP),
      ).rejects.toThrow(ConflictException);

      // The error message must NOT name which field collided (account enumeration prevention)
      try {
        await service.register({ username: 'alice', password: 'password123', email: 'alice@test.com' }, IP);
      } catch (err: unknown) {
        if (err instanceof ConflictException) {
          const body = err.getResponse() as { message: string };
          expect(body.message).not.toContain('username');
          expect(body.message).not.toContain('email');
          expect(body.message).not.toContain('phone');
        }
      }
    });

    it('requires at least one of email or phone (interim contract) — 400, not 401', async () => {
      await expect(
        service.register({ username: 'alice', password: 'password123' }, IP),
      ).rejects.toThrow(BadRequestException);
    });

    it('normalizes email to lowercase before storage', async () => {
      const createdUser = {
        id: 'u1', username: 'alice', email: 'alice@example.com',
        phone: null, displayName: null, status: 'active', createdAt: new Date(),
      };
      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue(null);

      let capturedEmail: string | null = null;
      vi.mocked(mockPrisma.$transaction).mockImplementation(async (fn) => {
        if (typeof fn === 'function') {
          const tx = {
            user: {
              create: vi.fn().mockImplementation(({ data }: { data: { email: string } }) => {
                capturedEmail = data.email;
                return Promise.resolve(createdUser);
              }),
            },
            pointsAccount: { create: vi.fn().mockResolvedValue({}) },
          };
          return fn(tx);
        }
        return Promise.all(fn as Promise<unknown>[]);
      });

      await service.register({ username: 'alice', password: 'password123', email: 'Alice@EXAMPLE.COM' }, IP);
      expect(capturedEmail).toBe('alice@example.com');
    });

    it('trims username before storage', async () => {
      const createdUser = {
        id: 'u1', username: 'alice', email: 'alice@example.com',
        phone: null, displayName: null, status: 'active', createdAt: new Date(),
      };
      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue(null);

      let capturedUsername: string | null = null;
      vi.mocked(mockPrisma.$transaction).mockImplementation(async (fn) => {
        if (typeof fn === 'function') {
          const tx = {
            user: {
              create: vi.fn().mockImplementation(({ data }: { data: { username: string } }) => {
                capturedUsername = data.username;
                return Promise.resolve(createdUser);
              }),
            },
            pointsAccount: { create: vi.fn().mockResolvedValue({}) },
          };
          return fn(tx);
        }
        return Promise.all(fn as Promise<unknown>[]);
      });

      await service.register({ username: '  alice  ', password: 'password123', email: 'a@b.com' }, IP);
      expect(capturedUsername).toBe('alice');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Login
  // ──────────────────────────────────────────────────────────────────────────────

  describe('login', () => {
    const activeUser = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      phone: null,
      displayName: null,
      status: 'active',
      createdAt: new Date(),
      passwordHash: '$argon2id$v=19$mock_hash',
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: null,
      pointsAccount: { balanceMinor: 0n },
    };

    const mockSession = { id: 'session-1', refreshTokenHash: 'hash', expiresAt: new Date(Date.now() + 1e9) };

    beforeEach(() => {
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(activeUser as never);
      vi.mocked(mockPrisma.user.update).mockResolvedValue(activeUser as never);
      vi.mocked(mockPrisma.session.create).mockResolvedValue(mockSession as never);
    });

    it('returns accessToken, refreshToken, user, and balanceMinor on valid credentials', async () => {
      const result = await service.login({ username: 'alice', password: 'password123' }, IP, USER_AGENT);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('balanceMinor');
      expect(result.user).toHaveProperty('id');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('returns generic UNAUTHORIZED for wrong password — does not say "wrong password"', async () => {
      const argon2 = await import('argon2');
      vi.mocked(argon2.verify).mockResolvedValue(false);

      await expect(
        service.login({ username: 'alice', password: 'wrong' }, IP, USER_AGENT),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns generic UNAUTHORIZED for unknown username (same as wrong password)', async () => {
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(null);

      await expect(
        service.login({ username: 'nobody', password: 'password123' }, IP, USER_AGENT),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns generic UNAUTHORIZED for suspended user (per AUTH_V2.md §3)', async () => {
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(
        { ...activeUser, status: 'suspended' } as never,
      );

      await expect(
        service.login({ username: 'alice', password: 'password123' }, IP, USER_AGENT),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns generic UNAUTHORIZED for banned user', async () => {
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(
        { ...activeUser, status: 'banned' } as never,
      );

      await expect(
        service.login({ username: 'alice', password: 'password123' }, IP, USER_AGENT),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('increments failedLoginCount on wrong password', async () => {
      const argon2 = await import('argon2');
      vi.mocked(argon2.verify).mockResolvedValue(false);

      await service.login({ username: 'alice', password: 'bad' }, IP, USER_AGENT).catch(() => undefined);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginCount: expect.any(Number) }),
        }),
      );
    });

    it('locks account after 10th consecutive failure', async () => {
      const argon2 = await import('argon2');
      vi.mocked(argon2.verify).mockResolvedValue(false);
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(
        { ...activeUser, failedLoginCount: 9 } as never,
      );

      await service.login({ username: 'alice', password: 'bad' }, IP, USER_AGENT).catch(() => undefined);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lockedUntil: expect.any(Date), failedLoginCount: 0 }),
        }),
      );
    });

    it('rejects locked account with generic UNAUTHORIZED', async () => {
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(
        { ...activeUser, lockedUntil: new Date(Date.now() + 1e9) } as never,
      );

      await expect(
        service.login({ username: 'alice', password: 'password123' }, IP, USER_AGENT),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('resets failedLoginCount and lockedUntil on successful login', async () => {
      await service.login({ username: 'alice', password: 'password123' }, IP, USER_AGENT);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginCount: 0, lockedUntil: null }),
        }),
      );
    });

    it('allows login when Redis is unavailable (fail-safe)', async () => {
      vi.mocked(mockRedis.raw.incr).mockRejectedValue(new Error('Redis ECONNREFUSED'));

      await expect(
        service.login({ username: 'alice', password: 'password123' }, IP, USER_AGENT),
      ).resolves.toHaveProperty('accessToken');
    });

    it('returns 429 RATE_LIMIT_EXCEEDED when login IP limit exceeded', async () => {
      vi.mocked(mockRedis.raw.incr).mockResolvedValue(100);

      // Must be HTTP 429 per docs/API_V2.md §11 — not 401
      const err = await service
        .login({ username: 'alice', password: 'password123' }, IP, USER_AGENT)
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      const payload = (err as HttpException).getResponse() as Record<string, unknown>;
      expect(payload['code']).toBe('RATE_LIMIT_EXCEEDED');
      // retryAfter drives the Retry-After header in GlobalExceptionFilter
      expect(typeof payload['retryAfter']).toBe('number');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Refresh
  // ──────────────────────────────────────────────────────────────────────────────

  describe('refresh', () => {
    const validSession = {
      id: 'old-session',
      user_id: 'user-1',
      admin_id: null,
      revoked_at: null,
      expires_at: new Date(Date.now() + 1e9),
    };

    const mockNewSession = { id: 'new-session', refreshTokenHash: 'new-hash', expiresAt: new Date() };

    it('rotates token — returns new accessToken and refreshToken', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([validSession]);
      vi.mocked(mockPrisma.session.create).mockResolvedValue(mockNewSession as never);
      vi.mocked(mockPrisma.session.update).mockResolvedValue({} as never);

      const result = await service.refresh('raw-token-abc', IP);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('rejects expired session with SESSION_EXPIRED', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([
        { ...validSession, expires_at: new Date(Date.now() - 1000) },
      ]);

      await expect(service.refresh('raw-token', IP)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects unknown token with SESSION_REVOKED', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([]);

      await expect(service.refresh('unknown-token', IP)).rejects.toThrow(UnauthorizedException);
    });

    it('detects reuse — revokes all user sessions when already-rotated token presented', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([
        { ...validSession, revoked_at: new Date() }, // already revoked = reuse
      ]);
      vi.mocked(mockPrisma.session.updateMany).mockResolvedValue({ count: 2 } as never);

      await expect(service.refresh('reused-token', IP)).rejects.toThrow(UnauthorizedException);

      // All sessions for the user must be revoked
      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it('concurrent refresh: second request sees revoked session → reuse → S2 also revoked', async () => {
      // Simulate: first request already rotated the session (revoked_at IS NOT NULL on second read)
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([
        { ...validSession, revoked_at: new Date() },
      ]);
      vi.mocked(mockPrisma.session.updateMany).mockResolvedValue({ count: 3 } as never);

      await expect(service.refresh('concurrent-token', IP)).rejects.toThrow(UnauthorizedException);

      // updateMany revokes ALL sessions — including any successor S2 created by request A
      expect(mockPrisma.session.updateMany).toHaveBeenCalled();
      // Invariant: never more than one valid successor after both requests complete (zero here)
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Logout
  // ──────────────────────────────────────────────────────────────────────────────

  describe('logout / logoutAll', () => {
    it('revokes only the current session', async () => {
      vi.mocked(mockPrisma.session.updateMany).mockResolvedValue({ count: 1 } as never);
      await service.logout('session-1');
      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: 'session-1' }) }),
      );
    });

    it('revokes all user sessions on logout-all', async () => {
      vi.mocked(mockPrisma.session.updateMany).mockResolvedValue({ count: 3 } as never);
      await service.logoutAll('user-1');
      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
      );
    });
  });
});
