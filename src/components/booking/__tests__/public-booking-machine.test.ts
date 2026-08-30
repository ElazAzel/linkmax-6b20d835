import { describe, expect, it } from 'vitest';

import {
  createInitialPublicBookingState,
  publicBookingReducer,
  type PublicBookingService,
} from '../public-booking-machine';

const service: PublicBookingService = {
  id: 'offering-1',
  name: 'Маникюр',
  durationMinutes: 90,
  priceAmount: '8500.00',
  currency: 'KZT',
  depositMode: 'none',
  depositRequiredAmount: '0.00',
};

describe('public booking state machine', () => {
  it('moves from service selection to slot selection', () => {
    const state = publicBookingReducer(createInitialPublicBookingState(), {
      type: 'SERVICE_SELECTED',
      service,
    });

    expect(state).toMatchObject({ step: 'slot', service, error: null });
  });

  it('returns a conflicting submission to refreshed slot selection', () => {
    const initial = createInitialPublicBookingState(service);
    const slotState = publicBookingReducer(initial, {
      type: 'SLOT_SELECTED',
      slot: { date: '2026-09-01', time: '10:00:00', endTime: '11:30:00' },
    });
    const contactState = publicBookingReducer(slotState, {
      type: 'CONTACT_CHANGED',
      contact: { name: 'Алия', phone: '+77000000000', email: '', notes: '' },
    });
    const submitting = publicBookingReducer(contactState, { type: 'SUBMIT' });
    const conflicted = publicBookingReducer(submitting, {
      type: 'SUBMIT_CONFLICT',
      slots: [{ date: '2026-09-01', time: '11:30:00', endTime: '13:00:00', available: true }],
    });

    expect(conflicted).toMatchObject({
      step: 'slot',
      selectedSlot: null,
      error: 'slot_unavailable',
      contact: { name: 'Алия', phone: '+77000000000' },
    });
  });

  it('shows deposit instructions for a pending-payment booking', () => {
    const submitting = {
      ...createInitialPublicBookingState(service),
      step: 'submitting' as const,
    };
    const created = publicBookingReducer(submitting, {
      type: 'CREATED',
      booking: {
        bookingId: 'booking-1',
        status: 'pending_payment',
        version: 1,
        paymentStatus: 'pending',
        depositRequiredAmount: '2500.00',
        currency: 'KZT',
        accessToken: 'a'.repeat(64),
        idempotentReplay: false,
      },
    });

    expect(created).toMatchObject({
      step: 'deposit',
      bookingStatus: 'pending_payment',
      booking: { depositRequiredAmount: '2500.00' },
    });
  });

  it('shows confirmation immediately when no deposit is required', () => {
    const created = publicBookingReducer({
      ...createInitialPublicBookingState(service),
      step: 'submitting',
    }, {
      type: 'CREATED',
      booking: {
        bookingId: 'booking-2',
        status: 'confirmed',
        version: 1,
        paymentStatus: 'pending',
        depositRequiredAmount: '0.00',
        currency: 'KZT',
        accessToken: 'b'.repeat(64),
        idempotentReplay: false,
      },
    });

    expect(created.step).toBe('confirmed');
  });
});
