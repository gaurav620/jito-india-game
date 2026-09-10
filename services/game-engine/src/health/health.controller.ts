/**
 * Health controller for the JITO Game Engine service.
 *
 * Fix 2026-09-10 (Phase 2A review):
 *   - EnginePrismaService and EngineRedisService are DI-injected: must use
 *     VALUE imports so Reflect.metadata can resolve the constructor token.
 *   - Readiness returns HTTP 503 when any dependency is unhealthy (Fix #3).
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';

// Value imports required: these are NestJS DI constructor tokens.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { EnginePrismaService } from '../database/prisma.service';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { EngineRedisService } from '../redis/redis.service';

export interface LivenessResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}

export interface ReadinessResponse {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  checks: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

@Controller('health')
export class EngineHealthController {
  constructor(
    private readonly prisma: EnginePrismaService,
    private readonly redis: EngineRedisService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  liveness(): LivenessResponse {
    return {
      status: 'ok',
      service: 'jito-game-engine',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/v1/health/ready — readiness probe.
   * Returns 200 when both PostgreSQL and Redis are reachable.
   * Returns 503 SERVICE_UNAVAILABLE when either is unreachable.
   */
  @Get('ready')
  async readiness(@Res() res: Response): Promise<void> {
    const [dbOk, redisOk] = await Promise.all([
      this.prisma.isHealthy(),
      this.redis.isHealthy(),
    ]);

    const healthy = dbOk && redisOk;
    const body: ReadinessResponse = {
      status: healthy ? 'ok' : 'degraded',
      service: 'jito-game-engine',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbOk ? 'up' : 'down',
        redis: redisOk ? 'up' : 'down',
      },
    };

    res
      .status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
      .json(body);
  }
}
