/**
 * Request ID interceptor.
 *
 * Every request that arrives without an X-Request-Id header gets one generated.
 * The ID is echoed back in the response header for correlation with logs.
 *
 * All log statements in the request lifecycle should include this ID
 * so a single request can be traced across the log stream.
 */
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor} from '@nestjs/common';
import {
  Injectable
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const requestId =
      (request.headers['x-request-id'] as string | undefined) ?? `req_${uuidv4()}`;

    // Store on request so filters and services can read it
    (request as Request & { requestId: string }).requestId = requestId;
    response.setHeader('X-Request-Id', requestId);

    return next.handle();
  }
}
