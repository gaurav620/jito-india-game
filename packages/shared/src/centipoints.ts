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
 */

/** Multiplier: 1 display point = 100 centipoints */
const CENTIPOINTS_PER_POINT = 100n;

/**
 * Convert a display-format amount to BIGINT centipoints.
 *
 * Accepts:
 *   - A number (integer or decimal, e.g. 10 or 10.50)
 *   - A string parseable as a decimal (e.g. "10.50", "10", "0.01")
 *   - A bigint (returned as-is — caller already has centipoints)
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
 */
export function toCentipoints(value: number | string | bigint): bigint {
  if (typeof value === 'bigint') {
    if (value < 0n) {
      throw new RangeError(`toCentipoints: centipoints must be >= 0, got ${value}`);
    }
    return value;
  }

  let numeric: number;
  if (typeof value === 'number') {
    numeric = value;
  } else {
    numeric = parseFloat(value as string);
  }

  if (!isFinite(numeric)) {
    throw new TypeError(`toCentipoints: non-finite value "${value}"`);
  }
  if (numeric < 0) {
    throw new RangeError(`toCentipoints: value must be >= 0, got ${numeric}`);
  }

  // Truncate toward zero (conservative — never rounds up on a debit).
  // Math.trunc(x * 100) works for values representable in IEEE-754 doubles.
  // Multiplication by 100 can introduce floating-point error (e.g., 10.57 * 100 = 1056.9999...),
  // so we add a tiny epsilon before truncating to handle those cases while
  // still preserving the conservative truncation contract for values like 10.999.
  const EPSILON = 1e-9;
  return BigInt(Math.trunc(numeric * 100 + EPSILON));
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
