/**
 * Typed app config accessor.
 * Wraps @nestjs/config ConfigService with strong types from the schema.
 */
import { Injectable } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type { EnvironmentVariables, LogFormat, LogLevel, NodeEnv } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  get nodeEnv(): NodeEnv {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get port(): number {
    return this.config.get('API_PORT', { infer: true });
  }

  get databaseUrl(): string {
    return this.config.get('DATABASE_URL', { infer: true });
  }

  get redisUrl(): string {
    return this.config.get('REDIS_URL', { infer: true });
  }

  get jwtSecret(): string {
    return this.config.get('JWT_SECRET', { infer: true });
  }

  get jwtAudiencePlayer(): string {
    return this.config.get('JWT_AUDIENCE_PLAYER', { infer: true });
  }

  get jwtAudienceAdmin(): string {
    return this.config.get('JWT_AUDIENCE_ADMIN', { infer: true });
  }

  get jwtIssuer(): string {
    return this.config.get('JWT_ISSUER', { infer: true });
  }

  get jwtAccessTtlSeconds(): number {
    return this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true });
  }

  get jwtRefreshTtlSeconds(): number {
    return this.config.get('JWT_REFRESH_TTL_SECONDS', { infer: true });
  }

  get logLevel(): LogLevel {
    return this.config.get('LOG_LEVEL', { infer: true });
  }

  get logFormat(): LogFormat {
    return this.config.get('LOG_FORMAT', { infer: true });
  }

  get idempotencyCacheTtlSeconds(): number {
    return this.config.get('IDEMPOTENCY_CACHE_TTL_SECONDS', { infer: true });
  }

  get corsOrigins(): string[] {
    const raw = this.config.get('CORS_ORIGINS', { infer: true });
    if (!raw) return [];
    return raw.split(',').map((o) => o.trim());
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }
}
