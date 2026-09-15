/**
 * Refresh token DTO — body fallback when the httpOnly cookie is unavailable.
 * Primary path: cookie. Body is the fallback for desktop/mobile clients.
 */
import { IsOptional, IsString } from 'class-validator';

export class RefreshDto {
  @IsString()
  @IsOptional()
  refreshToken?: string;
}
