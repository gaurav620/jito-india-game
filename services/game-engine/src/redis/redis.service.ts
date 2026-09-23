/**
 * Redis service for the JITO Game Engine.
 *
 * Primary role: **Redis leader lock** (docs/GAME_ENGINE_V2.md §1).
 * The lock key is lock:game-engine:{env}, with a short TTL renewed continuously.
 * Only the lock holder acts as the single writer for round state transitions.
 *
 * Secondary role: pub/sub publisher for round-state events.
 * API instances subscribe to receive events and fan them out to WebSocket clients.
 *
 * Redis is NOT authoritative. If Redis becomes unavailable:
 *   - State transitions continue (PostgreSQL is truth — docs/GAME_ENGINE_V2.md §9)
 *   - Broadcasts degrade (events are missed, clients recover via REST snapshot)
 */
import { safeJsonStringify } from '@jito/shared';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { EngineConfigService } from '../config/engine-config.service'; // DI token — must be value import

@Injectable()
export class EngineRedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EngineRedisService.name);
  private client!: Redis;
  private publisherClient!: Redis;

  constructor(private readonly config: EngineConfigService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to Redis…');

    this.client = new Redis(this.config.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    // Separate connection for pub/sub publishing (cannot share with commands)
    this.publisherClient = new Redis(this.config.redisUrl, {
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (err: Error) => {
      // Fix B3: NestJS Logger.error(message, stack) — not pino-style
      this.logger.error('Redis (commands) connection error', err.stack);
    });

    this.publisherClient.on('error', (err: Error) => {
      this.logger.error('Redis (publisher) connection error', err.stack);
    });

    await this.client.ping();
    this.logger.log('Redis connected');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from Redis…');
    await this.client.quit();
    await this.publisherClient.quit();
    this.logger.log('Redis disconnected');
  }

  get raw(): Redis {
    return this.client;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------
  // Leader lock
  // ------------------------------------------------------------------

  /** The canonical lock key per environment */
  private leaderLockKey(): string {
    return `lock:game-engine:${this.config.nodeEnv}`;
  }

  /**
   * Attempt to acquire the leader lock.
   * Uses SET NX PX (atomic, no race condition).
   * Returns true if acquired, false if another instance holds it.
   */
  async acquireLeaderLock(holderId: string): Promise<boolean> {
    const result = await this.client.set(
      this.leaderLockKey(),
      holderId,
      'PX',
      this.config.leaderLockTtlMs,
      'NX',
    );
    return result === 'OK';
  }

  /**
   * Renew the leader lock — extend TTL atomically.
   * Only the current holder can renew (Lua script for atomicity).
   */
  async renewLeaderLock(holderId: string): Promise<boolean> {
    const script = `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('pexpire', KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
    const result = await this.client.eval(
      script,
      1,
      this.leaderLockKey(),
      holderId,
      String(this.config.leaderLockTtlMs),
    );
    return result === 1;
  }

  /**
   * Release the leader lock.
   * Only the current holder can release (Lua script for atomicity).
   */
  async releaseLeaderLock(holderId: string): Promise<void> {
    const script = `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else
        return 0
      end
    `;
    await this.client.eval(script, 1, this.leaderLockKey(), holderId);
  }

  // ------------------------------------------------------------------
  // Pub/Sub publishing
  // ------------------------------------------------------------------

  /**
   * Publish a round-state event to the fan-out channel.
   * API instances subscribe and forward to WebSocket rooms.
   */
  async publishRoundEvent(
    gameId: string,
    event: string,
    payload: unknown,
  ): Promise<void> {
    const channel = `game:events:${gameId}`;
    // Fix B4: Use safeJsonStringify so BigInt fields (e.g. stateVersion)
    // serialize to JSON strings rather than throwing TypeError.
    // Contract: BigInt → string ("1", not 1). See packages/shared/bigint-serializer.ts.
    await this.publisherClient.publish(channel, safeJsonStringify({ event, payload }));
  }
}
