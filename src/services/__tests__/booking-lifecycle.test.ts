import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabase } from '@/platform/supabase/client';
import { transitionBooking } from '../booking-lifecycle';

vi.mock('@/platform/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

const rpcMock = vi.mocked(supabase.rpc);

describe('booking lifecycle service', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('sends an optimistic idempotent transition to the authoritative RPC', async () => {
    rpcMock.mockResolvedValue({
      data: { ok: true, bookingId: 'booking-1', status: 'cancelled', version: 4 },
      error: null,
    } as never);

    const result = await transitionBooking({
      bookingId: 'booking-1',
      toStatus: 'cancelled',
      expectedVersion: 3,
      reasonCode: 'owner_cancelled',
      idempotencyKey: 'transition-cancel-0001',
    });

    expect(rpcMock).toHaveBeenCalledWith('transition_booking', {
      p_booking_id: 'booking-1',
      p_to_status: 'cancelled',
      p_expected_version: 3,
      p_reason_code: 'owner_cancelled',
      p_idempotency_key: 'transition-cancel-0001',
      p_payment_amount: null,
      p_payment_method: null,
      p_payment_idempotency_key: null,
      p_waive_payment: false,
      p_privileged_correction: false,
      p_actor_type: 'owner',
    });
    expect(result).toEqual({ ok: true, bookingId: 'booking-1', status: 'cancelled', version: 4 });
  });

  it('preserves money as a decimal string at the TypeScript boundary', async () => {
    rpcMock.mockResolvedValue({
      data: { ok: true, bookingId: 'booking-1', status: 'completed', version: 5 },
      error: null,
    } as never);

    await transitionBooking({
      bookingId: 'booking-1',
      toStatus: 'completed',
      expectedVersion: 4,
      reasonCode: 'visit_completed',
      idempotencyKey: 'transition-complete-0001',
      paymentAmount: '5000.00',
      paymentMethod: 'cash',
      paymentIdempotencyKey: 'payment-balance-0001',
    });

    expect(rpcMock).toHaveBeenCalledWith(
      'transition_booking',
      expect.objectContaining({ p_payment_amount: '5000.00' }),
    );
  });

  it('normalizes transport failures without inventing a booking outcome', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'network unavailable' } } as never);

    await expect(
      transitionBooking({
        bookingId: 'booking-1',
        toStatus: 'confirmed',
        expectedVersion: 1,
        reasonCode: 'owner_confirmed',
        idempotencyKey: 'transition-confirm-0001',
      }),
    ).resolves.toEqual({ ok: false, code: 'request_failed', retryable: true });
  });
});
