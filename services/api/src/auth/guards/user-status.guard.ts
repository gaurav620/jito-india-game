/**
 * UserStatusGuard — live session revocation + player status enforcement.
 *
 * Applied AFTER PlayerJwtGuard on all player-protected routes.
 * This guard implements the core of session revocation:
 *
 *   1. SESSION CHECK (PostgreSQL-authoritative, every request):
 *      Verifies the session identified by `sid` exists, is not revoked, and
 *      has not expired. A cryptographically valid JWT is rejected if its session
 *      has been revoked (e.g. by logout, password change, or reuse detection).
 *
 *   2. USER STATUS CHECK (DB + brief Redis cache per AUTH_V2.md §9):
 *      Rejects suspended and banned players.
 *
 * Redis fail-safe: if Redis is unavailable for the status cache, the guard
 * falls through to the DB query. Redis outage must not break authentication.
 *
 * Redis invalidation contract: when users.status changes, the key
 * `user:status:{userId}` must be deleted in the same transaction as the update.
 * (Implemented in the admin-panel status-change endpoint — future phase.)
 */
import type {
  CanActivate,
  ExecutionContext} from '@nestjs/common';
import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AppErrorCode } from '../../common/errors';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../database/prisma.service'; // DI token
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { RedisService } from '../../redis/redis.service'; // DI token
import type { JwtPayload } from '../strategies/jwt-payload.interface';

const STATUS_CACHE_TTL_SECONDS = 60;

@Injectable()
export class UserStatusGuard implements CanActivate {
  private readonly logger = new Logger(UserStatusGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    const payload = request.user;

    if (!payload?.sub || !payload.sid) {
      throw new UnauthorizedException(AppErrorCode.UNAUTHORIZED);
    }

    // ── 1. Session validity (PostgreSQL-authoritative, every request) ──────────
    const session = await this.prisma.session.findFirst({
      where: {
        id: payload.sid,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!session) {
      // Could be revoked or expired — return same code to avoid oracle
      throw new UnauthorizedException(AppErrorCode.SESSION_REVOKED);
    }

    // ── 2. User status (DB + brief Redis cache) ────────────────────────────────
    const status = await this.getCachedStatus(payload.sub);

    if (status === 'suspended') {
      throw new ForbiddenException(AppErrorCode.ACCOUNT_SUSPENDED);
    }
    if (status === 'banned') {
      throw new ForbiddenException(AppErrorCode.ACCOUNT_BANNED);
    }

    return true;
  }

  private async getCachedStatus(userId: string): Promise<string> {
    const cacheKey = this.redis.userStatusKey(userId);

    // Try Redis cache first (fail-safe: Redis outage falls through to DB)
    try {
      const cached = await this.redis.raw.get(cacheKey);
      if (cached !== null) return cached;
    } catch (err: unknown) {
      this.logger.warn(
        'Redis unavailable for status cache — falling through to DB',
        (err as Error).stack,
      );
    }

    // PostgreSQL is authoritative
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });

    if (!user) {
      throw new UnauthorizedException(AppErrorCode.UNAUTHORIZED);
    }

    const status = user.status as string;

    // Populate cache (fail-safe)
    try {
      await this.redis.raw.set(cacheKey, status, 'EX', STATUS_CACHE_TTL_SECONDS);
    } catch {
      // Redis unavailable — not fatal, DB query already returned correct value
    }

    return status;
  }
}
