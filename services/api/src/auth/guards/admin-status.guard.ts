/**
 * AdminStatusGuard — live session revocation + admin status enforcement.
 *
 * Applied AFTER AdminJwtGuard on all admin-protected routes.
 *
 * Mirrors UserStatusGuard but for the admin domain:
 *   1. SESSION CHECK (PostgreSQL-authoritative): session must exist, not revoked, not expired.
 *      Uses admin_id = payload.sub (admin sessions have admin_id non-null, user_id null).
 *   2. ADMIN STATUS CHECK: admin_users.status must be 'active'.
 *      Only two statuses exist: 'active' | 'inactive' (AdminStatus enum — not invented).
 *      'inactive' → 403 FORBIDDEN.
 *
 * No Redis cache for admin status (low volume, small number of admin accounts).
 * Queries PostgreSQL directly.
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
import type { JwtPayload } from '../strategies/jwt-payload.interface';

@Injectable()
export class AdminStatusGuard implements CanActivate {
  private readonly logger = new Logger(AdminStatusGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    const payload = request.user;

    if (!payload?.sub || !payload.sid) {
      throw new UnauthorizedException(AppErrorCode.UNAUTHORIZED);
    }

    // ── 1. Session validity (PostgreSQL-authoritative) ─────────────────────────
    const session = await this.prisma.session.findFirst({
      where: {
        id: payload.sid,
        adminId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!session) {
      this.logger.warn(
        `Admin session not found or revoked — adminId=${payload.sub} sid=${payload.sid}`,
      );
      throw new UnauthorizedException(AppErrorCode.SESSION_REVOKED);
    }

    // ── 2. Admin status check (PostgreSQL-direct) ──────────────────────────────
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { status: true },
    });

    if (!admin) {
      throw new UnauthorizedException(AppErrorCode.UNAUTHORIZED);
    }

    if (admin.status !== 'active') {
      throw new ForbiddenException(AppErrorCode.FORBIDDEN);
    }

    return true;
  }
}
