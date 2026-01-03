import { describe, expect, it } from 'vitest';
import { parseSixDigitPin } from '@/lib/auth/pin';

describe('parseSixDigitPin', () => {
  it('accepts a valid 6-digit string (including leading zeros)', () => {
    expect(parseSixDigitPin('000000')).toBe('000000');
    expect(parseSixDigitPin('123456')).toBe('123456');
  });

  it('rejects invalid PIN values', () => {
    const invalidValues: unknown[] = [
      '',
      '12345',
      '1234567',
      '12 3456',
      'abcdef',
      null,
      undefined,
      123456,
      {},
      [],
    ];

    for (const value of invalidValues) {
      expect(() => parseSixDigitPin(value)).toThrow();
    }
  });
});

