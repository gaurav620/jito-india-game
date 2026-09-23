/**
 * Authentication Service Contracts & Type Definitions
 *
 * Backend response shapes mirror `services/api/src/auth` (Phase 2B) exactly —
 * do not add fields the backend does not return.
 */

export interface LoginCredentials {
  username: string;
  password: string;
  /**
   * UI-only today: the backend has no "remember me" concept (session lifetime
   * is fixed by JWT_REFRESH_TTL), so this is intentionally NOT sent to
   * `POST /auth/login` — the backend rejects unknown fields.
   */
  rememberMe: boolean;
}

/**
 * Registration form data as COLLECTED BY THE CURRENT UI.
 *
 * WARNING — does NOT match the backend `RegisterDto` (username + password +
 * email|phone + optional displayName). `gender` and `dateOfBirth` have no
 * backend field, and the UI collects no password. See `register.ts` and the
 * 2026-09-24 entry in MEMORY.md (+ docs/CLIENT_REQUIREMENTS.md item 14);
 * registration is intentionally not connected until a business decision is made.
 */
export interface RegisterData {
  username: string;
  email: string;
  dateOfBirth: string; // ISO format 'YYYY-MM-DD'
  gender: 'MALE' | 'FEMALE';
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Backend `UserProfile` (auth.service.ts). */
export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  status: string;
  createdAt: string;
}

/** A live authenticated session view: the real user and their real balance. */
export interface AuthSession {
  user: AuthUser;
  /** Centipoints as a decimal string (backend BigInt serialization contract). */
  balanceMinor: string;
}

/** `POST /auth/login` 200 body. */
export interface LoginResponse {
  success: true;
  accessToken: string;
  /** Present in the body for desktop/mobile fallback; the web client relies on the httpOnly cookie and does not store it. */
  refreshToken?: string;
  expiresIn: number;
  user: AuthUser;
  balanceMinor: string;
}

/** `POST /auth/refresh` 200 body. */
export interface RefreshResponse {
  success: true;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

/** `GET /auth/me` 200 body. */
export interface MeResponse {
  success: true;
  user: AuthUser;
  balanceMinor: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  error?: string;
  session?: AuthSession;
}

export type AuthStatus = 'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR';
