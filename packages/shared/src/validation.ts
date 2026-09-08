/**
 * Validation utilities for JITO INDIA GAMES.
 */

/**
 * Check if a string is a valid UUID v4.
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Check if a value is a positive number.
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Check if a value is a non-negative number (zero or positive).
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Check if a string is non-empty after trimming.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate an email address format.
 */
export function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Check if a value is a valid integer within a range.
 */
export function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
