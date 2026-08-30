import type { PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { transitionBooking } from '@/services/booking-lifecycle';
import { useBookingOperations } from '../useBookingOperations';

vi.mock('@/services/booking-lifecycle', () => ({
  transitionBooking: vi.fn(),
  loadBookingOwnerDetail: vi.fn(),
}));

function wrapper(queryClient: QueryClient) {
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useBookingOperations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
  });

  it('completes with collected amount, method, optimistic version and invalidates facts', async () => {
    vi.mocked(transitionBooking).mockResolvedValue({
      ok: true,
      bookingId: 'booking-1',
      status: 'completed',
      version: 4,
    });
    const ids = ['transition-uuid', 'payment-uuid'];
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useBookingOperations({
      pageId: 'page-1',
      createId: () => ids.shift() ?? 'unexpected',
    }), { wrapper: wrapper(queryClient) });

    await act(async () => {
      await result.current.complete({
        bookingId: 'booking-1',
        expectedVersion: 3,
        collectedAmount: '5000.00',
        paymentMethod: 'cash',
      });
    });

    expect(transitionBooking).toHaveBeenCalledWith({
      bookingId: 'booking-1',
      toStatus: 'completed',
      expectedVersion: 3,
      reasonCode: 'owner_completed',
      idempotencyKey: 'booking-transition:transition-uuid',
      paymentAmount: '5000.00',
      paymentMethod: 'cash',
      paymentIdempotencyKey: 'booking-payment:payment-uuid',
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['bookings'] });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['revenue-outcome-summary', 'page-1'],
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['booking-revenue-detail', 'booking-1'],
    });
  });

  it('reuses the same transition and payment UUIDs for an automatic retry', async () => {
    vi.mocked(transitionBooking)
      .mockResolvedValueOnce({ ok: false, code: 'request_failed', retryable: true })
      .mockResolvedValueOnce({
        ok: true,
        bookingId: 'booking-1',
        status: 'confirmed',
        version: 2,
      });
    const ids = ['transition-retry', 'payment-retry'];
    const { result } = renderHook(() => useBookingOperations({
      pageId: 'page-1',
      createId: () => ids.shift() ?? 'unexpected',
    }), { wrapper: wrapper(queryClient) });

    await act(async () => {
      await result.current.confirmDeposit({
        bookingId: 'booking-1',
        expectedVersion: 1,
        amount: '2000.00',
        paymentMethod: 'kaspi_manual',
      });
    });

    expect(transitionBooking).toHaveBeenCalledTimes(2);
    expect(vi.mocked(transitionBooking).mock.calls[0][0])
      .toEqual(vi.mocked(transitionBooking).mock.calls[1][0]);
  });

  it('does not retry an optimistic version conflict and refreshes stale booking facts', async () => {
    vi.mocked(transitionBooking).mockResolvedValue({
      ok: false,
      code: 'version_conflict',
      retryable: true,
      currentVersion: 4,
    });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useBookingOperations({
      pageId: 'page-1',
      createId: () => 'transition-conflict',
    }), { wrapper: wrapper(queryClient) });

    await act(async () => {
      await expect(result.current.cancel({
        bookingId: 'booking-1',
        expectedVersion: 3,
      })).rejects.toMatchObject({ code: 'version_conflict' });
    });

    expect(transitionBooking).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['bookings'] });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['booking-revenue-detail', 'booking-1'],
    });
  });
});
