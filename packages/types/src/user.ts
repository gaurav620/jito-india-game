/**
 * User-related types for JITO INDIA GAMES.
 */

/** User account status */
export enum UserStatus {
  Active = 'active',
  Suspended = 'suspended',
  Banned = 'banned',
}

/** User role */
export enum UserRole {
  User = 'user',
  Admin = 'admin',
}

/** Core user entity */
export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  displayName?: string;
  status: UserStatus;
  role: UserRole;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** User profile (public-safe subset) */
export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  createdAt: string;
}

/** Login request payload */
export interface LoginRequest {
  username: string;
  password: string;
}

/** Login response payload */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

/** Registration request payload */
export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  displayName?: string;
}
