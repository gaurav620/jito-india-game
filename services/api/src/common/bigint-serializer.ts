/**
 * BigInt serialization boundary for the JITO API service.
 *
 * CONTEXT (Phase 2A review Fix #9):
 * ─────────────────────────────────
 * All ledger values are BIGINT centipoints (ADR-014). PostgreSQL returns them
 * as JS `bigint` via Prisma. The standard `JSON.stringify()` throws:
 *   TypeError: Do not know how to serialize a BigInt
 * if a BigInt reaches the JSON serializer.
 *
 * This module is the SINGLE documented serialization boundary. Before any
 * response body exits this service:
 *   1. DTOs (Phase 2B): use `centipointsToNumber()` or `fromCentipoints()`
 *      from `@jito/shared` to convert BigInt fields to `number` or `string`.
 *   2. Where a raw object must be serialized ad-hoc (e.g. error responses
 *      that accidentally include BigInt context): use `safeJsonStringify()`.
 *
 * RULES:
 *   ✅ Convert BigInt → number via `centipointsToNumber()` in DTOs only.
 *   ✅ Convert BigInt → string via `fromCentipoints()` for display values.
 *   ❌ Never use `BigInt.prototype.toJSON` monkey-patch (global side-effect).
 *   ❌ Never pass raw Prisma model objects to `res.json()`.
 *   ❌ Never use Number(bigint) for ledger arithmetic (only for output).
 *
 * When Phase 2B introduces DTOs, each DTO is responsible for converting
 * bigint fields before the class-transformer serializes the response.
 * The `safeJsonStringify()` below is a fallback for developer ergonomics only.
 */

/**
 * Serialize a value to JSON, converting BigInt to string.
 *
 * This is a FALLBACK for edge cases (e.g., diagnostic endpoints, debug output).
 * Production response paths MUST use DTO field converters instead so the
 * output format is explicit and typed.
 *
 * BigInt is converted to `"<number>"` (string) rather than a number literal
 * to avoid silent precision loss for values > Number.MAX_SAFE_INTEGER.
 */
export function safeJsonStringify(value: unknown, indent?: number): string {
  return JSON.stringify(
    value,
    (_key, val: unknown) => (typeof val === 'bigint' ? val.toString() : val),
    indent,
  );
}

/**
 * A JSON replacer function for use with `res.json()` when BigInt values
 * might slip through. Prefer DTO conversion over this.
 *
 * Usage: response.json(JSON.parse(safeJsonStringify(body)))
 */
export function bigIntReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}
