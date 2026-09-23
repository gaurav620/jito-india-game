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
 *
 * Phase 2A review fixes (2026-09-10):
 *   Fix #4  — Request ID read from request.requestId (set by RequestIdInterceptor)
 *             before falling back to the raw header, preventing ID mismatch.
 *   Fix #8  — Actual error message + stack preserved in logger call.
 *   Fix #11 — NestJS Logger signature: error(message, stack, context).
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

    // Fix #4: Read from request.requestId (set by RequestIdInterceptor) first.
    // Fall back to raw header, then 'unknown' if neither is present.
    // This ensures the requestId in the body matches the X-Request-Id header.
    const requestId =
      (request as Request & { requestId?: string }).requestId ??
      (request.headers['x-request-id'] as string | undefined) ??
      'unknown';

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

      // Fix #16: Log 5xx HttpExceptions at error level (not just unknown errors).
      if (statusCode >= 500) {
        // Fix #11: NestJS Logger.error(message, stack, context) — not pino signature.
        this.logger.error(
          `HttpException 5xx [${statusCode}] ${message} — requestId=${requestId} path=${request.url}`,
          exception.stack,
        );
      }
    } else {
      // Unexpected error — log with full detail, return generic response.
      // Fix #8: Preserve the actual error message and stack.
      const errMessage = exception instanceof Error ? exception.message : String(exception);
      const errStack = exception instanceof Error ? exception.stack : undefined;

      // Fix #11: NestJS Logger.error(message, stack) — correct signature.
      this.logger.error(
        `Unhandled exception — requestId=${requestId} path=${request.url} method=${request.method}: ${errMessage}`,
        errStack,
      );

      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_ERROR';
      message = isProduction ? 'An unexpected error occurred' : errMessage;
    }

    const body: ErrorEnvelope = {
      success: false,
      statusCode,
      code,
      message,
      ...(errors !== undefined && errors.length > 0 ? { errors } : {}),
      requestId,
    };

    // Retry-After for 429 (docs/API_V2.md §11). Services attach `retryAfter`
    // (seconds) to the exception payload; it is surfaced as the header here so
    // rate-limit logic never needs access to the Response object.
    if (statusCode === HttpStatus.TOO_MANY_REQUESTS && exception instanceof HttpException) {
      const payload = exception.getResponse();
      if (typeof payload === 'object' && payload !== null) {
        const retryAfter = (payload as Record<string, unknown>)['retryAfter'];
        if (typeof retryAfter === 'number' && Number.isFinite(retryAfter)) {
          response.setHeader('Retry-After', String(Math.ceil(retryAfter)));
        }
      }
    }

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
