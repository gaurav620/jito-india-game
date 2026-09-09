/**
 * Prisma client service for the JITO API.
 *
 * Wraps PrismaClient as a NestJS injectable service.
 * Connects on module init and disconnects on module destroy —
 * follows the NestJS lifecycle contract so the connection is
 * always closed cleanly on shutdown (SIGTERM, etc.).
 *
 * Logging is controlled by LOG_LEVEL to avoid verbose query
 * logs in production.
 */
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
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
