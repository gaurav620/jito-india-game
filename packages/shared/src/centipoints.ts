/**
 * Centipoints conversion helpers for JITO INDIA GAMES.
 *
 * All monetary values in the Phase 2 database and API use BIGINT centipoints
 * (1 display point = 100 centipoints). This is the ONE authorised conversion
 * point in the codebase — no other code may perform points ↔ centipoints
 * arithmetic (ADR-014).
 *
 * RATIONALE FOR BIGINT OVER DECIMAL:
 * The node-postgres driver maps PostgreSQL NUMERIC/DECIMAL columns to JS
 * strings rather than numbers, and JavaScript's IEEE-754 number loses
 * precision for amounts > 2^53. Using BIGINT columns and bigint in
 * application code makes precision loss structurally impossible.
 *
 * RATIONALE FOR INTEGER CENTIPOINTS:
 * Floating-point arithmetic on monetary values (e.g. 0.1 + 0.2 ≠ 0.3)
 * is a well-documented source of ledger errors. Integer centipoints make
 * every ledger operation exact.
 *
 * NEVER expose display-format conversion in payment / settlement paths.
 * Conversion is ONLY needed at the API boundary (HTTP responses, admin UI).
 *
 * Phase 2A review fix (2026-09-10):
 *   Fix #13 — String parsing now avoids parseFloat/IEEE-754. Instead of
 *   parseFloat('10.57') → 1056.9999... → 1056 (wrong), we split on '.' and
 *   construct the bigint directly from the integer and fractional parts.
 *   This is exact for all valid decimal strings regardless of IEEE-754 limits.
 */

/** Multiplier: 1 display point = 100 centipoints */
const CENTIPOINTS_PER_POINT = 100n;

/**
 * Convert a display-format amount to BIGINT centipoints.
 *
 * Accepts:
 *   - A bigint (returned as-is — caller already has centipoints)
 *   - A number (integer or decimal, e.g. 10 or 10.50)
 *   - A string parseable as a decimal (e.g. "10.50", "10", "0.01")
 *
 * Throws a RangeError for negative values (centipoints are always ≥ 0).
 * Throws a TypeError for non-parseable strings or NaN values.
 * Truncates to 2 decimal places (rounds toward zero — conservative for debits).
 *
 * @example
 *   toCentipoints(10)        // 1000n
 *   toCentipoints("10.50")   // 1050n
 *   toCentipoints("0.01")    //    1n
 *   toCentipoints(0)         //    0n
 *   toCentipoints("10.57")   // 1057n  (exact — no IEEE-754 path)
 *   toCentipoints("10.999")  // 1099n  (truncated toward zero)
 */
export function toCentipoints(value: number | string | bigint): bigint {
  if (typeof value === 'bigint') {
    if (value < 0n) {
      throw new RangeError(`toCentipoints: centipoints must be >= 0, got ${value}`);
    }
    return value;
  }

  if (typeof value === 'number') {
    if (!isFinite(value)) {
      throw new TypeError(`toCentipoints: non-finite value "${value}"`);
    }
    if (value < 0) {
      throw new RangeError(`toCentipoints: value must be >= 0, got ${value}`);
    }
    // For numbers, use the string-parsing path to avoid IEEE-754 rounding.
    // Convert to a fixed-point string with enough precision, then parse.
    return parseDecimalString(value.toFixed(10));
  }

  // String path — Fix #13: parse without parseFloat to avoid IEEE-754.
  const str = (value as string).trim();
  if (!/^(\d+)(\.\d+)?$/.test(str)) {
    throw new TypeError(`toCentipoints: invalid decimal string "${value}"`);
  }
  return parseDecimalString(str);
}

/**
 * Parse a non-negative decimal string to centipoints without going through
 * IEEE-754 floating point.
 *
 * Algorithm:
 *   "10.57"  → integer="10", frac="57" → 10*100 + 57 = 1057n
 *   "10.5"   → integer="10", frac="50" → 10*100 + 50 = 1050n
 *   "10.999" → integer="10", frac="99" (truncate) → 10*100 + 99 = 1099n
 *   "10"     → integer="10", frac="00" → 10*100 + 00 = 1000n
 */
function parseDecimalString(str: string): bigint {
  const dotIndex = str.indexOf('.');
  let intPart: string;
  let fracPart: string;

  if (dotIndex === -1) {
    intPart = str;
    fracPart = '00';
  } else {
    intPart = str.slice(0, dotIndex);
    // Take only the first 2 fractional digits (truncate, not round)
    const rawFrac = str.slice(dotIndex + 1);
    fracPart = rawFrac.slice(0, 2).padEnd(2, '0');
  }

  // Remove leading zeros to avoid BigInt('08') octal ambiguity
  const intVal = intPart === '' ? 0n : BigInt(intPart.replace(/^0+/, '') || '0');
  const fracVal = BigInt(fracPart);

  return intVal * 100n + fracVal;
}

/**
 * Convert BIGINT centipoints to a display-format string (2 decimal places).
 *
 * Throws a RangeError for negative values.
 *
 * @example
 *   fromCentipoints(1000n)   // "10.00"
 *   fromCentipoints(1050n)   //  "10.50"
 *   fromCentipoints(1n)      //   "0.01"
 *   fromCentipoints(0n)      //   "0.00"
 */
export function fromCentipoints(minor: bigint): string {
  if (minor < 0n) {
    throw new RangeError(`fromCentipoints: centipoints must be >= 0, got ${minor}`);
  }
  const integerPoints = minor / CENTIPOINTS_PER_POINT;
  const remainingCentipoints = minor % CENTIPOINTS_PER_POINT;
  return `${integerPoints}.${String(remainingCentipoints).padStart(2, '0')}`;
}

/**
 * Convert BIGINT centipoints to a JS number for JSON serialisation.
 *
 * USE WITH CARE: JS numbers lose precision above 2^53 (≈ 9 × 10^15
 * centipoints = 90 trillion display points). This is acceptable for
 * WebSocket payloads and HTTP responses where amounts are in practice
 * far below that ceiling, but never use this for ledger arithmetic.
 *
 * Returns null for null input (convenient for optional balance fields).
 */
export function centipointsToNumber(minor: bigint): number;
export function centipointsToNumber(minor: bigint | null): number | null;
export function centipointsToNumber(minor: bigint | null): number | null {
  if (minor === null) return null;
  return Number(minor);
}

/**
 * Sum an array of centipoint values safely.
 * Returns 0n for an empty array.
 */
export function sumCentipoints(values: readonly bigint[]): bigint {
  return values.reduce((acc, v) => acc + v, 0n);
}
