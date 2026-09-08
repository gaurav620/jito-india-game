/**
 * Formatting utilities for JITO INDIA GAMES.
 */

/**
 * Format a number as currency/points with commas.
 * Example: 12345.5 → "12,345.50"
 */
export function formatAmount(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format seconds into MM:SS display.
 * Example: 65 → "01:05"
 */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const seconds = Math.floor(Math.max(0, totalSeconds) % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Format a date as a readable string.
 * Example: "08 Sep 2026, 09:30 PM"
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Format a round number with leading zeros.
 * Example: 42 → "000042" (default 6 digits)
 */
export function formatRoundNumber(roundNumber: number, digits: number = 6): string {
  return String(roundNumber).padStart(digits, '0');
}
