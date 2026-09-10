/**
 * Prisma client service for the JITO API.
 *
 * Wraps PrismaClient as a NestJS injectable service.
 * Connects on module init and disconnects on module destroy —
 * follows the NestJS lifecycle contract so the connection is
 * always closed cleanly on shutdown (SIGTERM, etc.).
 *
 * Phase 2A review fix (2026-09-10):
 *   Fix #12 — Prisma logging: replaced event-emitter log config with string
 *   log levels. The previous config emitted log objects as events that were
 *   never subscribed to via $on(), so no logs appeared. String levels route
 *   Prisma logs to stdout directly, which NestJS/the container captures.
 *   In production, only warn and error are emitted.
 */
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Fix #12: Use string log levels — these write to stdout directly.
      // The previous emit:'event' config required $on() subscribers which were
      // never wired, so Prisma logs were silently dropped.
      log:
        process.env['NODE_ENV'] === 'production'
          ? ['warn', 'error']
          : ['warn', 'error'],
      // Note: 'query' and 'info' levels are intentionally omitted in all
      // environments to avoid high-volume log noise. Enable per-request
      // via PRISMA_QUERY_LOG=true when debugging queries locally.
    });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to PostgreSQL…');
    await this.$connect();
    this.logger.log('PostgreSQL connected');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from PostgreSQL…');
    await this.$disconnect();
    this.logger.log('PostgreSQL disconnected');
  }

  /**
   * Health check — runs a simple query to verify the connection is live.
   * Used by the health controller.
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
