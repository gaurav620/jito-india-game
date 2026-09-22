/**
 * AdminPointsController — admin points adjustment.
 *
 * docs/API_V2.md §8.2: POST /admin/users/:id/points/adjust — operator+.
 *
 * Guard chain: AdminJwtGuard → AdminStatusGuard → RolesGuard, matching the
 * existing approved admin auth boundary (AUTH_V2.md §1, §9). Role
 * requirement is NEEDS CLIENT CONFIRMATION (AUTH_V2.md Open Item #5); until
 * confirmed, `operator` and `super_admin` are permitted per the "operator+"
 * wording already approved in docs/API_V2.md §8.2 — not a new decision.
 */
import { Body, Controller, Headers, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import type { Request } from 'express';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminJwtGuard } from '../../auth/guards/admin-jwt.guard';
import { AdminStatusGuard } from '../../auth/guards/admin-status.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { JwtPayload } from '../../auth/strategies/jwt-payload.interface';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AdminPointsService } from './admin-points.service'; // DI token — must be value import
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AdjustPointsDto } from './dto/adjust-points.dto'; // @Body() — needs runtime metadata

@Controller('admin/users/:id/points')
@UseGuards(AdminJwtGuard, AdminStatusGuard, RolesGuard)
export class AdminPointsController {
  constructor(private readonly adminPointsService: AdminPointsService) {}

  /** POST /api/v1/admin/users/:id/points/adjust */
  @Post('adjust')
  @HttpCode(HttpStatus.CREATED)
  @Roles(AdminRole.operator, AdminRole.super_admin)
  async adjust(
    @CurrentUser() admin: JwtPayload,
    @Param('id') targetUserId: string,
    @Body() dto: AdjustPointsDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() req: Request,
  ) {
    const ip = req.ip ?? req.socket.remoteAddress ?? '0.0.0.0';
    const result = await this.adminPointsService.adjust({
      adminId: admin.sub,
      targetUserId,
      dto,
      idempotencyKey,
      ip,
    });
    return { success: true, ...result };
  }
}
