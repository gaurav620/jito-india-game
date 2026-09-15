/**
 * AuthService — player authentication core.
 *
 * Implements: registration, login, refresh rotation, logout, logout-all, getMe.
 * Admin auth is handled by AdminAuthService (services/api/src/admin/auth/).
 *
 * Security invariants:
 *   - argon2id: memoryCost 19456 KiB, timeCost 2, parallelism 1 (OWASP baseline, AUTH_V2.md §5)
 *   - Dummy hash always verified for unknown usernames (timing-safe, AUTH_V2.md §3)
 *   - Failure responses are identical for: not found, wrong password, suspended (AUTH_V2.md §3)
 *   - DB unique constraint is authoritative for registration conflicts; pre-check is advisory
 *   - Refresh rotation holds a SELECT FOR UPDATE row lock for the WHOLE critical
 *     section inside one transaction, so concurrent refreshes cannot both rotate
 *     (ADR-027). The lock must never be taken by a standalone $queryRaw — PostgreSQL
 *     commits the implicit single-statement transaction and releases it immediately.
 *   - Reuse detection revokes ALL sessions for the affected owner (ADR-027)
 *   - No passwordHash or refreshTokenHash ever appears in return values or logs
 *   - Redis failure must not break authentication correctness (fail-safe throughout)
 */
import { createHash, randomBytes, randomUUID } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { JwtService } from '@nestjs/jwt'; // DI token — must be value import
import type { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as argon2 from 'argon2';

import { AppErrorCode } from '../common/errors';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AppConfigService } from '../config/app-config.service'; // DI token — must be value import
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../database/prisma.service'; // DI token — must be value import
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { RedisService } from '../redis/redis.service'; // DI token — must be value import

import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

// argon2id parameters per AUTH_V2.md §5 (OWASP baseline)
const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

// Dummy hash for timing-safe unknown-user path (same cost as a real hash)
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$dGltaW5nc2FmZWR1bW15aGFzaA$placeholder00000000000000000000000000000';

// Lockout threshold per AUTH_V2.md §7
const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Rate limit windows (AUTH_V2.md §7)
const LOGIN_RATE_IP_MAX = 5;
const LOGIN_RATE_IP_WINDOW = 15 * 60; // 15 min in seconds
const LOGIN_RATE_USER_MAX = 10;
const LOGIN_RATE_USER_WINDOW = 15 * 60;
const REGISTER_RATE_IP_MAX = 3;
const REGISTER_RATE_IP_WINDOW = 60 * 60; // 1 hour

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  status: string;
  createdAt: Date;
}

export interface MeResult {
  user: UserProfile;
  balanceMinor: string; // centipoints as string (BigInt serialization contract)
}

/**
 * Result of the refresh critical section.
 *
 * Returned (never thrown) from inside the transaction so that the reuse path's
 * revocation is COMMITTED before the caller raises 401. Throwing inside
 * `$transaction` would roll the revocation back.
 */
type RefreshOutcome =
  | { kind: 'rotated'; tokens: AuthTokens }
  | { kind: 'invalid' }
  | { kind: 'expired' }
  | { kind: 'reused' };

/**
 * Either the root Prisma client or an interactive-transaction client.
 * Lets session writes join a caller's transaction without duplicating logic.
 */
type PrismaExecutor = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Registration
  // ─────────────────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto, ip: string): Promise<UserProfile> {
    // Rate limit: 3 / hour per IP (AUTH_V2.md §7)
    await this.checkRateLimit(
      this.redis.registerRateLimitIpKey(ip),
      REGISTER_RATE_IP_MAX,
      REGISTER_RATE_IP_WINDOW,
      'Registration',
    );

    // Normalize fields (INTERIM contact requirement — NEEDS CLIENT CONFIRMATION)
    const username = dto.username.trim();
    const email = dto.email?.trim().toLowerCase() ?? null;
    const phone = dto.phone?.trim() ?? null;
    const displayName = dto.displayName?.trim() ?? null;

    // INTERIM contact requirement — NEEDS CLIENT CONFIRMATION (CLIENT_REQUIREMENTS.md item 7).
    // Deliberately enforced in application code only: no DB CHECK constraint, so the
    // rule can change when the client confirms the final registration field policy.
    // This is a validation failure → 400, not 401.
    if (!email && !phone) {
      throw new BadRequestException({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'At least one of email or phone is required. INTERIM — NEEDS CLIENT CONFIRMATION.',
      });
    }

    // Advisory pre-check for UX (not authoritative — concurrent registrations may bypass)
    await this.advisoryUniquenessCheck(username, email, phone);

    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTIONS);

    try {
      const user = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const created = await tx.user.create({
          data: {
            username,
            email,
            phone,
            passwordHash,
            displayName,
            status: 'active',
          },
        });

        // Points account created atomically — no user can exist without one
        await tx.pointsAccount.create({
          data: { userId: created.id, balanceMinor: 0n, version: 0n },
        });

        return created;
      });

      return this.toProfile(user);
    } catch (err: unknown) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        // Generic conflict — do not name which field to avoid account enumeration
        throw new ConflictException({
          code: AppErrorCode.CONFLICT,
          message: 'Username or contact is already registered.',
        });
      }
      throw err;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────────────────────────────────────────

  async login(
    dto: LoginDto,
    ip: string,
    userAgent: string | undefined,
  ): Promise<AuthTokens & { user: UserProfile; balanceMinor: string }> {
    const normalizedUsername = dto.username.trim();

    // Rate limit: IP and per-username (AUTH_V2.md §7)
    await this.checkRateLimit(
      this.redis.loginRateLimitIpKey(ip),
      LOGIN_RATE_IP_MAX,
      LOGIN_RATE_IP_WINDOW,
      'Login IP',
    );
    await this.checkRateLimit(
      this.redis.loginRateLimitUserKey(normalizedUsername),
      LOGIN_RATE_USER_MAX,
      LOGIN_RATE_USER_WINDOW,
      'Login user',
    );

    // Load user — timing-safe: always verify hash even for unknown username
    const user = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
      include: { pointsAccount: { select: { balanceMinor: true } } },
    });

    if (!user) {
      // Timing-safe: compute verify on dummy hash so response time is indistinguishable
      await argon2.verify(DUMMY_HASH, dto.password, ARGON2_OPTIONS).catch(() => undefined);
      throw new UnauthorizedException(AppErrorCode.UNAUTHORIZED);
    }

    // Lockout check (AUTH_V2.md §7)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(AppErrorCode.UNAUTHORIZED);
    }

    // Status check — identical response to avoid account enumeration (AUTH_V2.md §3)
    if (user.status !== 'active') {
      await argon2.verify(user.passwordHash, dto.password, ARGON2_OPTIONS).catch(() => undefined);
      throw new UnauthorizedException(AppErrorCode.UNAUTHORIZED);
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password, ARGON2_OPTIONS);

    if (!passwordValid) {
      await this.handleFailedLogin(user.id, user.failedLoginCount);
      throw new UnauthorizedException(AppErrorCode.UNAUTHORIZED);
    }

    // Transparent re-hash if parameters changed (AUTH_V2.md §5)
    if (argon2.needsRehash(user.passwordHash, ARGON2_OPTIONS)) {
      const newHash = await argon2.hash(dto.password, ARGON2_OPTIONS);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    }

    // Reset failure counter on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const { tokens, sessionId } = await this.createSession(user.id, 'jito-player', 'user', ip, userAgent);
    void sessionId; // session created; id embedded in JWT `sid`

    const balance = user.pointsAccount?.balanceMinor ?? 0n;
    return { ...tokens, user: this.toProfile(user), balanceMinor: balance.toString() };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Refresh (rotation with reuse detection)
  // ─────────────────────────────────────────────────────────────────────────────

  async refresh(rawToken: string, ip: string): Promise<AuthTokens> {
    const hash = this.hashToken(rawToken);

    // ── Critical section (ADR-027) ────────────────────────────────────────────
    // The FOR UPDATE row lock and EVERY dependent write run on the SAME
    // transaction client, so the lock is held until COMMIT. A standalone
    // `prisma.$queryRaw` would be committed as its own implicit transaction and
    // release the lock immediately, allowing two concurrent refreshes to both
    // rotate and leave two valid successors.
    //
    // Outcomes are RETURNED, not thrown, from inside the transaction: throwing
    // would roll back — and the reuse path must COMMIT its revocation before the
    // 401 is raised. Errors are therefore thrown after the transaction commits.
    const outcome = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient): Promise<RefreshOutcome> => {
        const rows = await tx.$queryRaw<
          Array<{
            id: string;
            user_id: string | null;
            admin_id: string | null;
            revoked_at: Date | null;
            expires_at: Date;
          }>
        >`SELECT id, user_id, admin_id, revoked_at, expires_at
             FROM sessions
            WHERE refresh_token_hash = ${hash}
            LIMIT 1
              FOR UPDATE`;

        const s = rows[0];
        if (!s) return { kind: 'invalid' };

        if (s.expires_at < new Date()) return { kind: 'expired' };

        if (s.revoked_at !== null) {
          // REUSE DETECTED — revoke every live session for this owner (AUTH_V2.md §6).
          // The winner's successor is revoked too: security-first, no grace period.
          // Under a genuine race the loser lands here, so the end state is zero
          // valid sessions — never two. Committed before the 401 is thrown.
          const reuseOwnerId = s.user_id ?? s.admin_id;
          if (reuseOwnerId) {
            await this.revokeAllSessions(reuseOwnerId, !s.user_id, tx);
          }
          return { kind: 'reused' };
        }

        const ownerId = s.user_id ?? s.admin_id;
        if (!ownerId) return { kind: 'invalid' };
        const isAdmin = !s.user_id;

        // Preserve the admin's real role claim across rotation. Reading it inside
        // the transaction keeps the token consistent with the row we locked.
        let role = 'user';
        if (isAdmin) {
          const admin = await tx.adminUser.findUnique({
            where: { id: ownerId },
            select: { role: true },
          });
          if (!admin) return { kind: 'invalid' };
          role = admin.role;
        }

        const { tokens, sessionId: newSessionId } = await this.createSession(
          ownerId,
          isAdmin ? 'jito-admin' : 'jito-player',
          role,
          ip,
          undefined,
          tx,
        );

        // Revoke the old session and link it to its successor — same transaction,
        // still holding the row lock taken above.
        await tx.session.update({
          where: { id: s.id },
          data: { revokedAt: new Date(), replacedBySessionId: newSessionId },
        });

        return { kind: 'rotated', tokens };
      },
    );

    switch (outcome.kind) {
      case 'rotated':
        return outcome.tokens;
      case 'expired':
        throw new UnauthorizedException(AppErrorCode.SESSION_EXPIRED);
      case 'reused':
        throw new UnauthorizedException(AppErrorCode.REFRESH_TOKEN_REUSED);
      case 'invalid':
      default:
        throw new UnauthorizedException(AppErrorCode.SESSION_REVOKED);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Revoke a single session.
   *
   * `ownerId` scopes the revoke to the authenticated caller (defence in depth):
   * even if a wrong `sid` were ever passed, a caller can only revoke a session
   * it owns. Omitted for admin sessions, which are scoped by `adminId` instead.
   */
  async logout(sessionId: string, ownerId?: string, isAdmin = false): Promise<void> {
    const ownerScope = ownerId
      ? isAdmin
        ? { adminId: ownerId }
        : { userId: ownerId }
      : {};

    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null, ...ownerScope },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GetMe
  // ─────────────────────────────────────────────────────────────────────────────

  async getMe(userId: string): Promise<MeResult> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { pointsAccount: { select: { balanceMinor: true } } },
    });
    return {
      user: this.toProfile(user),
      balanceMinor: (user.pointsAccount?.balanceMinor ?? 0n).toString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Create a session row and sign its access token.
   *
   * `executor` lets the caller run this inside an existing interactive
   * transaction (refresh rotation) or standalone (login). It defaults to the
   * root client, so login and admin login are unchanged.
   */
  async createSession(
    ownerId: string,
    audience: string,
    role: string,
    ip: string,
    userAgent: string | undefined,
    executor: PrismaExecutor = this.prisma,
  ): Promise<{ tokens: AuthTokens; sessionId: string }> {
    const rawToken = randomBytes(32).toString('hex');
    const refreshTokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + this.config.jwtRefreshTtlSeconds * 1000);

    const sessionData: Prisma.SessionCreateInput = {
      refreshTokenHash,
      expiresAt,
      ipAddress: ip,
      userAgent,
      ...(audience === 'jito-player'
        ? { user: { connect: { id: ownerId } } }
        : { adminUser: { connect: { id: ownerId } } }),
    };

    const newSession = await executor.session.create({ data: sessionData });

    const jti = randomUUID();
    const accessToken = await this.jwt.signAsync(
      { sub: ownerId, aud: audience, role, sid: newSession.id, jti },
      {
        secret: this.config.jwtSecret,
        issuer: this.config.jwtIssuer,
        expiresIn: this.config.jwtAccessTtlSeconds,
      },
    );

    return {
      tokens: {
        accessToken,
        refreshToken: rawToken,
        expiresIn: this.config.jwtAccessTtlSeconds,
      },
      sessionId: newSession.id,
    };
  }

  private async handleFailedLogin(userId: string, currentCount: number): Promise<void> {
    const newCount = currentCount + 1;
    const shouldLock = newCount >= LOCKOUT_THRESHOLD;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: shouldLock ? 0 : newCount,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : undefined,
      },
    });
  }

  private async revokeAllSessions(
    ownerId: string,
    isAdmin: boolean,
    executor: PrismaExecutor = this.prisma,
  ): Promise<void> {
    const where = isAdmin
      ? { adminId: ownerId, revokedAt: null }
      : { userId: ownerId, revokedAt: null };
    await executor.session.updateMany({ where, data: { revokedAt: new Date() } });
  }

  private async advisoryUniquenessCheck(
    username: string,
    email: string | null,
    phone: string | null,
  ): Promise<void> {
    // Advisory only — concurrent registrations may bypass this.
    // DB unique constraints are authoritative (P2002 is caught in register()).
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        code: AppErrorCode.CONFLICT,
        message: 'Username or contact is already registered.',
      });
    }
  }

  private async checkRateLimit(
    key: string,
    max: number,
    windowSeconds: number,
    label: string,
  ): Promise<void> {
    try {
      const current = await this.redis.raw.incr(key);
      if (current === 1) {
        await this.redis.raw.expire(key, windowSeconds);
      }
      if (current > max) {
        this.logger.warn(`Rate limit exceeded: ${label} key=${key} count=${current}`);
        // 429 per docs/API_V2.md §11. `retryAfter` is surfaced as the Retry-After
        // header by GlobalExceptionFilter. The message is deliberately generic —
        // it must not reveal whether the account exists.
        throw new HttpException(
          {
            code: AppErrorCode.RATE_LIMIT_EXCEEDED,
            message: 'Too many requests. Please try again later.',
            retryAfter: windowSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (err: unknown) {
      // Any deliberate HTTP error (incl. the 429 above) must propagate — only a
      // genuine Redis failure may fail open.
      if (err instanceof HttpException) throw err;
      // Redis unavailable — fail open (DB-backed lockout is the authoritative guard)
      this.logger.warn(`Redis unavailable for rate limit (${label}) — allowing request`, (err as Error).stack);
    }
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private toProfile(user: {
    id: string;
    username: string;
    email: string | null;
    phone: string | null;
    displayName: string | null;
    status: string;
    createdAt: Date;
  }): UserProfile {
    // Explicit field selection — passwordHash, failedLoginCount, lockedUntil never returned
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}
