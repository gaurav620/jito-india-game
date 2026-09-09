import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import type { EnginePrismaService } from '../database/prisma.service';
import type { EngineRedisService } from '../redis/redis.service';

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

  @Get('ready')
  async readiness(): Promise<ReadinessResponse> {
    const [dbOk, redisOk] = await Promise.all([
      this.prisma.isHealthy(),
      this.redis.isHealthy(),
    ]);

    return {
      status: dbOk && redisOk ? 'ok' : 'degraded',
      service: 'jito-game-engine',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbOk ? 'up' : 'down',
        redis: redisOk ? 'up' : 'down',
      },
    };
  }
}
