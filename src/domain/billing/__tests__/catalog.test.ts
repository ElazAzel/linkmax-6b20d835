import { describe, expect, it } from 'vitest';

import { BILLING_CATALOG, getPlanCommissionRate, getProPrice } from '../catalog';

describe('billing catalog', () => {
  it('returns exact KZT charge totals and derived monthly display prices', () => {
    expect(getProPrice(3)).toEqual({ months: 3, monthlyKzt: 4350, totalKzt: 13050 });
    expect(getProPrice(6)).toEqual({ months: 6, monthlyKzt: 3698, totalKzt: 22185 });
    expect(getProPrice(12)).toEqual({ months: 12, monthlyKzt: 3045, totalKzt: 36540 });
  });

  it('keeps the current commission policy unchanged', () => {
    expect(getPlanCommissionRate('identity')).toBe(0);
    expect(getPlanCommissionRate('free')).toBe(0);
    expect(getPlanCommissionRate('starter')).toBe(0.07);
    expect(getPlanCommissionRate('pro')).toBe(0.01);
    expect(getPlanCommissionRate('business')).toBe(0);
  });

  it('exposes one catalog as the billing source of truth', () => {
    expect(BILLING_CATALOG.pro.periods).toEqual([3, 6, 12]);
    expect(BILLING_CATALOG.pro.pricesKzt[6]).toBe(22185);
  });
});
