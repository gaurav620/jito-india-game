/**
 * Tests for centipoints conversion helpers.
 */
import { describe, expect, it } from 'vitest';

import {
  centipointsToNumber,
  fromCentipoints,
  sumCentipoints,
  toCentipoints,
} from './centipoints';

describe('toCentipoints', () => {
  describe('from number', () => {
    it('converts a whole-number display value', () => {
      expect(toCentipoints(10)).toBe(1000n);
    });

    it('converts zero', () => {
      expect(toCentipoints(0)).toBe(0n);
    });

    it('converts a decimal display value', () => {
      expect(toCentipoints(10.5)).toBe(1050n);
    });

    it('converts 0.01 (the smallest unit)', () => {
      expect(toCentipoints(0.01)).toBe(1n);
    });

    it('converts a large value without precision loss', () => {
      expect(toCentipoints(64707.0)).toBe(6470700n);
    });

    it('truncates past 2 decimal places (conservative — never rounds up)', () => {
      // 10.999 → 10.99 → 1099 (not 1100)
      expect(toCentipoints(10.999)).toBe(1099n);
    });

    it('throws RangeError for negative number', () => {
      expect(() => toCentipoints(-1)).toThrow(RangeError);
    });

    it('throws TypeError for NaN', () => {
      expect(() => toCentipoints(NaN)).toThrow(TypeError);
    });

    it('throws TypeError for Infinity', () => {
      expect(() => toCentipoints(Infinity)).toThrow(TypeError);
    });
  });

  describe('from string', () => {
    it('converts a string integer', () => {
      expect(toCentipoints('10')).toBe(1000n);
    });

    it('converts a string decimal', () => {
      expect(toCentipoints('10.50')).toBe(1050n);
    });

    it('converts "0.01"', () => {
      expect(toCentipoints('0.01')).toBe(1n);
    });

    it('converts "0.00"', () => {
      expect(toCentipoints('0.00')).toBe(0n);
    });

    it('throws TypeError for negative string (invalid decimal format)', () => {
      // Fix #13: negative strings don't match /^(\d+)(\.\d+)?$/ pattern,
      // so they throw TypeError (invalid format) rather than RangeError.
      expect(() => toCentipoints('-1')).toThrow(TypeError);
    });

    it('throws TypeError for non-numeric string', () => {
      expect(() => toCentipoints('abc')).toThrow(TypeError);
    });

    // Fix #13 regression tests: string path must be IEEE-754-safe
    it('Fix #13: "10.57" converts exactly to 1057n (not 1056n via parseFloat)', () => {
      // parseFloat('10.57') * 100 = 1056.9999999999999 → Math.trunc = 1056 (wrong!)
      // New string path: exact integer arithmetic → 1057 (correct)
      expect(toCentipoints('10.57')).toBe(1057n);
    });

    it('Fix #13: "10.19" converts exactly to 1019n', () => {
      expect(toCentipoints('10.19')).toBe(1019n);
    });

    it('Fix #13: "0.30" converts exactly to 30n', () => {
      expect(toCentipoints('0.30')).toBe(30n);
    });

    it('Fix #13: "64707.99" converts exactly to 6470799n', () => {
      expect(toCentipoints('64707.99')).toBe(6470799n);
    });

    it('Fix #13: truncates to 2dp toward zero for "10.999"', () => {
      // Truncate, not round: 10.999 → 10.99 → 1099n
      expect(toCentipoints('10.999')).toBe(1099n);
    });
  });

  describe('from bigint', () => {
    it('returns the same bigint (already in centipoints)', () => {
      expect(toCentipoints(1000n)).toBe(1000n);
    });

    it('returns 0n for 0n', () => {
      expect(toCentipoints(0n)).toBe(0n);
    });

    it('throws RangeError for negative bigint', () => {
      expect(() => toCentipoints(-1n)).toThrow(RangeError);
    });
  });
});

describe('fromCentipoints', () => {
  it('converts 1000n → "10.00"', () => {
    expect(fromCentipoints(1000n)).toBe('10.00');
  });

  it('converts 0n → "0.00"', () => {
    expect(fromCentipoints(0n)).toBe('0.00');
  });

  it('converts 1n → "0.01"', () => {
    expect(fromCentipoints(1n)).toBe('0.01');
  });

  it('converts 1050n → "10.50"', () => {
    expect(fromCentipoints(1050n)).toBe('10.50');
  });

  it('converts 6470700n → "64707.00"', () => {
    expect(fromCentipoints(6470700n)).toBe('64707.00');
  });

  it('pads fractional part to 2 digits: 10n → "0.10"', () => {
    expect(fromCentipoints(10n)).toBe('0.10');
  });

  it('throws RangeError for negative centipoints', () => {
    expect(() => fromCentipoints(-1n)).toThrow(RangeError);
  });

  it('round-trips: toCentipoints(fromCentipoints(x)) === x', () => {
    const values = [0n, 1n, 99n, 100n, 1050n, 6470700n, 999999999n];
    for (const v of values) {
      expect(toCentipoints(fromCentipoints(v))).toBe(v);
    }
  });
});

describe('centipointsToNumber', () => {
  it('converts bigint to number', () => {
    expect(centipointsToNumber(1000n)).toBe(1000);
  });

  it('converts 0n to 0', () => {
    expect(centipointsToNumber(0n)).toBe(0);
  });

  it('returns null for null input', () => {
    expect(centipointsToNumber(null)).toBeNull();
  });
});

describe('sumCentipoints', () => {
  it('sums an array of bigint values', () => {
    expect(sumCentipoints([100n, 200n, 300n])).toBe(600n);
  });

  it('returns 0n for an empty array', () => {
    expect(sumCentipoints([])).toBe(0n);
  });

  it('handles a single value', () => {
    expect(sumCentipoints([500n])).toBe(500n);
  });

  it('handles large values', () => {
    expect(sumCentipoints([6470700n, 6470700n])).toBe(12941400n);
  });
});
