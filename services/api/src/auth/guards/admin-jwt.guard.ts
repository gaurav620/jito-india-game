/**
 * AdminJwtGuard — enforces valid admin JWT (aud: 'jito-admin').
 *
 * Applies the AdminJwtStrategy. Use in combination with AdminStatusGuard
 * and optionally RolesGuard.
 *
 * Usage:
 *   @UseGuards(AdminJwtGuard, AdminStatusGuard)
 *   async myAdminRoute(@CurrentUser() user: JwtPayload) { ... }
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminJwtGuard extends AuthGuard('admin-jwt') {}
