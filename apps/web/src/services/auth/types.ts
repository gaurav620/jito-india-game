/**
 * Authentication Service Contracts & Type Definitions
 *
 * Designed to separate UI forms from the underlying backend authentication implementation.
 * When the backend API is ready, developers can implement the network requests
 * adhering to these interfaces without touching the UI components.
 */

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

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

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  balance?: number;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  error?: string;
  user?: AuthUser;
}

export type AuthStatus = 'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR';
