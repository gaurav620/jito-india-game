/**
 * AdminAuthController — admin authentication endpoints.
 *
 * Route prefix: /api/v1/admin/auth
 *
 * Session revocation enforcement applies on protected routes via AdminStatusGuard.
 * Refresh cookie: same attributes as player (httpOnly, sameSite=strict, path-scoped).
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { LoginDto } from '../../auth/dto/login.dto'; // @Body() — needs runtime metadata
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { RefreshDto } from '../../auth/dto/refresh.dto'; // @Body() — needs runtime metadata
import { AdminJwtGuard } from '../../auth/guards/admin-jwt.guard';
import { AdminStatusGuard } from '../../auth/guards/admin-status.guard';
import type { JwtPayload } from '../../auth/strategies/jwt-payload.interface';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AppConfigService } from '../../config/app-config.service'; // DI token — must be value import

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AdminAuthService } from './admin-auth.service'; // DI token

const ADMIN_REFRESH_COOKIE = 'jito_admin_refresh';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly config: AppConfigService,
  ) {}

  /** POST /api/v1/admin/auth/login */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ip = req.ip ?? req.socket.remoteAddress ?? '0.0.0.0';
    const userAgent = req.headers['user-agent'];
    const result = await this.adminAuthService.login(dto, ip, userAgent);
    this.setRefreshCookie(res, result.refreshToken);
    return {
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      admin: result.admin,
    };
  }

  /** POST /api/v1/admin/auth/refresh */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ip = req.ip ?? req.socket.remoteAddress ?? '0.0.0.0';
    const rawToken =
      (req.cookies as Record<string, string> | undefined)?.[ADMIN_REFRESH_COOKIE] ??
      dto.refreshToken;

    if (!rawToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const tokens = await this.adminAuthService.refresh(rawToken, ip);
    this.setRefreshCookie(res, tokens.refreshToken);
    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  /** POST /api/v1/admin/auth/logout */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard, AdminStatusGuard)
  async logout(@CurrentUser() user: JwtPayload, @Res({ passthrough: true }) res: Response) {
    // Scope the revoke to the authenticated admin (defence in depth)
    await this.adminAuthService.logout(user.sid, user.sub);
    this.clearRefreshCookie(res);
    return { success: true };
  }

  /** GET /api/v1/admin/auth/me */
  @Get('me')
  @UseGuards(AdminJwtGuard, AdminStatusGuard)
  async me(@CurrentUser() user: JwtPayload) {
    const admin = await this.adminAuthService.getMe(user.sub);
    return { success: true, admin };
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(ADMIN_REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'strict',
      path: '/api/v1/admin/auth',
      maxAge: this.config.jwtRefreshTtlSeconds * 1000,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(ADMIN_REFRESH_COOKIE, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'strict',
      path: '/api/v1/admin/auth',
    });
  }
}
