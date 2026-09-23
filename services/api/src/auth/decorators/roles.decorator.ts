/**
 * @Roles() route metadata decorator.
 *
 * Marks an admin route as requiring a specific AdminRole.
 * Role matrix is NEEDS CLIENT CONFIRMATION (AUTH_V2.md Open Item #5).
 *
 * Usage:
 *   @Roles(AdminRole.super_admin, AdminRole.operator)
 *   @UseGuards(AdminJwtGuard, AdminStatusGuard, RolesGuard)
 *   async myRoute() { ... }
 */
import { SetMetadata } from '@nestjs/common';
import type { AdminRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
