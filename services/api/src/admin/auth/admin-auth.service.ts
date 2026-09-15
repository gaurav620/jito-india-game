/**
 * AdminAuthService — admin authentication.
 *
 * Admin accounts are provisioned only (never self-registered, AUTH_V2.md §1).
 * JWT aud: 'jito-admin' — structurally unusable on player endpoints.
 *
 * Security invariants (same as AuthService):
 *   - argon2id, constant-time verify for unknown admins
 *   - Failure responses identical for not-found and wrong-password
 *   - Rate limiting by IP; alert on breach
 *   - Redis failure is non-fatal (fail open)
 *   - No passwordHash in return values or logs
 *
 * Admin status: only 'active' | 'inactive' (AdminStatus enum — not invented).
 *   'inactive' blocks login; checked BEFORE argon2 (can reveal account existence,
 *    but admin accounts are not secret — only admins log in here).
 */

import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AuthService } from '../../auth/auth.service'; // DI token — must be value import
import type { LoginDto } from '../../auth/dto/login.dto';
import { AppErrorCode } from '../../common/errors';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AppConfigService } from '../../config/app-config.service'; // DI token
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../database/prisma.service'; // DI token
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { RedisService } from '../../redis/redis.service'; // DI token
// eslint-disable-next-line @typescript-eslint/consistent-type-imports

const ADMIN_LOGIN_RATE_IP_MAX = 5;
const ADMIN_LOGIN_RATE_IP_WINDOW = 15 * 60; // 15 min

// Shared argon2 options — identical to AuthService
const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$dGltaW5nc2FmZWR1bW15aGFzaA$placeholder00000000000000000000000000000';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: AppConfigService,
    private readonly authService: AuthService, // shared createSession / token signing
  ) {}

  async login(dto: LoginDto, ip: string, userAgent: string | undefined) {
    // Rate limit: 5 / 15 min per IP (AUTH_V2.md §7)
    await this.checkAdminRateLimit(ip);

    const normalizedUsername = dto.username.trim();
    const admin = await this.prisma.adminUser.findUnique({
      where: { username: normalizedUsername },
      select: { id: true, passwordHash: true, role: true, status: true },
    });

    if (!admin) {
      await argon2.verify(DUMMY_HASH, dto.password, ARGON2_OPTIONS).catch(() => undefined);
      throw new UnauthorizedException(AppErrorCode.UNAUTHORIZED);
    }

    if (admin.status !== 'active') {
      // inactive admin — reject with FORBIDDEN (admin status is not secret)
      throw new ForbiddenException(AppErrorCode.FORBIDDEN);
    }

    const valid = await argon2.verify(admin.passwordHash, dto.password, ARGON2_OPTIONS);
    if (!valid) {
      throw new UnauthorizedException(AppErrorCode.UNAUTHORIZED);
    }

    const { tokens } = await this.authService.createSession(
      admin.id,
      'jito-admin',
      admin.role, // AdminRole value as role claim
      ip,
      userAgent,
    );

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      ...tokens,
      admin: { id: admin.id, username: normalizedUsername, role: admin.role, status: admin.status },
    };
  }

  async refresh(rawToken: string, ip: string) {
    // Delegates to shared rotation logic (same reuse detection for admin sessions)
    return this.authService.refresh(rawToken, ip);
  }

  async logout(sessionId: string, adminId?: string): Promise<void> {
    // Scope the revoke to the authenticated admin (defence in depth)
    return this.authService.logout(sessionId, adminId, true);
  }

  async getMe(adminId: string) {
    const admin = await this.prisma.adminUser.findUniqueOrThrow({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        role: true,
        status: true,
        lastLoginAt: true,
      },
    });
    // No passwordHash in response
    return admin;
  }

  private async checkAdminRateLimit(ip: string): Promise<void> {
    const key = this.redis.adminLoginRateLimitIpKey(ip);
    try {
      const current = await this.redis.raw.incr(key);
      if (current === 1) {
        await this.redis.raw.expire(key, ADMIN_LOGIN_RATE_IP_WINDOW);
      }
      if (current > ADMIN_LOGIN_RATE_IP_MAX) {
        this.logger.warn(`Admin login rate limit BREACH — IP=${ip} count=${current}`);
        // 429 per docs/API_V2.md §11 (Retry-After set by GlobalExceptionFilter)
        throw new HttpException(
          {
            code: AppErrorCode.RATE_LIMIT_EXCEEDED,
            message: 'Too many requests. Please try again later.',
            retryAfter: ADMIN_LOGIN_RATE_IP_WINDOW,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (err: unknown) {
      // Deliberate HTTP errors (incl. 429) must propagate; only Redis failure fails open
      if (err instanceof HttpException) throw err;
      this.logger.warn('Redis unavailable for admin rate limit — allowing request', (err as Error).stack);
    }
  }
}
