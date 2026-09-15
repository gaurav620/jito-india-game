/**
 * Redis client service for the JITO API.
 *
 * Redis is used for:
 *   1. Rate-limit counters (per IP and per account — docs/AUTH_V2.md §7, API_V2.md §10)
 *   2. User-status cache (suspended/banned checks — docs/AUTH_V2.md §9)
 *   3. Idempotency key cache (pre-check before DB write)
 *   4. Pub/Sub subscription (round events from game-engine — docs/WEBSOCKET_V2.md §1)
 *
 * Redis is NOT authoritative. Every value is reconstructable from PostgreSQL.
 * A Redis outage degrades delivery but does NOT corrupt state (ADR-019).
 *
 * All authoritative checks (balance, round state, deadline) happen inside
 * PostgreSQL transactions — Redis is never trusted for these decisions.
 */
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AppConfigService } from '../config/app-config.service'; // DI token — must be value import

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly config: AppConfigService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to Redis…');
    this.client = new Redis(this.config.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    this.client.on('error', (err: Error) => {
      // NestJS Logger.error(message, stack) — not pino-style
      this.logger.error('Redis connection error', err.stack);
    });

    this.client.on('ready', () => {
      this.logger.log('Redis connected');
    });

    await this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from Redis…');
    await this.client.quit();
    this.logger.log('Redis disconnected');
  }

  /** Expose the raw ioredis client for advanced use-cases */
  get raw(): Redis {
    return this.client;
  }

  /**
   * Health check — PING to verify the connection is live.
   * Used by the health controller.
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------
  // Key helpers (namespaced to avoid collisions)
  // ------------------------------------------------------------------

  /** Rate-limit key: login by IP */
  loginRateLimitIpKey(ip: string): string {
    return `ratelimit:login:ip:${ip}`;
  }

  /** Rate-limit key: login by username */
  loginRateLimitUserKey(username: string): string {
    return `ratelimit:login:user:${username}`;
  }

  /** Rate-limit key: register by IP */
  registerRateLimitIpKey(ip: string): string {
    return `ratelimit:register:ip:${ip}`;
  }

  /** Rate-limit key: bet placement per user */
  betRateLimitKey(userId: string): string {
    return `ratelimit:bet:user:${userId}`;
  }

  /** Idempotency pre-check cache */
  idempotencyKey(key: string): string {
    return `idem:${key}`;
  }

  /** User-status cache (suspended/banned) */
  userStatusKey(userId: string): string {
    return `user:status:${userId}`;
  }

  /** Rate-limit key: refresh per session (AUTH_V2.md §7 — 10/min) */
  refreshRateLimitSessionKey(sessionId: string): string {
    return `ratelimit:refresh:session:${sessionId}`;
  }

  /** Rate-limit key: admin login by IP (AUTH_V2.md §7) */
  adminLoginRateLimitIpKey(ip: string): string {
    return `ratelimit:login:admin:ip:${ip}`;
  }
}
