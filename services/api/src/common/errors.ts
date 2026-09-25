/**
 * Typed machine-readable error codes for the JITO API service.
 *
 * All error responses from the GlobalExceptionFilter use these codes in the
 * `code` field of the standard envelope:
 *   { success: false, statusCode, code, message, requestId }
 *
 * Rules:
 *   - Codes are stable strings — clients branch on them.
 *   - Do NOT add payment/withdrawal/cashout error codes (ADR-011).
 *   - Generic codes (UNAUTHORIZED, CONFLICT) are intentionally coarse —
 *     detailed sub-codes would enable account enumeration.
 */
export const AppErrorCode = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_BANNED: 'ACCOUNT_BANNED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  REFRESH_TOKEN_REUSED: 'REFRESH_TOKEN_REUSED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  // Registration
  CONFLICT: 'CONFLICT',
  // Points ledger (docs/API_V2.md §8.2, docs/POINTS_SYSTEM.md §4.3, §9)
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  IDEMPOTENCY_KEY_REUSED: 'IDEMPOTENCY_KEY_REUSED',
  // Bet placement (docs/API_V2.md §6 — the full documented error-code list for
  // POST /bets). LIMIT_EXCEEDED is declared here because it is part of that
  // documented contract, but NOTHING in this codebase throws it yet — no
  // confirmed min/max bet limit exists (docs/CLIENT_REQUIREMENTS.md item 9).
  // Do not wire it to any rule until the client confirms one.
  ROUND_NOT_ACCEPTING: 'ROUND_NOT_ACCEPTING',
  ROUND_MISMATCH: 'ROUND_MISMATCH',
  DEADLINE_PASSED: 'DEADLINE_PASSED',
  INVALID_SELECTION: 'INVALID_SELECTION',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  // General
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode];
