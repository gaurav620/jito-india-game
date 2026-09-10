/**
 * Global HTTP exception filter for the game engine service.
 * Identical in contract to the API service filter — standard error envelope.
 *
 * Phase 2A review fixes (2026-09-10):
 *   Fix #8  — Actual error message + stack preserved in logger call.
 *   Fix #11 — NestJS Logger.error(message, stack) — correct signature.
 *   Fix #16 — 5xx HttpExceptions are now also logged at error level.
 */
import type {
  ArgumentsHost,
  ExceptionFilter} from '@nestjs/common';
import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class EngineExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(EngineExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const isProduction = process.env['NODE_ENV'] === 'production';

    let statusCode: number;
    let message: string;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const r = exception.getResponse();
      message = typeof r === 'string' ? r : (r as { message?: string }).message ?? exception.message;

      // Fix #16: Log 5xx HttpExceptions at error level.
      if (statusCode >= 500) {
        // Fix #11: NestJS Logger.error(message, stack) — correct signature.
        this.logger.error(
          `HttpException 5xx [${statusCode}] ${message} — path=${request.url}`,
          exception.stack,
        );
      }
    } else {
      // Fix #8: Preserve actual error message + stack.
      const errMessage = exception instanceof Error ? exception.message : String(exception);
      const errStack = exception instanceof Error ? exception.stack : undefined;

      // Fix #11: NestJS Logger.error(message, stack) — correct signature.
      this.logger.error(
        `Unhandled exception in game engine — path=${request.url} method=${request.method}: ${errMessage}`,
        errStack,
      );

      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = isProduction ? 'An unexpected error occurred' : errMessage;
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
