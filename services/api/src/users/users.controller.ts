/**
 * UsersController — player profile and password endpoints.
 *
 * All routes require PlayerJwtGuard + UserStatusGuard (live session revocation
 * enforcement on every request, per AUTH_V2.md §9).
 *
 * X-Request-Id correlation is handled globally by RequestIdInterceptor.
 * Unknown fields in request body are REJECTED (not stripped) by the global ValidationPipe.
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlayerJwtGuard } from '../auth/guards/player-jwt.guard';
import { UserStatusGuard } from '../auth/guards/user-status.guard';
import type { JwtPayload } from '../auth/strategies/jwt-payload.interface';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ChangePasswordDto } from './dto/change-password.dto'; // @Body() — needs runtime metadata
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { UpdateProfileDto } from './dto/update-profile.dto'; // @Body() — needs runtime metadata
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { UsersService } from './users.service'; // DI token — must be value import

@Controller('users')
@UseGuards(PlayerJwtGuard, UserStatusGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /api/v1/users/profile */
  @Get('profile')
  async getProfile(@CurrentUser() user: JwtPayload) {
    const profile = await this.usersService.getProfile(user.sub);
    return { success: true, ...profile };
  }

  /** PATCH /api/v1/users/profile */
  @Patch('profile')
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    const profile = await this.usersService.updateProfile(user.sub, dto);
    return { success: true, ...profile };
  }

  /** PATCH /api/v1/users/password */
  @Patch('password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    await this.usersService.changePassword(user.sub, dto);
    return { success: true, message: 'Password changed. All sessions have been revoked.' };
  }
}
