/**
 * PlayerJwtGuard — enforces valid player JWT (aud: 'jito-player').
 *
 * Applies the PlayerJwtStrategy. Use in combination with UserStatusGuard
 * for full session-revocation and status enforcement.
 *
 * Usage:
 *   @UseGuards(PlayerJwtGuard, UserStatusGuard)
 *   async myPlayerRoute(@CurrentUser() user: JwtPayload) { ... }
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PlayerJwtGuard extends AuthGuard('player-jwt') {}
