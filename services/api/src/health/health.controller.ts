/**
 * Health controller — GET /api/v1/health and /api/v1/health/ready
 *
 * Two endpoints:
 *   /health       — liveness: is the process alive? Always 200 if reached.
 *   /health/ready — readiness: is the service ready to handle traffic?
 *                   Checks PostgreSQL connectivity and Redis connectivity.
 *
 * The liveness endpoint is used by ECS/ALB to decide whether to terminate
 * a container. The readiness endpoint is used by the load balancer to decide
 * whether to route traffic to this instance.
 *
 * A readiness check that fails does not indicate the process should be
 * killed — it may be a transient DB unavailability. ECS will keep the
 * container alive and drain traffic; when the dependency recovers, the
 * container becomes ready again.
 *
 * These endpoints are NOT auth-protected — they must be reachable by the
 * load balancer health-check target without a token.
 */
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import type { PrismaService } from '../database/prisma.service';
import type { RedisService } from '../redis/redis.service';

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
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * GET /api/v1/health — liveness probe.
   * Always 200 while the process is running.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  liveness(): LivenessResponse {
    return {
      status: 'ok',
      service: 'jito-api',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/v1/health/ready — readiness probe.
   * Returns 200 when both PostgreSQL and Redis are reachable.
   * Returns 503 when either is unreachable, with details.
   */
  @Get('ready')
  async readiness(): Promise<ReadinessResponse> {
    const [dbOk, redisOk] = await Promise.all([
      this.prisma.isHealthy(),
      this.redis.isHealthy(),
    ]);

    const checks = {
      database: dbOk ? ('up' as const) : ('down' as const),
      redis: redisOk ? ('up' as const) : ('down' as const),
    };

    return {
      status: dbOk && redisOk ? 'ok' : 'degraded',
      service: 'jito-api',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
