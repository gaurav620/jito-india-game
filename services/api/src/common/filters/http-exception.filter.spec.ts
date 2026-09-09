/**
 * Tests for GlobalExceptionFilter.
 *
 * Verifies the standard error envelope contract:
 *   { success: false, statusCode, code, message, requestId }
 *
 * No NestJS bootstrap required — exercises the filter directly.
 */
import type { ArgumentsHost } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { GlobalExceptionFilter } from './global-exception.filter';

// Minimal mock of NestJS ArgumentsHost
function makeHost(requestId = 'req_test123') {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const request = {
    headers: { 'x-request-id': requestId },
    url: '/api/v1/test',
    method: 'GET',
  };
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

  it('always includes requestId in the envelope', () => {
    const host = makeHost('req_correlation_id');
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(exception, host);

    const { json } = host as unknown as { json: ReturnType<typeof vi.fn> };
    const body = json.mock.calls[0][0] as { requestId: string };
    expect(body.requestId).toBe('req_correlation_id');
  });

  it('uses "unknown" as requestId when X-Request-Id header is absent', () => {
    // No X-Request-Id header
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
});
