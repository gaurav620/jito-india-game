/**
 * Frontend auth session — thin client over the EXISTING Phase 2B backend
 * (`POST /auth/login|refresh|logout`, `GET /auth/me`). It does not implement
 * a second auth system.
 *
 * Token handling:
 *  - The access token lives ONLY in module memory (never localStorage /
 *    sessionStorage), so XSS cannot exfiltrate a long-lived credential and a
 *    full page reload simply re-derives it via the refresh cookie.
 *  - The refresh token is the backend's httpOnly cookie (`jito_refresh`).
 *    The `refreshToken` field in the login/refresh body is deliberately
 *    ignored by the web client (the body path is the backend's fallback for
 *    desktop/mobile shells without a cookie jar and is untouched).
 *
 * Refresh de-duplication is mandatory, not an optimisation: the backend rotates
 * the refresh token on every use and treats a replayed token as theft
 * (revokes the whole chain — ADR-027). Two concurrent refreshes from one tab
 * (e.g. React StrictMode double-invoking an effect) would log the user out.
 */
import type {
  AuthSession,
  LoginResponse,
  MeResponse,
  RefreshResponse,
} from './types';

import { ApiError, apiRequest } from '@/services/api';

let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
let restoreInFlight: Promise<AuthSession | null> | null = null;

export function hasAccessToken(): boolean {
  return accessToken !== null;
}

/** Drop all in-memory auth state. */
export function clearSession(): void {
  accessToken = null;
}

/** `POST /auth/login`. Throws `ApiError` on failure. */
export async function loginWithPassword(username: string, password: string): Promise<AuthSession> {
  const res = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  accessToken = res.accessToken;
  return { user: res.user, balanceMinor: res.balanceMinor };
}

/**
 * `POST /auth/refresh` using the httpOnly cookie. Resolves `true` when a new
 * access token was obtained, `false` when there is no valid session (401).
 * Any other failure (network, 5xx, 429) is rethrown — it is not proof the
 * user is logged out.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await apiRequest<RefreshResponse>('/auth/refresh', { method: 'POST', body: {} });
        accessToken = res.accessToken;
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          accessToken = null;
          return false;
        }
        throw err;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Authenticated request: obtains a token if missing and retries once after a 401. */
async function authedRequest<T>(path: string, method: 'GET' | 'POST'): Promise<T | null> {
  if (!accessToken && !(await refreshAccessToken())) {
    return null;
  }
  try {
    return await apiRequest<T>(path, { method, accessToken });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      accessToken = null;
      if (!(await refreshAccessToken())) return null;
      return apiRequest<T>(path, { method, accessToken });
    }
    throw err;
  }
}

/** `GET /auth/me` — the real authenticated user, or `null` when not signed in. */
export async function fetchCurrentSession(): Promise<AuthSession | null> {
  const res = await authedRequest<MeResponse>('/auth/me', 'GET');
  return res ? { user: res.user, balanceMinor: res.balanceMinor } : null;
}

/** Shared, in-flight-deduplicated session restore (safe to call from effects). */
export function restoreSession(): Promise<AuthSession | null> {
  if (!restoreInFlight) {
    restoreInFlight = fetchCurrentSession().finally(() => {
      restoreInFlight = null;
    });
  }
  return restoreInFlight;
}

/**
 * `POST /auth/logout` — revokes the server session and clears the refresh
 * cookie. Local state is ALWAYS cleared, even if the server call fails, so the
 * UI never keeps an authenticated view after the user asked to leave.
 */
export async function logoutSession(): Promise<void> {
  try {
    await authedRequest<{ success: true }>('/auth/logout', 'POST');
  } catch {
    // Server unreachable / already invalid: nothing further to revoke from here.
  } finally {
    clearSession();
  }
}

/** Centipoints string → display points number (e.g. "6470700" → 64707). */
export function balanceMinorToPoints(balanceMinor: string): number {
  const minor = BigInt(balanceMinor);
  return Number(minor / 100n) + Number(minor % 100n) / 100;
}
