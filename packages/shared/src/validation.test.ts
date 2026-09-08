import { describe, it, expect } from 'vitest';

import {
  isValidUUID,
  isPositiveNumber,
  isNonNegativeNumber,
  isNonEmptyString,
  isValidEmail,
  isIntegerInRange,
} from './validation';

describe('validation utilities', () => {
  describe('isValidUUID', () => {
    it('should accept valid UUID v4', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid UUID', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('550e8400-e29b-51d4-a716-446655440000')).toBe(false); // v5 not v4
    });
  });

  describe('isPositiveNumber', () => {
    it('should accept positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(0.5)).toBe(true);
      expect(isPositiveNumber(100)).toBe(true);
    });

    it('should reject zero, negative, and non-numbers', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(NaN)).toBe(false);
      expect(isPositiveNumber('5')).toBe(false);
      expect(isPositiveNumber(null)).toBe(false);
    });
  });

  describe('isNonNegativeNumber', () => {
    it('should accept zero and positive numbers', () => {
      expect(isNonNegativeNumber(0)).toBe(true);
      expect(isNonNegativeNumber(1)).toBe(true);
    });

    it('should reject negative and non-numbers', () => {
      expect(isNonNegativeNumber(-1)).toBe(false);
      expect(isNonNegativeNumber(NaN)).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should accept non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('  x  ')).toBe(true);
    });

    it('should reject empty, whitespace-only, and non-strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('a@b.co')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('isIntegerInRange', () => {
    it('should accept integers within range', () => {
      expect(isIntegerInRange(5, 1, 10)).toBe(true);
      expect(isIntegerInRange(1, 1, 10)).toBe(true);
      expect(isIntegerInRange(10, 1, 10)).toBe(true);
    });

    it('should reject out of range or non-integers', () => {
      expect(isIntegerInRange(0, 1, 10)).toBe(false);
      expect(isIntegerInRange(11, 1, 10)).toBe(false);
      expect(isIntegerInRange(5.5, 1, 10)).toBe(false);
      expect(isIntegerInRange('5', 1, 10)).toBe(false);
    });
  });
});
