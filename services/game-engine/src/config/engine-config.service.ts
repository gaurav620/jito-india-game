import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ConfigService } from '@nestjs/config'; // DI token — must be value import

import type { EngineEnvironmentVariables, LogLevel, NodeEnv } from './env.schema';

@Injectable()
export class EngineConfigService {
  constructor(
    private readonly config: ConfigService<EngineEnvironmentVariables, true>,
  ) {}

  get nodeEnv(): NodeEnv {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get port(): number {
    return this.config.get('GAME_ENGINE_PORT', { infer: true });
  }

  get databaseUrl(): string {
    return this.config.get('DATABASE_URL', { infer: true });
  }

  get redisUrl(): string {
    return this.config.get('REDIS_URL', { infer: true });
  }

  get leaderLockTtlMs(): number {
    return this.config.get('ENGINE_LEADER_LOCK_TTL_MS', { infer: true });
  }

  get tickIntervalMs(): number {
    return this.config.get('ENGINE_TICK_INTERVAL_MS', { infer: true });
  }

  get logLevel(): LogLevel {
    return this.config.get('LOG_LEVEL', { infer: true });
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
