import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BOOKING_OFFERING_SELECTED_EVENT } from '@/lib/revenue/booking-offering-events';
import { PricingBlock } from '../PricingBlock';

const onBlockClick = vi.fn();

vi.mock('@/hooks/analytics/useAnalyticsTracking', () => ({
  useAnalytics: () => ({ onBlockClick }),
}));

describe('pricing to booking linkage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('dispatches the linked offering when a price item is selected', () => {
    const listener = vi.fn();
    window.addEventListener(BOOKING_OFFERING_SELECTED_EVENT, listener);

    render(<PricingBlock block={{
      id: 'pricing-1',
      type: 'pricing',
      items: [{
        id: 'service-1',
        name: 'Маникюр',
        price: 8500,
        currency: 'KZT',
        serviceOfferingId: 'offering-1',
      }],
    }} />);

    fireEvent.click(screen.getByRole('button'));

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      serviceOfferingId: 'offering-1',
      pricingBlockId: 'pricing-1',
    });
    window.removeEventListener(BOOKING_OFFERING_SELECTED_EVENT, listener);
  });

  it('preserves legacy click behavior for an unlinked item', () => {
    const listener = vi.fn();
    window.addEventListener(BOOKING_OFFERING_SELECTED_EVENT, listener);

    render(<PricingBlock block={{
      id: 'pricing-legacy',
      type: 'pricing',
      items: [{ id: 'legacy-service', name: 'Консультация', price: 5000 }],
    }} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onBlockClick).toHaveBeenCalledTimes(1);
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(BOOKING_OFFERING_SELECTED_EVENT, listener);
  });
});
