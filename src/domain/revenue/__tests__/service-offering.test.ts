import { describe, expect, it } from 'vitest';

import { calculateDepositAmount, validateServiceOffering } from '../service-offering';

describe('service offering revenue contract', () => {
  it('calculates fixed, percent and absent deposits exactly', () => {
    expect(calculateDepositAmount({ mode: 'fixed', value: '2000.00' }, '7000.00')).toBe('2000.00');
    expect(calculateDepositAmount({ mode: 'percent', value: '25' }, '7000.00')).toBe('1750.00');
    expect(calculateDepositAmount({ mode: 'none', value: '0.00' }, '7000.00')).toBe('0.00');
  });

  it('rejects a fixed deposit above the service price', () => {
    expect(() => calculateDepositAmount({ mode: 'fixed', value: '8000.00' }, '7000.00')).toThrow(
      'deposit_exceeds_price',
    );
  });

  it('validates the normalized service fields', () => {
    expect(
      validateServiceOffering({
        name: '',
        durationMinutes: 60,
        priceAmount: '5000.00',
        currency: 'KZT',
      }).ok,
    ).toBe(false);

    expect(
      validateServiceOffering({
        name: 'Маникюр',
        durationMinutes: 60,
        priceAmount: '5000.00',
        currency: 'KZT',
      }),
    ).toEqual({ ok: true });
  });

  it('rejects invalid duration, currency and money fields', () => {
    const result = validateServiceOffering({
      name: 'Маникюр',
      durationMinutes: 4,
      priceAmount: '-1.00',
      currency: 'kzt',
    });

    expect(result).toEqual({
      ok: false,
      errors: ['duration_minutes_invalid', 'price_amount_invalid', 'currency_invalid'],
    });
  });
});
