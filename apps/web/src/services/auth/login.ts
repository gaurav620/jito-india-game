import { loginWithPassword } from './session';
import type { AuthResult, LoginCredentials } from './types';

import { ApiError } from '@/services/api';

/**
 * Login — `POST /api/v1/auth/login` (Phase 2B backend).
 *
 * Request body is exactly the backend `LoginDto` ({ username, password }).
 * `rememberMe` is UI-only and is NOT sent (the backend rejects unknown fields).
 *
 * The backend deliberately returns one generic 401 for unknown user, wrong
 * password, and locked/inactive accounts (no account enumeration); this maps
 * it to a single user-safe message rather than echoing backend text.
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResult> {
  const username = credentials.username.trim();
  const password = credentials.password;

  if (!username || !password) {
    return { success: false, error: 'Please enter both username and password.' };
  }

  try {
    const session = await loginWithPassword(username, password);
    return { success: true, message: 'Login successful.', session };
  } catch (err) {
    return { success: false, error: describeLoginFailure(err) };
  }
}

function describeLoginFailure(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) return 'Invalid username or password.';
    if (err.status === 429) return 'Too many login attempts. Please try again later.';
    if (err.status === 0) return 'Unable to reach the server. Please check your connection.';
    if (err.status === 400) return 'Please check your username and password.';
    return 'Login is temporarily unavailable. Please try again.';
  }
  return 'Login is temporarily unavailable. Please try again.';
}
