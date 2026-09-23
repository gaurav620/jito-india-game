/**
 * @CurrentUser() param decorator.
 * Extracts the JWT payload set by Passport strategy from req.user.
 * Type: JwtPayload — { sub, sid, aud, role }.
 */
import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

import type { JwtPayload } from '../strategies/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    return request.user;
  },
);
