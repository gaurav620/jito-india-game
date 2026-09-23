/**
 * Login DTO — player and admin login credentials.
 *
 * Unknown fields are REJECTED (not stripped) by the global ValidationPipe
 * (whitelist: true, forbidNonWhitelisted: true).
 */
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
