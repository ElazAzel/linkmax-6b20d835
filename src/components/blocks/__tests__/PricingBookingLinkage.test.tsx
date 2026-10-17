import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BOOKING_OFFERING_SELECTED_EVENT } from '@/lib/revenue/booking-offering-events';
import { PageContactsProvider } from '@/lib/blocks/page-contacts';
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

  it('leaves an unlinked item static when the page has no contact', () => {
    render(<PricingBlock block={{
      id: 'pricing-legacy',
      type: 'pricing',
      items: [{ id: 'legacy-service', name: 'Консультация', price: 5000 }],
    }} />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Консультация')).toBeInTheDocument();
  });

  it('opens a prefilled WhatsApp chat for an unlinked item when the page has one', () => {
    const listener = vi.fn();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    window.addEventListener(BOOKING_OFFERING_SELECTED_EVENT, listener);

    render(
      <PageContactsProvider value={[{ platform: 'whatsapp', href: 'https://wa.me/77011234567', handle: '77011234567' }]}>
        <PricingBlock block={{
          id: 'pricing-legacy',
          type: 'pricing',
          items: [{ id: 'legacy-service', name: 'Консультация', price: 5000 }],
        }} />
      </PageContactsProvider>,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(onBlockClick).toHaveBeenCalledTimes(1);
    expect(listener).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledTimes(1);
    expect(String(open.mock.calls[0][0])).toMatch(/^https:\/\/wa\.me\/77011234567\?text=/);
    expect(decodeURIComponent(String(open.mock.calls[0][0]))).toContain('Здравствуйте');
    open.mockRestore();
    window.removeEventListener(BOOKING_OFFERING_SELECTED_EVENT, listener);
  });
});
