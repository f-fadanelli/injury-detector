import { describe, test, expect } from 'vitest';
import {
  validateEmail,
  validateNumericRange,
  validateRequired,
  validatePaceFormat,
  validatePassword,
} from './validators';

describe('validateEmail', () => {
  test('returns true for valid email formats', () => {
    expect(validateEmail('user@domain.com')).toBe(true);
    expect(validateEmail('admin@gmail.com')).toBe(true);
    expect(validateEmail('a@b.c')).toBe(true);
  });

  test('returns false for missing @', () => {
    expect(validateEmail('userdomain.com')).toBe(false);
  });

  test('returns false for missing domain dot', () => {
    expect(validateEmail('user@domain')).toBe(false);
  });

  test('returns false for empty local part', () => {
    expect(validateEmail('@domain.com')).toBe(false);
  });

  test('returns false for empty domain part before dot', () => {
    expect(validateEmail('user@.com')).toBe(false);
  });

  test('returns false for empty part after dot', () => {
    expect(validateEmail('user@domain.')).toBe(false);
  });

  test('returns false for multiple @ characters', () => {
    expect(validateEmail('user@@domain.com')).toBe(false);
    expect(validateEmail('user@dom@ain.com')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});

describe('validateNumericRange', () => {
  test('returns true when value is within range', () => {
    expect(validateNumericRange(5, 0, 10)).toBe(true);
    expect(validateNumericRange(150, 100, 250)).toBe(true);
  });

  test('returns true when value equals min', () => {
    expect(validateNumericRange(0, 0, 10)).toBe(true);
  });

  test('returns true when value equals max', () => {
    expect(validateNumericRange(10, 0, 10)).toBe(true);
  });

  test('returns false when value is below min', () => {
    expect(validateNumericRange(-1, 0, 10)).toBe(false);
    expect(validateNumericRange(99, 100, 250)).toBe(false);
  });

  test('returns false when value is above max', () => {
    expect(validateNumericRange(11, 0, 10)).toBe(false);
    expect(validateNumericRange(251, 100, 250)).toBe(false);
  });
});

describe('validateRequired', () => {
  test('returns true for non-empty strings', () => {
    expect(validateRequired('hello')).toBe(true);
    expect(validateRequired('a')).toBe(true);
  });

  test('returns true for numbers', () => {
    expect(validateRequired(0)).toBe(true);
    expect(validateRequired(42)).toBe(true);
  });

  test('returns false for null', () => {
    expect(validateRequired(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(validateRequired(undefined)).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(validateRequired('')).toBe(false);
  });

  test('returns false for whitespace-only string', () => {
    expect(validateRequired('   ')).toBe(false);
  });
});

describe('validatePaceFormat', () => {
  test('returns true for valid mm:ss formats', () => {
    expect(validatePaceFormat('5:30')).toBe(true);
    expect(validatePaceFormat('12:00')).toBe(true);
    expect(validatePaceFormat('0:00')).toBe(true);
    expect(validatePaceFormat('9:59')).toBe(true);
  });

  test('returns false for seconds >= 60', () => {
    expect(validatePaceFormat('5:60')).toBe(false);
    expect(validatePaceFormat('5:99')).toBe(false);
  });

  test('returns false for invalid formats', () => {
    expect(validatePaceFormat('5:3')).toBe(false);
    expect(validatePaceFormat('abc')).toBe(false);
    expect(validatePaceFormat('')).toBe(false);
    expect(validatePaceFormat('5:300')).toBe(false);
    expect(validatePaceFormat(':30')).toBe(false);
  });
});

describe('validatePassword', () => {
  test('returns true for passwords with 6 or more characters', () => {
    expect(validatePassword('123456')).toBe(true);
    expect(validatePassword('abcdefgh')).toBe(true);
    expect(validatePassword('password123')).toBe(true);
  });

  test('returns false for passwords shorter than 6 characters', () => {
    expect(validatePassword('12345')).toBe(false);
    expect(validatePassword('abc')).toBe(false);
    expect(validatePassword('')).toBe(false);
  });

  test('returns true for exactly 6 characters', () => {
    expect(validatePassword('abcdef')).toBe(true);
  });
});
