/**
 * BigInt serialization utilities — shared across API and Game Engine.
 *
 * CONTEXT (Phase 2A review Fix #9, Improvement B):
 * ─────────────────────────────────────────────────
 * All ledger values are BIGINT centipoints (ADR-014). PostgreSQL returns them
 * as JS `bigint` via Prisma. The standard `JSON.stringify()` throws:
 *   TypeError: Do not know how to serialize a BigInt
 * if a BigInt reaches the JSON serializer.
 *
 * This module is the SINGLE documented serialization boundary. Before any
 * response body exits either service:
 *   1. DTOs (Phase 2B): use `centipointsToNumber()` or `fromCentipoints()`
 *      from `@jito/shared` to convert BigInt fields to `number` or `string`.
 *   2. Where a raw object must be serialized ad-hoc (e.g. Redis publish path,
 *      diagnostic endpoints, error responses): use `safeJsonStringify()`.
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
 * The `safeJsonStringify()` below is a fallback for developer ergonomics
 * and for service-internal paths (e.g. Redis publish) where DTOs aren't used.
 */

/**
 * Serialize a value to JSON, converting BigInt to string.
 *
 * This is a FALLBACK for paths where a DTO is not available:
 *   - Redis publish payloads in the game engine
 *   - Diagnostic / debug endpoints
 *   - Error response contexts that may include BigInt
 *
 * Production HTTP response paths MUST use DTO field converters instead so the
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
 * might be present. Prefer DTO conversion over this in HTTP response paths.
 *
 * Usage with JSON.stringify:
 *   JSON.stringify(value, bigIntReplacer)
 *
 * Usage with res.json() (NestJS/Express):
 *   res.json(JSON.parse(safeJsonStringify(body)))
 */
export function bigIntReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}
