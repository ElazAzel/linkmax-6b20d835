import { describe, expect, it } from 'vitest';

import { isAuthoritativeRevenueEvent, REVENUE_EVENTS } from '../events';

describe('revenue event authority', () => {
  it('distinguishes visitor intent from server facts', () => {
    expect(isAuthoritativeRevenueEvent('booking_completed')).toBe(true);
    expect(isAuthoritativeRevenueEvent('booking_payment_recorded')).toBe(true);
    expect(isAuthoritativeRevenueEvent('booking_started')).toBe(false);
    expect(isAuthoritativeRevenueEvent('service_viewed')).toBe(false);
  });

  it('does not treat unknown event names as authoritative', () => {
    expect(isAuthoritativeRevenueEvent('booking_paid_from_browser')).toBe(false);
  });

  it('exposes the complete v2 canonical event names', () => {
    expect(REVENUE_EVENTS.bookingCreated).toBe('booking_created');
    expect(REVENUE_EVENTS.depositPaymentSucceeded).toBe('deposit_payment_succeeded');
    expect(REVENUE_EVENTS.bookingRefundRecorded).toBe('booking_refund_recorded');
    expect(new Set(Object.values(REVENUE_EVENTS)).size).toBe(Object.values(REVENUE_EVENTS).length);
  });
});
