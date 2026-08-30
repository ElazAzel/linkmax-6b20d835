import type { Json } from '@/platform/supabase/types';
import { supabase } from '@/platform/supabase/client';
import type { BookingStatus } from '@/domain/revenue/booking-lifecycle';

export interface PublicAvailabilitySlot {
  date: string;
  time: string;
  endTime: string | null;
  available: boolean;
}

export interface PublicBookingCreated {
  bookingId: string;
  status: 'pending_payment' | 'confirmed';
  version: number;
  paymentStatus: string;
  depositRequiredAmount: string;
  currency: string;
  accessToken: string | null;
  idempotentReplay: boolean;
}

export interface CreatePublicBookingInput {
  pageId: string;
  blockId: string;
  serviceOfferingId: string | null;
  slotDate: string;
  slotTime: string;
  staffId: string | null;
  client: {
    name: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
  };
  bookingTimezone: string;
  attribution: Record<string, string | number | boolean | null>;
  idempotencyKey: string;
}

export interface LoadPublicAvailabilityInput {
  pageId: string;
  blockId: string;
  fromDate: string;
  toDate: string;
  staffId: string | null;
}

export interface ManageBookingWithTokenInput {
  token: string;
  action: 'confirm' | 'cancel' | 'reschedule';
  idempotencyKey: string;
  slotDate?: string | null;
  slotTime?: string | null;
  slotEndTime?: string | null;
}

export interface ManagedBookingResult {
  bookingId: string;
  status: BookingStatus;
  version: number;
  idempotentReplay: boolean;
}

export class BookingLifecycleError extends Error {
  constructor(
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(code);
    this.name = 'BookingLifecycleError';
  }
}

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

function requiredString(value: Json | undefined): value is string {
  return typeof value === 'string' && value.length > 0;
}

function requiredVersion(value: Json | undefined): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function throwResponseError(value: Json | undefined): never {
  if (isRecord(value) && value.ok === false) {
    throw new BookingLifecycleError(
      typeof value.code === 'string' ? value.code : 'request_failed',
      value.retryable === true,
    );
  }
  throw new BookingLifecycleError('invalid_response', true);
}

export async function loadPublicAvailability(
  input: LoadPublicAvailabilityInput,
): Promise<PublicAvailabilitySlot[]> {
  const { data, error } = await supabase.rpc('get_public_availability', {
    p_page_id: input.pageId,
    p_block_id: input.blockId,
    p_from_date: input.fromDate,
    p_to_date: input.toDate,
    p_staff_id: input.staffId,
  });

  if (error) throw new BookingLifecycleError('request_failed', true);
  if (!Array.isArray(data)) throw new BookingLifecycleError('invalid_response', true);

  return data.map((slot) => ({
    date: slot.slot_date,
    time: slot.slot_time,
    endTime: slot.slot_end_time,
    available: slot.available,
  }));
}

export async function createPublicBooking(
  input: CreatePublicBookingInput,
): Promise<PublicBookingCreated> {
  const { data, error } = await supabase.rpc('create_public_booking', {
    p_page_id: input.pageId,
    p_block_id: input.blockId,
    p_service_offering_id: input.serviceOfferingId,
    p_slot_date: input.slotDate,
    p_slot_time: input.slotTime,
    p_staff_id: input.staffId,
    p_client_name: input.client.name,
    p_client_phone: input.client.phone,
    p_client_email: input.client.email,
    p_client_notes: input.client.notes,
    p_booking_timezone: input.bookingTimezone,
    p_attribution: input.attribution,
    p_idempotency_key: input.idempotencyKey,
  });

  if (error) throw new BookingLifecycleError('request_failed', true);
  if (!isRecord(data) || data.ok !== true) throwResponseError(data);

  if (
    !requiredString(data.bookingId)
    || (data.status !== 'pending_payment' && data.status !== 'confirmed')
    || !requiredVersion(data.version)
    || !requiredString(data.paymentStatus)
    || typeof data.depositRequiredAmount !== 'string'
    || !requiredString(data.currency)
    || (data.accessToken !== null && typeof data.accessToken !== 'string')
    || typeof data.idempotentReplay !== 'boolean'
  ) {
    throw new BookingLifecycleError('invalid_response', true);
  }

  return {
    bookingId: data.bookingId,
    status: data.status,
    version: data.version,
    paymentStatus: data.paymentStatus,
    depositRequiredAmount: data.depositRequiredAmount,
    currency: data.currency,
    accessToken: data.accessToken,
    idempotentReplay: data.idempotentReplay,
  };
}

export async function manageBookingWithToken(
  input: ManageBookingWithTokenInput,
): Promise<ManagedBookingResult> {
  const { data, error } = await supabase.rpc('manage_booking_by_access_token', {
    p_token: input.token,
    p_action: input.action,
    p_idempotency_key: input.idempotencyKey,
    p_slot_date: input.slotDate ?? null,
    p_slot_time: input.slotTime ?? null,
    p_slot_end_time: input.slotEndTime ?? null,
  });

  if (error) throw new BookingLifecycleError('request_failed', true);
  if (!isRecord(data) || data.ok !== true) throwResponseError(data);

  if (
    !requiredString(data.bookingId)
    || !requiredString(data.status)
    || !requiredVersion(data.version)
    || typeof data.idempotentReplay !== 'boolean'
  ) {
    throw new BookingLifecycleError('invalid_response', true);
  }

  return {
    bookingId: data.bookingId,
    status: data.status as BookingStatus,
    version: data.version,
    idempotentReplay: data.idempotentReplay,
  };
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
