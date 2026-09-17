import type { RegisterData, AuthResult } from './types';

/**
 * Registration Service Integration Point
 *
 * Backend Status: PENDING IMPLEMENTATION
 * This function defines the contract for registering a new player account.
 *
 * Once the NestJS / REST / WebSocket backend endpoint is available,
 * replace the placeholder logic below with the actual HTTP request:
 *
 * ```ts
 * const res = await fetch('/api/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(data),
 * });
 * return await res.json();
 * ```
 */
export async function registerUser(data: RegisterData): Promise<AuthResult> {
  const username = data.username.trim();
  const email = data.email.trim();

  if (!username) {
    return { success: false, error: 'Please enter a username.' };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  if (!data.dateOfBirth) {
    return { success: false, error: 'Please enter your date of birth.' };
  }

  // Simulate network dispatch delay for realistic UI state testing
  await new Promise((resolve) => setTimeout(resolve, 350));

  // Notice: The backend service is currently not implemented.
  return {
    success: false,
    error: 'Registration backend is not connected yet. Please implement the API service.',
  };
}
