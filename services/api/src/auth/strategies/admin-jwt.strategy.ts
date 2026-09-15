/**
 * Admin JWT strategy — validates access tokens with aud: 'jito-admin'.
 *
 * Registered as 'admin-jwt'. A player token (aud: 'jito-player') will fail
 * audience validation here, making player tokens structurally unusable on
 * admin endpoints (AUTH_V2.md §1, ADR-021).
 */
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AppConfigService } from '../../config/app-config.service';

import type { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(@Inject(AppConfigService) config: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret,
      issuer: config.jwtIssuer,
      audience: config.jwtAudienceAdmin,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (payload.aud !== 'jito-admin') {
      throw new UnauthorizedException('Invalid token audience');
    }
    if (!payload.sub || !payload.sid) {
      throw new UnauthorizedException('Malformed token payload');
    }
    return payload;
  }
}
