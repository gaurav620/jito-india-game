/**
 * Global HTTP exception filter.
 *
 * Transforms all exceptions into the standard JITO error envelope:
 *   { success: false, statusCode, code, message, errors?, requestId }
 *
 * Ensures:
 *   - No stack traces, internal IDs, or database details leak in responses
 *   - Machine-readable `code` field for client branching (docs/API_V2.md §1)
 *   - Every response carries the X-Request-Id correlation header
 *   - Unknown errors become 500 with a generic message in production
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

export interface ErrorEnvelope {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
  requestId: string;
}

/** Extract validation errors from NestJS class-validator pipe */
function extractValidationErrors(
  response: unknown,
): Array<{ field?: string; message: string }> | undefined {
  if (
    typeof response === 'object' &&
    response !== null &&
    'message' in response &&
    Array.isArray((response as { message: unknown }).message)
  ) {
    const msgs = (response as { message: string[] }).message;
    return msgs.map((m) => ({ message: m }));
  }
  return undefined;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const requestId = (request.headers['x-request-id'] as string | undefined) ?? 'unknown';
    const isProduction = process.env['NODE_ENV'] === 'production';

    let statusCode: number;
    let code: string;
    let message: string;
    let errors: Array<{ field?: string; message: string }> | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const httpResponse = exception.getResponse();

      // Extract code from custom HttpException or derive from status
      if (typeof httpResponse === 'object' && httpResponse !== null) {
        const r = httpResponse as Record<string, unknown>;
        code = (r['code'] as string | undefined) ?? httpStatusToCode(statusCode);
        message = (r['message'] as string | undefined) ?? exception.message;
        errors = extractValidationErrors(httpResponse);
      } else {
        code = httpStatusToCode(statusCode);
        message = typeof httpResponse === 'string' ? httpResponse : exception.message;
      }
    } else {
      // Unexpected error — log with full detail, return generic response
      this.logger.error(
        { err: exception, requestId, path: request.url, method: request.method },
        'Unhandled exception',
      );
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_ERROR';
      message = isProduction
        ? 'An unexpected error occurred'
        : (exception instanceof Error ? exception.message : String(exception));
    }

    const body: ErrorEnvelope = {
      success: false,
      statusCode,
      code,
      message,
      ...(errors !== undefined && errors.length > 0 ? { errors } : {}),
      requestId,
    };

    response.status(statusCode).json(body);
  }
}

function httpStatusToCode(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_ERROR',
  };
  return map[status] ?? 'HTTP_ERROR';
}
