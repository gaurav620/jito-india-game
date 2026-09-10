/**
 * Environment configuration schema for the JITO API service.
 *
 * All required env vars are validated at startup — if any are missing or
 * invalid, the service refuses to start with a clear error message.
 * This prevents silent failures from misconfiguration in production.
 *
 * Env vars are declared as a plain class validated by class-validator.
 * @nestjs/config calls `validateSync` at bootstrap (via validate option).
 */
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum LogLevel {
  Fatal = 'fatal',
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Trace = 'trace',
}

export enum LogFormat {
  Json = 'json',
  Pretty = 'pretty',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @IsPositive()
  @Min(1024)
  @Max(65535)
  API_PORT: number = 3001;

  // ------------------------------------------------------------------
  // Database (PostgreSQL via Prisma)
  // ------------------------------------------------------------------

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  // ------------------------------------------------------------------
  // Redis
  // ------------------------------------------------------------------

  @IsString()
  @IsNotEmpty()
  REDIS_URL!: string;

  // ------------------------------------------------------------------
  // Authentication
  // ------------------------------------------------------------------

  // Phase 2A review fix #14: require minimum 32-character secret in all
  // environments so a weak/default secret is caught at startup before any
  // JWT is issued. 32 chars = 256 bits of entropy for a random hex string,
  // which is the minimum acceptable for HS256 HMAC. Prefer 64+ chars in prod.
  @IsString()
  @IsNotEmpty()
  @MinLength(32, {
    message: 'JWT_SECRET must be at least 32 characters. Use a strong random secret in production.',
  })
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_AUDIENCE_PLAYER: string = 'jito-player';

  @IsString()
  @IsNotEmpty()
  JWT_AUDIENCE_ADMIN: string = 'jito-admin';

  @IsString()
  @IsNotEmpty()
  JWT_ISSUER: string = 'jito-api';

  /** Access token TTL in seconds (default 15 minutes per AUTH_V2.md §4) */
  @IsInt()
  @IsPositive()
  JWT_ACCESS_TTL_SECONDS: number = 900;

  /** Refresh token TTL in seconds (default 7 days per AUTH_V2.md §4) */
  @IsInt()
  @IsPositive()
  JWT_REFRESH_TTL_SECONDS: number = 604800;

  // ------------------------------------------------------------------
  // Logging
  // ------------------------------------------------------------------

  @IsEnum(LogLevel)
  LOG_LEVEL: LogLevel = LogLevel.Info;

  @IsEnum(LogFormat)
  LOG_FORMAT: LogFormat = LogFormat.Json;

  // ------------------------------------------------------------------
  // Idempotency key cache (Redis TTL in seconds)
  // ------------------------------------------------------------------

  @IsInt()
  @IsPositive()
  IDEMPOTENCY_CACHE_TTL_SECONDS: number = 86400; // 24 hours

  // ------------------------------------------------------------------
  // Optional / AWS (not required for local dev)
  // ------------------------------------------------------------------

  @IsString()
  @IsOptional()
  AWS_REGION?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;
}

/**
 * Validate environment variables at bootstrap.
 * Called by ConfigModule.forRoot({ validate }).
 * Throws on the first invalid configuration to fail fast.
 */
export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`[API] Environment configuration error: ${messages}`);
  }

  return validated;
}
