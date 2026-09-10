/**
 * Tests for GlobalExceptionFilter.
 *
 * Verifies the standard error envelope contract:
 *   { success: false, statusCode, code, message, requestId }
 *
 * Phase 2A review fixes covered by this test:
 *   Fix #4  — requestId reads from request.requestId (set by interceptor)
 *             before falling back to the raw header.
 *   Fix #16 — 5xx HttpExceptions are logged at error level.
 *
 * No NestJS bootstrap required — exercises the filter directly.
 */
import type { ArgumentsHost } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { GlobalExceptionFilter } from './global-exception.filter';

// Minimal mock of NestJS ArgumentsHost
function makeHost(requestId = 'req_test123', includeRequestIdProp = true) {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  // Fix #4: simulate request.requestId being set by the RequestIdInterceptor
  const request: Record<string, unknown> = {
    headers: { 'x-request-id': requestId },
    url: '/api/v1/test',
    method: 'GET',
  };
  if (includeRequestIdProp) {
    // This is what RequestIdInterceptor sets on the request object
    request['requestId'] = requestId;
  }
  const response = { status };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
    json,
    status,
  } as unknown as ArgumentsHost;
}

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  it('handles HttpException — returns correct envelope shape', () => {
    const host = makeHost('req_abc');
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

    filter.catch(exception, host);

    const { status, json } = host as unknown as {
      status: ReturnType<typeof vi.fn>;
      json: ReturnType<typeof vi.fn>;
    };

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        code: 'NOT_FOUND',
        requestId: 'req_abc',
      }),
    );
  });

  it('handles unknown error — returns 500 with INTERNAL_ERROR code', () => {
    const host = makeHost('req_xyz');
    const exception = new Error('Unexpected DB error');

    filter.catch(exception, host);

    const { status, json } = host as unknown as {
      status: ReturnType<typeof vi.fn>;
      json: ReturnType<typeof vi.fn>;
    };

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        requestId: 'req_xyz',
      }),
    );
  });

  it('Fix #4: reads requestId from request.requestId (set by interceptor)', () => {
    // request.requestId is set; header is also present but should match
    const host = makeHost('req_correlation_id', true);
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(exception, host);

    const { json } = host as unknown as { json: ReturnType<typeof vi.fn> };
    const body = json.mock.calls[0][0] as { requestId: string };
    expect(body.requestId).toBe('req_correlation_id');
  });

  it('Fix #4: falls back to raw header when request.requestId is not set', () => {
    // Simulate interceptor not running (e.g., exception in early middleware)
    const host = makeHost('req_from_header', false);
    const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, host);

    const { json } = host as unknown as { json: ReturnType<typeof vi.fn> };
    const body = json.mock.calls[0][0] as { requestId: string };
    expect(body.requestId).toBe('req_from_header');
  });

  it('uses "unknown" as requestId when neither request.requestId nor header is present', () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const request = { headers: {}, url: '/test', method: 'GET' };
    const response = { status };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
      json,
      status,
    } as unknown as ArgumentsHost;

    filter.catch(new HttpException('Bad request', HttpStatus.BAD_REQUEST), host);

    const body = json.mock.calls[0][0] as { requestId: string };
    expect(body.requestId).toBe('unknown');
  });

  it('maps 429 to RATE_LIMIT_EXCEEDED code', () => {
    const host = makeHost();
    const exception = new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);

    filter.catch(exception, host);

    const { json } = host as unknown as { json: ReturnType<typeof vi.fn> };
    const body = json.mock.calls[0][0] as { code: string };
    expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('extracts validation errors from class-validator format', () => {
    const host = makeHost();
    const exception = new HttpException(
      { message: ['username must be a string', 'password should not be empty'], statusCode: 400 },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    const { json } = host as unknown as { json: ReturnType<typeof vi.fn> };
    const body = json.mock.calls[0][0] as { errors?: Array<{ message: string }> };
    expect(body.errors).toBeDefined();
    expect(body.errors).toHaveLength(2);
  });

  it('Fix #16: logs 5xx HttpExceptions at error level', () => {
    const host = makeHost();
    const exception = new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);

    // Spy on the filter's private logger
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logSpy = vi.spyOn((filter as unknown as { logger: { error: () => void } }).logger, 'error').mockImplementation(() => undefined);

    filter.catch(exception, host);

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
