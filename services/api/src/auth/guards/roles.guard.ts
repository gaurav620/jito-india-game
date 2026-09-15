/**
 * RolesGuard — admin role enforcement.
 *
 * Foundation guard for admin routes. Reads @Roles() metadata and loads
 * AdminUser.role from DB.
 *
 * NOTE: Admin role/permission matrix is NEEDS CLIENT CONFIRMATION
 * (AUTH_V2.md Open Item #5). Until confirmed, routes using this guard
 * are protected structurally but the specific role requirements may change.
 *
 * Must be applied AFTER AdminJwtGuard + AdminStatusGuard.
 */
import type {
  CanActivate,
  ExecutionContext} from '@nestjs/common';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { Reflector } from '@nestjs/core'; // DI token — must be value import
import type { AdminRole } from '@prisma/client';
import type { Request } from 'express';

import { AppErrorCode } from '../../common/errors';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../database/prisma.service'; // DI token — must be value import
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { JwtPayload } from '../strategies/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // If no @Roles() decorator — allow any authenticated admin
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    const payload = request.user;
    if (!payload?.sub) throw new UnauthorizedException(AppErrorCode.UNAUTHORIZED);

    // Load role from DB (authoritative — not from JWT claim)
    // NEEDS CLIENT CONFIRMATION: role matrix (AUTH_V2.md Open Item #5)
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { role: true },
    });

    if (!admin) throw new UnauthorizedException(AppErrorCode.UNAUTHORIZED);
    if (!requiredRoles.includes(admin.role)) throw new ForbiddenException(AppErrorCode.FORBIDDEN);

    return true;
  }
}
