import { describe, it, expect } from 'vitest';

import { formatAmount, formatCountdown, formatRoundNumber, truncate } from './formatting';

describe('formatting utilities', () => {
  describe('formatAmount', () => {
    it('should format numbers with Indian locale commas', () => {
      expect(formatAmount(12345.5)).toBe('12,345.50');
      expect(formatAmount(0)).toBe('0.00');
      expect(formatAmount(1000000)).toBe('10,00,000.00');
    });

    it('should respect decimal places parameter', () => {
      expect(formatAmount(100, 0)).toBe('100');
      expect(formatAmount(100.5, 1)).toBe('100.5');
    });
  });

  describe('formatCountdown', () => {
    it('should format seconds as MM:SS', () => {
      expect(formatCountdown(65)).toBe('01:05');
      expect(formatCountdown(0)).toBe('00:00');
      expect(formatCountdown(599)).toBe('09:59');
    });

    it('should handle negative values as 00:00', () => {
      expect(formatCountdown(-5)).toBe('00:00');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings with ellipsis', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });

    it('should return original if within limit', () => {
      expect(truncate('Hi', 10)).toBe('Hi');
    });
  });

  describe('formatRoundNumber', () => {
    it('should pad with leading zeros', () => {
      expect(formatRoundNumber(42)).toBe('000042');
      expect(formatRoundNumber(1, 4)).toBe('0001');
    });
  });
});
