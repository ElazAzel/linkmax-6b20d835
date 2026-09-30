import { describe, expect, it } from 'vitest';
import { getOffersInventory } from '../offers-inventory';
import type { PageData } from '@/types/page';

describe('stored offers inventory', () => {
  it('distinguishes an explicit zero price from missing or invalid prices', () => {
    const inventory = getOffersInventory({ blocks: [{ id: 'p', type: 'pricing', items: [
      { id: 'free', name: 'Intro', price: 0 }, { id: 'missing', name: 'Consultation' },
      { id: 'invalid', name: 'Bad price', price: -100 },
    ] }] } as unknown as PageData, 'en');
    expect(inventory?.items.map((item) => item.price)).toEqual([0, null, null]);
  });

  it('keeps unknown linked service facts absent while preserving availability access', () => {
    const block = { id: 'b', type: 'booking', serviceOfferingIds: ['not-on-page'], slotDuration: 60 };
    const inventory = getOffersInventory({ blocks: [block] } as unknown as PageData, 'ru');
    expect(inventory?.items).toEqual([]);
    expect(inventory?.hasUnresolvedServices).toBe(true);
    expect(inventory?.bookingBlocks).toEqual([block]);
  });

  it('returns a readable error state for malformed saved blocks', () => {
    expect(getOffersInventory({ blocks: [null] } as unknown as PageData, 'ru')).toBeNull();
    expect(getOffersInventory({ blocks: [{ type: 'pricing', items: {} }] } as unknown as PageData, 'ru')).toBeNull();
  });
});
