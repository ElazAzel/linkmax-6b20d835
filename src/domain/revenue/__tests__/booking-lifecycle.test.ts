import { describe, expect, it } from 'vitest';

import { canTransitionBooking } from '../booking-lifecycle';

describe('booking lifecycle', () => {
  it('allows only declared forward transitions', () => {
    expect(canTransitionBooking('pending_payment', 'confirmed')).toBe(true);
    expect(canTransitionBooking('pending_payment', 'cancelled')).toBe(true);
    expect(canTransitionBooking('pending_payment', 'completed')).toBe(false);
    expect(canTransitionBooking('confirmed', 'completed')).toBe(true);
    expect(canTransitionBooking('confirmed', 'no_show')).toBe(true);
  });

  it('requires privilege and a reason for terminal-state correction', () => {
    expect(canTransitionBooking('completed', 'confirmed')).toBe(false);
    expect(canTransitionBooking('completed', 'confirmed', { privilegedCorrection: true })).toBe(false);
    expect(
      canTransitionBooking('completed', 'confirmed', {
        privilegedCorrection: true,
        reason: 'Recorded against the wrong appointment',
      }),
    ).toBe(true);
  });

  it('does not allow cancelled bookings to be revived', () => {
    expect(
      canTransitionBooking('cancelled', 'confirmed', {
        privilegedCorrection: true,
        reason: 'Owner request',
      }),
    ).toBe(false);
  });
});
