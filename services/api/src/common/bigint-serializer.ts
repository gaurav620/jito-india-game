/**
 * BigInt serialization boundary for the JITO API service.
 *
 * CONTEXT (Phase 2A review Fix #9, Improvement B):
 * ─────────────────────────────────────────────────
 * The canonical implementation has been moved to `@jito/shared`
 * (packages/shared/src/bigint-serializer.ts). This file retains the
 * standalone implementation for the API service so it works without
 * requiring the shared package to be compiled first.
 *
 * In Phase 2B, import directly from '@jito/shared' in new code once the
 * build pipeline ensures the shared dist is always up to date.
 *
 * All ledger values are BIGINT centipoints (ADR-014). PostgreSQL returns them
 * as JS `bigint` via Prisma. The standard `JSON.stringify()` throws:
 *   TypeError: Do not know how to serialize a BigInt
 * if a BigInt reaches the JSON serializer.
 *
 * RULES:
 *   ✅ Convert BigInt → number via `centipointsToNumber()` in DTOs only.
 *   ✅ Convert BigInt → string via `fromCentipoints()` for display values.
 *   ✅ Use `safeJsonStringify()` for Redis publish payloads with BigInt fields.
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
 * A JSON replacer function for use with `JSON.stringify()` when BigInt values
 * might slip through. Prefer DTO conversion over this.
 *
 * Usage: JSON.stringify(value, bigIntReplacer)
 */
export function bigIntReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}
