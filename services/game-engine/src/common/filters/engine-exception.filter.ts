/**
 * Global HTTP exception filter for the game engine service.
 * Identical in contract to the API service filter — standard error envelope.
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
    } else {
      this.logger.error(
        { err: exception, path: request.url, method: request.method },
        'Unhandled exception in game engine',
      );
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = isProduction
        ? 'An unexpected error occurred'
        : (exception instanceof Error ? exception.message : String(exception));
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
