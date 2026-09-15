/**
 * Change password DTO.
 * Unknown fields are REJECTED (not stripped) by the global ValidationPipe.
 */
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  /**
   * Minimum 8 characters. INTERIM — NEEDS CLIENT CONFIRMATION for final policy.
   */
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters. INTERIM — NEEDS CLIENT CONFIRMATION.' })
  newPassword!: string;
}
