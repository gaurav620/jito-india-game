export {
  isValidUUID,
  isPositiveNumber,
  isNonNegativeNumber,
  isNonEmptyString,
  isValidEmail,
  isIntegerInRange,
} from './validation';

export {
  formatAmount,
  formatCountdown,
  formatDateTime,
  truncate,
  formatRoundNumber,
} from './formatting';

/**
 * Centipoints conversion helpers (ADR-014).
 * 1 display point = 100 centipoints (BIGINT).
 * These are the ONE authorised conversion points in the codebase.
 */
export {
  toCentipoints,
  fromCentipoints,
  centipointsToNumber,
  sumCentipoints,
} from './centipoints';

/**
 * BigInt serialization utilities (Phase 2A, Improvement B).
 * Use safeJsonStringify() for Redis publish payloads and diagnostic paths.
 * Use bigIntReplacer() with JSON.stringify() where a replacer is needed.
 * Prefer DTO field converters (centipointsToNumber / fromCentipoints) for
 * HTTP response paths in Phase 2B.
 */
export { safeJsonStringify, bigIntReplacer } from './bigint-serializer';
