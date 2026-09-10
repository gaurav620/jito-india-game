/**
 * Tests for BigInt serialization boundary (Fix #9).
 *
 * Verifies that safeJsonStringify() and bigIntReplacer() correctly handle
 * BigInt values that would otherwise cause JSON.stringify() to throw.
 */
import { describe, expect, it } from 'vitest';

import { bigIntReplacer, safeJsonStringify } from './bigint-serializer';

describe('safeJsonStringify', () => {
  it('serializes a plain object without BigInt', () => {
    const result = safeJsonStringify({ foo: 'bar', n: 42 });
    expect(result).toBe('{"foo":"bar","n":42}');
  });

  it('converts BigInt to string in output', () => {
    const result = safeJsonStringify({ balance: 6470700n });
    expect(result).toBe('{"balance":"6470700"}');
  });

  it('converts nested BigInt fields', () => {
    const result = safeJsonStringify({
      user: { id: 'uuid', balanceMinor: 1050n },
    });
    expect(JSON.parse(result)).toEqual({
      user: { id: 'uuid', balanceMinor: '1050' },
    });
  });

  it('handles 0n correctly', () => {
    const result = safeJsonStringify({ zero: 0n });
    expect(result).toBe('{"zero":"0"}');
  });

  it('handles arrays with BigInt values', () => {
    const result = safeJsonStringify([100n, 200n, 300n]);
    expect(JSON.parse(result)).toEqual(['100', '200', '300']);
  });

  it('does NOT modify regular numbers', () => {
    const result = safeJsonStringify({ amount: 42 });
    expect(result).toBe('{"amount":42}');
  });

  it('would throw without safeJsonStringify (baseline verification)', () => {
    expect(() => JSON.stringify({ balance: 1000n })).toThrow(TypeError);
  });
});

describe('bigIntReplacer', () => {
  it('converts BigInt to string', () => {
    expect(bigIntReplacer('key', 1000n)).toBe('1000');
  });

  it('passes through non-BigInt values unchanged', () => {
    expect(bigIntReplacer('key', 42)).toBe(42);
    expect(bigIntReplacer('key', 'hello')).toBe('hello');
    expect(bigIntReplacer('key', null)).toBeNull();
  });

  it('can be used with JSON.stringify as a replacer', () => {
    const result = JSON.stringify(
      { balance: 6470700n, name: 'test' },
      bigIntReplacer,
    );
    expect(JSON.parse(result)).toEqual({ balance: '6470700', name: 'test' });
  });
});
