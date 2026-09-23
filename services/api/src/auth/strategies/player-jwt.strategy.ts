/**
 * Player JWT strategy — validates access tokens with aud: 'jito-player'.
 *
 * Registered as 'player-jwt' so PlayerJwtGuard can reference it by name.
 * Audience is enforced here: a token with aud: 'jito-admin' will fail
 * validation and return 401, making admin tokens structurally unusable on
 * player endpoints (AUTH_V2.md §1, ADR-021).
 */
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AppConfigService } from '../../config/app-config.service';

import type { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class PlayerJwtStrategy extends PassportStrategy(Strategy, 'player-jwt') {
  constructor(@Inject(AppConfigService) config: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret,
      issuer: config.jwtIssuer,
      audience: config.jwtAudiencePlayer,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    // Passport calls this only if signature, expiry, issuer, and audience pass.
    // Enforce audience claim explicitly for defence-in-depth.
    if (payload.aud !== 'jito-player') {
      throw new UnauthorizedException('Invalid token audience');
    }
    if (!payload.sub || !payload.sid) {
      throw new UnauthorizedException('Malformed token payload');
    }
    return payload;
  }
}
