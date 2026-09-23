import type { LoginCredentials, AuthResult } from './types';

/**
 * Login Service Integration Point
 *
 * Backend Status: PENDING IMPLEMENTATION
 * This function defines the contract for authenticating a user.
 *
 * Once the NestJS / REST / WebSocket backend endpoint is available,
 * replace the placeholder logic below with the actual HTTP request:
 *
 * ```ts
 * const res = await fetch('/api/auth/login', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(credentials),
 * });
 * return await res.json();
 * ```
 *
 * ─── Demo Users (remove when backend is connected) ────────────────────────────
 * Username : demo       Password: demo123
 * Username : admin      Password: admin123
 */

/** Hardcoded demo credentials used until the real backend is implemented. */
const DEMO_USERS: Record<string, { password: string; id: string; balance: number }> = {
  demo: { password: 'demo123', id: 'usr_demo_001', balance: 62933.0 },
  admin: { password: 'admin123', id: 'usr_admin_001', balance: 100000.0 },
};

export async function loginUser(credentials: LoginCredentials): Promise<AuthResult> {
  const username = credentials.username.trim().toLowerCase();
  const password = credentials.password;

  if (!username || !password) {
    return {
      success: false,
      error: 'Please enter both username and password.',
    };
  }

  // Simulate network dispatch delay for realistic UI state testing
  await new Promise((resolve) => setTimeout(resolve, 350));

  // ── Demo authentication (active while backend is pending) ──────────────────
  const demoUser = DEMO_USERS[username];
  if (demoUser && demoUser.password === password) {
    return {
      success: true,
      message: 'Login successful.',
      user: {
        id: demoUser.id,
        username: credentials.username.trim(),
        balance: demoUser.balance,
      },
    };
  }

  // ── Backend not yet connected — reject all non-demo credentials ────────────
  return {
    success: false,
    error: 'Invalid username or password.',
  };
}
