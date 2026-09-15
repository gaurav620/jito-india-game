/**
 * Registration DTO — player self-registration.
 *
 * IMPORTANT: Mandatory field requirements are INTERIM — NEEDS CLIENT CONFIRMATION.
 * Current interim contract (AUTH_V2.md §2):
 *   username + password + (email OR phone — at least one)
 *
 * The global ValidationPipe (whitelist: true, forbidNonWhitelisted: true) in main.ts
 * REJECTS any request containing fields not declared here with 400 VALIDATION_ERROR.
 * Fields such as role, status, balance, isAdmin, points are NOT declared and will
 * therefore be REJECTED, not stripped.
 */
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  username!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters. INTERIM — NEEDS CLIENT CONFIRMATION.' })
  @MaxLength(100)
  password!: string;

  /**
   * Email is optional individually, but at least one of email/phone is required.
   * INTERIM — NEEDS CLIENT CONFIRMATION (AUTH_V2.md Open Item #1).
   */
  @IsEmail()
  @IsOptional()
  email?: string;

  /**
   * Phone is optional individually, but at least one of email/phone is required.
   * INTERIM — NEEDS CLIENT CONFIRMATION.
   */
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;
}
