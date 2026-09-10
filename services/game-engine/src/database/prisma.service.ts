/**
 * Prisma client service for the JITO Game Engine.
 *
 * Phase 2A review fix (2026-09-10):
 *   Fix #12 — Prisma logging: replaced event-emitter config with string log
 *   levels. Event-based config required $on() subscribers that were never
 *   wired, so logs were silently dropped.
 */
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class EnginePrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(EnginePrismaService.name);

  constructor() {
    super({
      // Fix #12: String log levels write to stdout directly (no $on() needed).
      log: ['warn', 'error'],
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

  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
