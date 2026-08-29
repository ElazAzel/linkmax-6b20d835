import type { Json } from '@/platform/supabase/types';
import { supabase } from '@/platform/supabase/client';
import type { BookingStatus } from '@/domain/revenue/booking-lifecycle';

export type BookingMutationResult =
  | { ok: true; bookingId: string; status: BookingStatus; version: number }
  | { ok: false; code: string; retryable: boolean; currentVersion?: number };

export type BookingPaymentMethod =
  | 'kaspi_manual'
  | 'cash'
  | 'manual_card'
  | 'bank_transfer'
  | 'other';

export interface TransitionBookingInput {
  bookingId: string;
  toStatus: BookingStatus;
  expectedVersion: number;
  reasonCode: string;
  idempotencyKey: string;
  paymentAmount?: string;
  paymentMethod?: BookingPaymentMethod;
  paymentIdempotencyKey?: string;
  waivePayment?: boolean;
  privilegedCorrection?: boolean;
}

function isRecord(value: Json | undefined): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeResult(value: Json | undefined): BookingMutationResult {
  if (!isRecord(value)) {
    return { ok: false, code: 'invalid_response', retryable: true };
  }

  if (value.ok === true && typeof value.bookingId === 'string' && typeof value.status === 'string') {
    const version = typeof value.version === 'number' ? value.version : Number(value.version);

    if (Number.isInteger(version) && version > 0) {
      return {
        ok: true,
        bookingId: value.bookingId,
        status: value.status as BookingStatus,
        version,
      };
    }
  }

  return {
    ok: false,
    code: typeof value.code === 'string' ? value.code : 'invalid_response',
    retryable: value.retryable === true,
    ...(typeof value.currentVersion === 'number' ? { currentVersion: value.currentVersion } : {}),
  };
}

export async function transitionBooking(input: TransitionBookingInput): Promise<BookingMutationResult> {
  const { data, error } = await supabase.rpc('transition_booking', {
    p_booking_id: input.bookingId,
    p_to_status: input.toStatus,
    p_expected_version: input.expectedVersion,
    p_reason_code: input.reasonCode,
    p_idempotency_key: input.idempotencyKey,
    p_payment_amount: input.paymentAmount ?? null,
    p_payment_method: input.paymentMethod ?? null,
    p_payment_idempotency_key: input.paymentIdempotencyKey ?? null,
    p_waive_payment: input.waivePayment ?? false,
    p_privileged_correction: input.privilegedCorrection ?? false,
    p_actor_type: 'owner',
  });

  if (error) {
    return { ok: false, code: 'request_failed', retryable: true };
  }

  return normalizeResult(data);
}
