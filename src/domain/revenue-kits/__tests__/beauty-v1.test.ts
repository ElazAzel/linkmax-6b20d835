import { describe, expect, it } from 'vitest';

import { BEAUTY_REVENUE_KIT, createBeautyPreset } from '../beauty-v1';

describe('Beauty Revenue Kit v1', () => {
  it('declares the stable commercial manifest', () => {
    expect(BEAUTY_REVENUE_KIT.id).toBe('beauty-v1');
    expect(BEAUTY_REVENUE_KIT.version).toBe(1);
    expect(BEAUTY_REVENUE_KIT.requiredBlockTypes).toEqual([
      'profile',
      'pricing',
      'booking',
      'messenger',
    ]);
    expect(BEAUTY_REVENUE_KIT.currency).toBe('KZT');
    expect(BEAUTY_REVENUE_KIT.defaultTimezone).toBe('Asia/Almaty');
  });

  it('creates an editable nails draft from realistic stable presets', () => {
    const draft = createBeautyPreset('nails');

    expect(draft.niche).toBe('nails');
    expect(draft.services).toEqual(expect.arrayContaining([
      expect.objectContaining({
        presetId: 'nails-gel-manicure',
        durationMinutes: 90,
        priceAmount: '7000.00',
        currency: 'KZT',
      }),
    ]));
  });

  it.each(['lashes', 'brows'] as const)('creates a valid %s preset', (niche) => {
    const draft = createBeautyPreset(niche);

    expect(draft.services.length).toBeGreaterThanOrEqual(3);
    expect(draft.services.every((service) => service.currency === 'KZT')).toBe(true);
    expect(draft.availability.timezone).toBe('Asia/Almaty');
  });

  it('returns fresh editable values without mutating the manifest constants', () => {
    const first = createBeautyPreset('nails');
    const second = createBeautyPreset('nails');

    first.services[0].priceAmount = '12345.00';
    first.identity.displayName = 'Changed';

    expect(second.services[0].priceAmount).toBe('7000.00');
    expect(second.identity.displayName).toBe('');
    expect(Object.isFrozen(BEAUTY_REVENUE_KIT)).toBe(true);
  });

  it('rejects unsupported niches', () => {
    expect(() => createBeautyPreset('coach' as never)).toThrow('unsupported_beauty_niche');
  });
});
