import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabase } from '@/platform/supabase/client';
import {
  BookingLifecycleError,
  createPublicBooking,
  loadBookingManagementAvailability,
  loadBookingManagementContext,
  loadPublicAvailability,
  manageBookingWithToken,
} from '../booking-lifecycle';

vi.mock('@/platform/supabase/client', () => ({
  supabase: { rpc: vi.fn(), functions: { invoke: vi.fn() } },
}));

describe('booking lifecycle service', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockReset();
    vi.mocked(supabase.functions.invoke).mockReset().mockResolvedValue({ data: null, error: null });
  });

  it('sends only visitor-owned booking input and preserves decimal strings', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        ok: true,
        bookingId: 'booking-1',
        status: 'pending_payment',
        version: 1,
        paymentStatus: 'pending',
        depositRequiredAmount: '2500.00',
        currency: 'KZT',
        accessToken: 'a'.repeat(64),
        idempotentReplay: false,
      },
      error: null,
    } as never);

    const result = await createPublicBooking({
      pageId: 'page-1',
      blockId: 'booking-block-1',
      serviceOfferingId: 'offering-1',
      slotDate: '2026-09-01',
      slotTime: '10:00:00',
      staffId: null,
      client: { name: 'Алия', phone: '+77000000000', email: null, notes: null },
      bookingTimezone: 'Asia/Almaty',
      attribution: { source: 'instagram' },
      idempotencyKey: 'public-booking:mutation-1',
    });

    expect(supabase.rpc).toHaveBeenCalledWith('create_public_booking', {
      p_page_id: 'page-1',
      p_block_id: 'booking-block-1',
      p_service_offering_id: 'offering-1',
      p_slot_date: '2026-09-01',
      p_slot_time: '10:00:00',
      p_staff_id: null,
      p_client_name: 'Алия',
      p_client_phone: '+77000000000',
      p_client_email: null,
      p_client_notes: null,
      p_booking_timezone: 'Asia/Almaty',
      p_attribution: { source: 'instagram' },
      p_idempotency_key: 'public-booking:mutation-1',
    });
    expect(result.depositRequiredAmount).toBe('2500.00');
    expect(supabase.functions.invoke).toHaveBeenCalledWith('send-booking-notification', {
      body: {
        bookingId: 'booking-1',
        accessToken: 'a'.repeat(64),
        locale: undefined,
      },
    });
    expect(Object.keys(vi.mocked(supabase.rpc).mock.calls[0][1] as object)).not.toEqual(
      expect.arrayContaining(['owner_id', 'price_amount', 'payment_status']),
    );
  });

  it('does not roll back an authoritative booking when notification enqueueing fails', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        ok: true,
        bookingId: 'booking-2',
        status: 'confirmed',
        version: 1,
        paymentStatus: 'not_applicable',
        depositRequiredAmount: '0.00',
        currency: 'KZT',
        accessToken: 'b'.repeat(64),
        idempotentReplay: false,
      },
      error: null,
    } as never);
    vi.mocked(supabase.functions.invoke).mockRejectedValueOnce(new Error('network unavailable'));

    await expect(createPublicBooking({
      pageId: 'page-1',
      blockId: 'booking-block-1',
      serviceOfferingId: 'offering-1',
      slotDate: '2026-09-01',
      slotTime: '10:00:00',
      staffId: null,
      client: { name: 'Алия', phone: '+77000000000', email: null, notes: null },
      bookingTimezone: 'Asia/Almaty',
      attribution: {},
      idempotencyKey: 'public-booking:mutation-notification-failure',
    })).resolves.toMatchObject({ bookingId: 'booking-2', status: 'confirmed' });
  });

  it('maps slot conflicts to a typed non-network error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: { ok: false, code: 'slot_unavailable', retryable: false },
      error: null,
    } as never);

    await expect(createPublicBooking({
      pageId: 'page-1',
      blockId: 'booking-block-1',
      serviceOfferingId: null,
      slotDate: '2026-09-01',
      slotTime: '10:00:00',
      staffId: null,
      client: { name: 'Алия', phone: null, email: 'a@example.com', notes: null },
      bookingTimezone: 'Asia/Almaty',
      attribution: {},
      idempotencyKey: 'public-booking:mutation-2',
    })).rejects.toMatchObject({
      name: 'BookingLifecycleError',
      code: 'slot_unavailable',
      retryable: false,
    } satisfies Partial<BookingLifecycleError>);
  });

  it('loads normalized availability and manages with a raw token only at the RPC boundary', async () => {
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({
        data: [{ slot_date: '2026-09-01', slot_time: '10:00:00', slot_end_time: '11:30:00', available: true }],
        error: null,
      } as never)
      .mockResolvedValueOnce({
        data: { ok: true, bookingId: 'booking-1', status: 'cancelled', version: 2, idempotentReplay: false },
        error: null,
      } as never);

    await expect(loadPublicAvailability({
      pageId: 'page-1',
      blockId: 'booking-block-1',
      fromDate: '2026-09-01',
      toDate: '2026-09-01',
      staffId: null,
    })).resolves.toEqual([
      { date: '2026-09-01', time: '10:00:00', endTime: '11:30:00', available: true },
    ]);

    await manageBookingWithToken({
      token: 'c'.repeat(64),
      action: 'cancel',
      expectedVersion: 1,
      idempotencyKey: 'manage-booking:mutation-1',
    });

    expect(supabase.rpc).toHaveBeenLastCalledWith('manage_booking_by_access_token', {
      p_token: 'c'.repeat(64),
      p_action: 'cancel',
      p_expected_version: 1,
      p_idempotency_key: 'manage-booking:mutation-1',
      p_slot_date: null,
      p_slot_time: null,
      p_slot_end_time: null,
    });
  });

  it('parses only the allowlisted management projection and token-scoped availability', async () => {
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({
        data: {
          ok: true,
          booking: {
            id: 'booking-1',
            serviceName: 'Маникюр',
            slotDate: '2026-09-01',
            slotTime: '10:00:00',
            slotEndTime: '11:30:00',
            timezone: 'Asia/Almaty',
            status: 'confirmed',
            version: 3,
            paymentStatus: 'paid',
            depositRequiredAmount: '2500.00',
            paidAmount: '2500.00',
            currency: 'KZT',
            allowedActions: ['cancel', 'reschedule'],
            ownerPagePath: '/aru',
            internalNotes: 'must-not-project',
          },
        },
        error: null,
      } as never)
      .mockResolvedValueOnce({
        data: {
          ok: true,
          slots: [{ date: '2026-09-02', time: '12:00:00', endTime: '13:30:00', available: true }],
        },
        error: null,
      } as never);

    await expect(loadBookingManagementContext('d'.repeat(64))).resolves.toEqual({
      id: 'booking-1',
      serviceName: 'Маникюр',
      slotDate: '2026-09-01',
      slotTime: '10:00:00',
      slotEndTime: '11:30:00',
      timezone: 'Asia/Almaty',
      status: 'confirmed',
      version: 3,
      paymentStatus: 'paid',
      depositRequiredAmount: '2500.00',
      paidAmount: '2500.00',
      currency: 'KZT',
      allowedActions: ['cancel', 'reschedule'],
      ownerPagePath: '/aru',
    });
    await expect(loadBookingManagementAvailability({
      token: 'd'.repeat(64), fromDate: '2026-09-02', toDate: '2026-09-02',
    })).resolves.toEqual([
      { date: '2026-09-02', time: '12:00:00', endTime: '13:30:00', available: true },
    ]);
  });

  it('preserves only the public owner path when a management token expires', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: { ok: false, code: 'token_expired', retryable: false, ownerPagePath: '/aru' },
      error: null,
    } as never);

    await expect(loadBookingManagementContext('e'.repeat(64))).rejects.toMatchObject({
      code: 'token_expired',
      retryable: false,
      details: { ownerPagePath: '/aru' },
    });
  });
});
