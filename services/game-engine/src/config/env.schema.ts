/**
 * Environment configuration schema for the JITO Game Engine service.
 *
 * The game engine is a SINGLE WRITER (ADR-017). It holds the leader lock in
 * Redis and is the only process that transitions round state.
 *
 * ECS desired-count must be 1. The Redis leader lock prevents a deploy overlap
 * from producing two active engines. The partial unique index on game_rounds
 * makes a duplicate live round impossible even if both fail.
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

export class EngineEnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @IsPositive()
  @Min(1024)
  @Max(65535)
  GAME_ENGINE_PORT: number = 3003;

  // ------------------------------------------------------------------
  // Database
  // ------------------------------------------------------------------

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  // ------------------------------------------------------------------
  // Redis (leader lock + pub/sub)
  // ------------------------------------------------------------------

  @IsString()
  @IsNotEmpty()
  REDIS_URL!: string;

  /**
   * Leader lock TTL in milliseconds.
   * The engine renews before expiry; if it crashes, the lock expires
   * and a restarted engine acquires it (docs/GAME_ENGINE_V2.md §1).
   */
  @IsInt()
  @IsPositive()
  ENGINE_LEADER_LOCK_TTL_MS: number = 5000;

  /**
   * Reconciler tick interval in milliseconds (~250ms per spec).
   * NEEDS CLIENT CONFIRMATION — actual game timing is client-confirmed.
   */
  @IsInt()
  @IsPositive()
  ENGINE_TICK_INTERVAL_MS: number = 250;

  // ------------------------------------------------------------------
  // Round lifecycle (Phase 2D, step 6 — docs/GAME_ENGINE_V2.md §4)
  // ------------------------------------------------------------------

  /**
   * Betting window duration (T_bet) in milliseconds — how long a round stays
   * BETTING_OPEN/BETTING_ACTIVE before the engine locks it.
   *
   * NEEDS CLIENT CONFIRMATION (docs/CLIENT_REQUIREMENTS.md item 1;
   * docs/GAME_ENGINE_V2.md §4 — "No timing values are invented in this
   * design"). The default below is a short, deterministic value for local
   * development and tests ONLY — it is explicitly NOT the Phase 1 UI mock
   * value (73/84/90s) and must not be promoted to a production default.
   * Applied identically to every game in ACTIVE_GAME_IDS: no Timer vs Pro
   * Timer difference is invented here (item 4 gates introducing one).
   */
  @IsInt()
  @IsPositive()
  ROUND_BETTING_WINDOW_MS: number = 30000;

  // ------------------------------------------------------------------
  // Logging
  // ------------------------------------------------------------------

  @IsEnum(LogLevel)
  LOG_LEVEL: LogLevel = LogLevel.Info;

  // ------------------------------------------------------------------
  // Optional
  // ------------------------------------------------------------------

  @IsString()
  @IsOptional()
  AWS_REGION?: string;
}

export function validateEngineEnv(
  config: Record<string, unknown>,
): EngineEnvironmentVariables {
  const validated = plainToInstance(EngineEnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`[GameEngine] Environment configuration error: ${messages}`);
  }

  return validated;
}
