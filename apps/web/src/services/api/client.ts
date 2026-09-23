/**
 * Single typed HTTP client for the JITO backend (`services/api`).
 *
 * Every frontend call to the backend goes through `apiRequest` — no other file
 * should call `fetch` against the API directly.
 *
 * Base URL: `NEXT_PUBLIC_API_BASE_URL` (public backend URL only — never put a
 * secret in a NEXT_PUBLIC variable). In development it falls back to the local
 * API (`http://localhost:3001/api/v1`); a production build with the variable
 * unset fails loudly at request time instead of silently calling localhost.
 *
 * `credentials: 'include'` is always sent so the httpOnly refresh-token cookie
 * (`jito_refresh`, path `/api/v1/auth`) travels with auth requests. The backend
 * decides which origins may do this (CORS_ORIGINS); production CORS is not
 * relaxed by the frontend.
 *
 * Error contract: the backend's standard envelope
 * `{ success:false, statusCode, code, message, errors?, requestId }`
 * (services/api GlobalExceptionFilter) is surfaced as `ApiError`.
 */

const DEV_DEFAULT_API_BASE_URL = 'http://localhost:3001/api/v1';

export type ApiErrorCode = string;

export class ApiError extends Error {
  /** HTTP status, or 0 when the request never reached the server. */
  readonly status: number;
  /** Backend machine-readable code (e.g. `UNAUTHORIZED`), or `NETWORK_ERROR` / `CONFIG_ERROR`. */
  readonly code: ApiErrorCode;
  readonly requestId?: string;

  constructor(status: number, code: ApiErrorCode, message: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  if (process.env.NODE_ENV !== 'production') {
    return DEV_DEFAULT_API_BASE_URL;
  }
  throw new ApiError(0, 'CONFIG_ERROR', 'NEXT_PUBLIC_API_BASE_URL is not configured for this build.');
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Sent as `Authorization: Bearer <token>` when provided. */
  accessToken?: string | null;
}

interface ErrorEnvelope {
  code?: unknown;
  message?: unknown;
  requestId?: unknown;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.accessToken) headers['Authorization'] = `Bearer ${options.accessToken}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      credentials: 'include',
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server.');
  }

  const payload = await readJson(response);

  if (!response.ok) {
    const envelope = (typeof payload === 'object' && payload !== null ? payload : {}) as ErrorEnvelope;
    throw new ApiError(
      response.status,
      typeof envelope.code === 'string' ? envelope.code : `HTTP_${response.status}`,
      typeof envelope.message === 'string' ? envelope.message : response.statusText,
      typeof envelope.requestId === 'string' ? envelope.requestId : undefined,
    );
  }

  return payload as T;
}
