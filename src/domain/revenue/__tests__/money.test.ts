import { describe, expect, it } from 'vitest';

import { formatMoney, parseMoney } from '../money';

describe('revenue money', () => {
  it('parses decimal strings into integer minor units', () => {
    expect(parseMoney('0')).toBe(0n);
    expect(parseMoney('7000.00')).toBe(700_000n);
    expect(parseMoney('19.9')).toBe(1_990n);
  });

  it('formats integer minor units as fixed two-decimal strings', () => {
    expect(formatMoney(0n)).toBe('0.00');
    expect(formatMoney(175_000n)).toBe('1750.00');
    expect(formatMoney(-101n)).toBe('-1.01');
  });

  it.each(['', ' 1.00', '01.00', '-1.00', '1.001', 'NaN', 'Infinity']) (
    'rejects an unsafe money representation: %s',
    (value) => {
      expect(() => parseMoney(value)).toThrow('invalid_money');
    },
  );
});
