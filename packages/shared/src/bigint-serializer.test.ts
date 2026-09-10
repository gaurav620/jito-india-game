/**
 * Tests for the shared BigInt serialization utilities.
 *
 * These utilities live in @jito/shared and are used by both the API service
 * (HTTP response paths, diagnostic endpoints) and the game engine service
 * (Redis publish payloads). See packages/shared/src/bigint-serializer.ts.
 */
import { describe, expect, it } from 'vitest';

import { bigIntReplacer, safeJsonStringify } from './bigint-serializer';

describe('safeJsonStringify', () => {
  it('serializes an object with no BigInt fields normally', () => {
    expect(safeJsonStringify({ a: 1, b: 'hello' })).toBe('{"a":1,"b":"hello"}');
  });

  it('converts a BigInt field to a string representation', () => {
    expect(safeJsonStringify({ balance: 1057n })).toBe('{"balance":"1057"}');
  });

  it('converts multiple BigInt fields', () => {
    const result = safeJsonStringify({
      balanceMinor: 64707n,
      amountMinor: 100n,
      text: 'test',
    });
    expect(result).toBe('{"balanceMinor":"64707","amountMinor":"100","text":"test"}');
  });

  it('handles zero BigInt', () => {
    expect(safeJsonStringify({ v: 0n })).toBe('{"v":"0"}');
  });

  it('handles large BigInt beyond Number.MAX_SAFE_INTEGER without precision loss', () => {
    const huge = 9007199254740993n; // Number.MAX_SAFE_INTEGER + 2
    const result = safeJsonStringify({ v: huge });
    expect(result).toBe('{"v":"9007199254740993"}');
  });

  it('handles negative BigInt', () => {
    expect(safeJsonStringify({ net: -500n })).toBe('{"net":"-500"}');
  });

  it('handles nested objects with BigInt', () => {
    const result = safeJsonStringify({ account: { balance: 1000n, version: 1n } });
    expect(result).toBe('{"account":{"balance":"1000","version":"1"}}');
  });

  it('handles arrays containing BigInt', () => {
    const result = safeJsonStringify([1n, 2n, 3n]);
    expect(result).toBe('["1","2","3"]');
  });

  it('handles indent parameter for pretty-printing', () => {
    const result = safeJsonStringify({ v: 42n }, 2);
    expect(result).toContain('"v": "42"');
  });

  it('returns valid JSON string that can be re-parsed', () => {
    const obj = { balance: 12345n, name: 'test', count: 5 };
    const json = safeJsonStringify(obj);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed['balance']).toBe('12345');
    expect(parsed['name']).toBe('test');
    expect(parsed['count']).toBe(5);
  });
});

describe('bigIntReplacer', () => {
  it('converts a BigInt value to string', () => {
    expect(bigIntReplacer('key', 500n)).toBe('500');
  });

  it('passes through non-BigInt values unchanged', () => {
    expect(bigIntReplacer('key', 42)).toBe(42);
    expect(bigIntReplacer('key', 'hello')).toBe('hello');
    expect(bigIntReplacer('key', null)).toBeNull();
    expect(bigIntReplacer('key', true)).toBe(true);
  });

  it('works as a replacer with JSON.stringify', () => {
    const result = JSON.stringify({ v: 999n }, bigIntReplacer);
    expect(result).toBe('{"v":"999"}');
  });
});
