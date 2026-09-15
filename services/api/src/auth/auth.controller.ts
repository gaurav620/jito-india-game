/**
 * AuthController — player authentication endpoints.
 *
 * All routes prefixed /auth (global prefix api/v1 set in main.ts → api/v1/auth).
 *
 * Security:
 *   - No passwordHash or refreshTokenHash in any response
 *   - X-Request-Id correlation handled by RequestIdInterceptor (global)
 *   - Refresh cookie: httpOnly, sameSite=strict, path=/api/v1/auth
 *   - Error envelope: GlobalExceptionFilter (global)
 *   - Unknown request fields: rejected by global ValidationPipe (not stripped)
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
import { AppConfigService } from '../config/app-config.service'; // DI token — must be value import

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AuthService } from './auth.service'; // DI token — must be value import
import { CurrentUser } from './decorators/current-user.decorator';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { LoginDto } from './dto/login.dto'; // @Body() — needs runtime metadata
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { RefreshDto } from './dto/refresh.dto'; // @Body() — needs runtime metadata
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { RegisterDto } from './dto/register.dto'; // @Body() — needs runtime metadata
import { PlayerJwtGuard } from './guards/player-jwt.guard';
import { UserStatusGuard } from './guards/user-status.guard';
import type { JwtPayload } from './strategies/jwt-payload.interface';

/** Cookie name for the refresh token */
const REFRESH_COOKIE = 'jito_refresh';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfigService,
  ) {}

  /** POST /api/v1/auth/register — player self-registration */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ip = (req.ip ?? req.socket.remoteAddress ?? '0.0.0.0');
    const user = await this.authService.register(dto, ip);
    return { success: true, user };
  }

  /** POST /api/v1/auth/login — issue access + refresh tokens */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ip = req.ip ?? req.socket.remoteAddress ?? '0.0.0.0';
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(dto, ip, userAgent);

    this.setRefreshCookie(res, result.refreshToken);

    return {
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      user: result.user,
      balanceMinor: result.balanceMinor,
    };
  }

  /** POST /api/v1/auth/refresh — rotate refresh token */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip ?? req.socket.remoteAddress ?? '0.0.0.0';
    // Cookie is primary; body is fallback for desktop/mobile (AUTH_V2.md §4)
    const rawToken =
      (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE] ??
      dto.refreshToken;

    if (!rawToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const tokens = await this.authService.refresh(rawToken, ip);
    this.setRefreshCookie(res, tokens.refreshToken);

    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  /** POST /api/v1/auth/logout — revoke current session */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PlayerJwtGuard, UserStatusGuard)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Scope the revoke to the authenticated player (defence in depth)
    await this.authService.logout(user.sid, user.sub, false);
    this.clearRefreshCookie(res);
    return { success: true };
  }

  /** POST /api/v1/auth/logout-all — revoke all sessions for this user */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PlayerJwtGuard, UserStatusGuard)
  async logoutAll(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.sub);
    this.clearRefreshCookie(res);
    return { success: true };
  }

  /** GET /api/v1/auth/me — current player identity and balance */
  @Get('me')
  @UseGuards(PlayerJwtGuard, UserStatusGuard)
  async me(@CurrentUser() user: JwtPayload) {
    const result = await this.authService.getMe(user.sub);
    return { success: true, ...result };
  }

  // ─── Cookie helpers ───────────────────────────────────────────────────────────

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: this.config.jwtRefreshTtlSeconds * 1000,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'strict',
      path: '/api/v1/auth',
    });
  }
}
