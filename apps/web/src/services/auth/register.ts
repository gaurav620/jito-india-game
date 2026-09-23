import type { AuthResult, RegisterData } from './types';

/**
 * Registration — DELIBERATELY NOT CONNECTED to the backend.
 *
 * The current registration UI and the existing backend contract are
 * incompatible, and resolving that is a business decision (not made here):
 *
 *   UI collects:               username, gender, dateOfBirth, email
 *                              ("Password will be sent to this mail")
 *   POST /api/v1/auth/register username, password (min 8), email OR phone,
 *   (backend RegisterDto):     optional displayName — and the global
 *                              ValidationPipe REJECTS unknown fields
 *                              (`gender`, `dateOfBirth` → 400).
 *
 * Conflicts: (1) the UI has no password field, the backend requires one;
 * (2) the UI promises an emailed password — no email/SMTP/SES capability
 * exists and inventing generated passwords is not approved; (3) `gender` and
 * `dateOfBirth` have no DB columns; (4) the 18+ check is client-side only.
 * See MEMORY.md (2026-09-24 frontend/backend integration entry) for the exact
 * decision required.
 *
 * Until then this validates the form for UX and returns a user-safe message
 * WITHOUT sending any request — no incompatible payload reaches the backend.
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

  return {
    success: false,
    error: 'Online registration is not available yet. Please try again later.',
  };
}
