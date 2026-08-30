import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { revenueOutcomeKeys } from '@/hooks/revenue/useRevenueOutcomeSummary';
import {
  loadBookingOwnerDetail,
  transitionBooking,
  type BookingOwnerDetail,
  type BookingPaymentMethod,
  type TransitionBookingInput,
} from '@/services/booking-lifecycle';

export const bookingRevenueKeys = {
  all: ['booking-revenue-detail'] as const,
  detail: (bookingId: string) => [...bookingRevenueKeys.all, bookingId] as const,
};

export class BookingOperationError extends Error {
  constructor(public readonly code: string, public readonly retryable: boolean) {
    super(code);
    this.name = 'BookingOperationError';
  }
}

interface BookingOperationBase {
  bookingId: string;
  expectedVersion: number;
}

interface CompleteInput extends BookingOperationBase {
  collectedAmount: string;
  paymentMethod: BookingPaymentMethod;
}

interface ConfirmDepositInput extends BookingOperationBase {
  amount: string;
  paymentMethod: BookingPaymentMethod;
}

interface UseBookingOperationsOptions {
  pageId?: string;
  onSuccess?: () => void | Promise<void>;
  createId?: () => string;
}

interface PreparedOperation {
  input: TransitionBookingInput;
}

function withMutationIds(
  input: Omit<TransitionBookingInput, 'idempotencyKey' | 'paymentIdempotencyKey'>,
  createId: () => string,
): PreparedOperation {
  return {
    input: {
      ...input,
      idempotencyKey: `booking-transition:${createId()}`,
      ...(input.paymentAmount && input.paymentAmount !== '0.00'
        ? { paymentIdempotencyKey: `booking-payment:${createId()}` }
        : {}),
    },
  };
}

export function useBookingRevenueDetail(bookingId?: string) {
  const safeBookingId = bookingId ?? '';
  return useQuery<BookingOwnerDetail>({
    queryKey: bookingRevenueKeys.detail(safeBookingId),
    enabled: safeBookingId.length > 0,
    queryFn: () => loadBookingOwnerDetail(safeBookingId),
  });
}

export function useBookingOperations({
  pageId,
  onSuccess,
  createId = () => crypto.randomUUID(),
}: UseBookingOperationsOptions = {}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ input }: PreparedOperation) => {
      const result = await transitionBooking(input);
      if (!result.ok) throw new BookingOperationError(result.code, result.retryable);
      return result;
    },
    retry: (failureCount, error) => (
      error instanceof BookingOperationError && error.retryable && failureCount < 1
    ),
    retryDelay: 0,
    onSuccess: async (result) => {
      const invalidations: Array<Promise<unknown>> = [
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: bookingRevenueKeys.detail(result.bookingId) }),
      ];
      if (pageId) {
        invalidations.push(queryClient.invalidateQueries({
          queryKey: revenueOutcomeKeys.page(pageId),
        }));
      }
      await Promise.all(invalidations);
      await onSuccess?.();
    },
  });

  return {
    isPending: mutation.isPending,
    error: mutation.error,
    complete: ({
      bookingId,
      expectedVersion,
      collectedAmount,
      paymentMethod,
    }: CompleteInput) => mutation.mutateAsync(withMutationIds({
      bookingId,
      toStatus: 'completed',
      expectedVersion,
      reasonCode: 'owner_completed',
      paymentAmount: collectedAmount,
      paymentMethod,
    }, createId)),
    confirmDeposit: ({
      bookingId,
      expectedVersion,
      amount,
      paymentMethod,
    }: ConfirmDepositInput) => mutation.mutateAsync(withMutationIds({
      bookingId,
      toStatus: 'confirmed',
      expectedVersion,
      reasonCode: 'owner_confirmed_deposit',
      paymentAmount: amount,
      paymentMethod,
    }, createId)),
    waivePayment: ({ bookingId, expectedVersion }: BookingOperationBase) => (
      mutation.mutateAsync(withMutationIds({
        bookingId,
        toStatus: 'confirmed',
        expectedVersion,
        reasonCode: 'owner_waived_deposit',
        waivePayment: true,
      }, createId))
    ),
    cancel: ({ bookingId, expectedVersion }: BookingOperationBase) => (
      mutation.mutateAsync(withMutationIds({
        bookingId,
        toStatus: 'cancelled',
        expectedVersion,
        reasonCode: 'owner_cancelled',
      }, createId))
    ),
    noShow: ({ bookingId, expectedVersion }: BookingOperationBase) => (
      mutation.mutateAsync(withMutationIds({
        bookingId,
        toStatus: 'no_show',
        expectedVersion,
        reasonCode: 'owner_marked_no_show',
      }, createId))
    ),
  };
}
