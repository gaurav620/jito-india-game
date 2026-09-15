/**
 * Update profile DTO — player profile update.
 * Only displayName is mutable in Phase 2B.
 * Contact field updates are NEEDS CLIENT CONFIRMATION.
 *
 * Unknown fields are REJECTED (not stripped) by the global ValidationPipe.
 */
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;
}
