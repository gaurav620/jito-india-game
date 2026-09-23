import type { ChangePasswordData, AuthResult } from './types';

/**
 * Change Password Service Integration Point
 *
 * Backend Status: PENDING IMPLEMENTATION
 * This function defines the contract for updating a user's password.
 *
 * Reference Project (`pr-project-2-main`) API Specification:
 * - Method & Endpoint: POST /me/password
 * - Payload: { current: string, next: string }
 * - Authorization: Bearer <sessionToken>
 * - Success Response: 204 No Content
 * - Error Responses:
 *   - 400 'Passwords do not match' (Client validation)
 *   - 400 'Password must be at least 6 characters' (Validation rule)
 *   - 400 'Check Current password!' (Invalid existing password)
 *   - 401 'Unauthorized' (Session expired or missing)
 *
 * Once the NestJS / REST / WebSocket backend endpoint is available,
 * replace the placeholder logic below with the actual HTTP request:
 *
 * ```ts
 * const res = await fetch('/api/me/password', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${token}`,
 *   },
 *   body: JSON.stringify({
 *     current: data.currentPassword,
 *     next: data.newPassword,
 *   }),
 * });
 * if (!res.ok) {
 *   const errorData = await res.json();
 *   return { success: false, error: errorData.message || 'Unable to change password.' };
 * }
 * return { success: true, message: 'Password changed successfully.' };
 * ```
 */
export async function changePassword(data: ChangePasswordData): Promise<AuthResult> {
  const currentPassword = data.currentPassword;
  const newPassword = data.newPassword;
  const confirmPassword = data.confirmPassword;

  // Frontend client validations matching reference game rules
  if (!currentPassword) {
    return {
      success: false,
      error: 'Please enter your current password.',
    };
  }

  if (!newPassword) {
    return {
      success: false,
      error: 'Please enter a new password.',
    };
  }

  if (newPassword.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters.',
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      success: false,
      error: 'Passwords do not match.',
    };
  }

  // Simulate network dispatch delay for realistic UI state testing
  await new Promise((resolve) => setTimeout(resolve, 350));

  // Notice: The backend service is currently not implemented.
  // We do not simulate fake success or fake authentication.
  return {
    success: false,
    error: 'Change password backend is not connected yet. Please implement the API service.',
  };
}
