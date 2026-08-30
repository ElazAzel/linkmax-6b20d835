import type { Json } from '@/platform/supabase/types';
import { supabase } from '@/platform/supabase/client';
import type { BookingStatus } from '@/domain/revenue/booking-lifecycle';
import { calculateDepositAmount, type DepositConfiguration } from '@/domain/revenue/service-offering';

export interface PublicBookingContextService {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceAmount: string;
  currency: string;
  depositMode: DepositConfiguration['mode'];
  depositValue: string;
  depositRequiredAmount: string;
  paymentInstructions: string | Record<string, string> | null;
}

export interface PublicBookingContext {
  page: { id: string; slug: string; title: string };
  services: PublicBookingContextService[];
}

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
  locale?: string;
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
  expectedVersion: number;
  idempotencyKey: string;
  slotDate?: string | null;
  slotTime?: string | null;
  slotEndTime?: string | null;
}

export interface BookingManagementContext {
  id: string;
  serviceName: string;
  slotDate: string;
  slotTime: string;
  slotEndTime: string | null;
  timezone: string;
  status: BookingStatus;
  version: number;
  paymentStatus: string;
  depositRequiredAmount: string;
  paidAmount: string;
  currency: string;
  allowedActions: Array<'confirm' | 'cancel' | 'reschedule'>;
  ownerPagePath: string | null;
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
    public readonly details: { ownerPagePath?: string } = {},
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

export interface BookingOwnerDetail {
  bookingId: string;
  pageId: string;
  version: number;
  status: BookingStatus;
  statusReason: string | null;
  localStart: string;
  timezone: string;
  slotStarted: boolean;
  serviceName: string;
  serviceSnapshot: Json;
  client: {
    name: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
  };
  payment: {
    status: string;
    totalAmount: string;
    depositRequiredAmount: string;
    paidAmount: string;
    refundedAmount: string;
    currency: string;
    facts: Array<{
      kind: string;
      status: string;
      amount: string;
      currency: string;
      method: string;
      processingSource: string;
      confirmedAt: string | null;
      createdAt: string;
    }>;
  };
  attribution: {
    source: string;
    medium: string | null;
    campaign: string | null;
    referrerHost: string | null;
  };
  transitions: Array<{
    fromStatus: string | null;
    toStatus: string;
    actorType: string;
    reasonCode: string;
    occurredAt: string;
  }>;
  notifications: Array<{
    eventKind: 'delivered' | 'failed';
    recipientRole: string;
    channel: string;
    templateKey: string;
    errorCode: string | null;
    occurredAt: string;
  }>;
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

function optionalString(value: Json | undefined): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function optionalLocalizedText(value: Json | undefined): string | Record<string, string> | null {
  const literal = optionalString(value);
  if (literal) return literal;
  if (!isRecord(value)) return null;
  const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string');
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function throwResponseError(value: Json | undefined): never {
  if (isRecord(value) && value.ok === false) {
    throw new BookingLifecycleError(
      typeof value.code === 'string' ? value.code : 'request_failed',
      value.retryable === true,
      typeof value.ownerPagePath === 'string' ? { ownerPagePath: value.ownerPagePath } : {},
    );
  }
  throw new BookingLifecycleError('invalid_response', true);
}

const BOOKING_STATUSES: BookingStatus[] = [
  'pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show',
];

const MONEY_DECIMAL = /^\d+\.\d{2}$/;

function isNullableString(value: Json | undefined): value is string | null {
  return value === null || typeof value === 'string';
}

function isBookingOwnerDetail(value: Json | undefined): boolean {
  if (!isRecord(value) || value.ok !== true) return false;
  if (!requiredString(value.bookingId)
    || !requiredString(value.pageId)
    || !requiredVersion(value.version)
    || typeof value.status !== 'string'
    || !BOOKING_STATUSES.includes(value.status as BookingStatus)
    || !isNullableString(value.statusReason)
    || !requiredString(value.localStart)
    || !requiredString(value.timezone)
    || typeof value.slotStarted !== 'boolean'
    || !requiredString(value.serviceName)
    || !isRecord(value.serviceSnapshot)
    || !isRecord(value.client)
    || !isRecord(value.payment)
    || !isRecord(value.attribution)
    || !Array.isArray(value.transitions)
    || !Array.isArray(value.notifications)) return false;

  const client = value.client;
  const payment = value.payment;
  const attribution = value.attribution;
  if (!requiredString(client.name)
    || !isNullableString(client.phone)
    || !isNullableString(client.email)
    || !isNullableString(client.notes)
    || !requiredString(payment.status)
    || !requiredString(payment.currency)
    || ![payment.totalAmount, payment.depositRequiredAmount, payment.paidAmount, payment.refundedAmount]
      .every((amount) => typeof amount === 'string' && MONEY_DECIMAL.test(amount))
    || !Array.isArray(payment.facts)
    || !requiredString(attribution.source)
    || !isNullableString(attribution.medium)
    || !isNullableString(attribution.campaign)
    || !isNullableString(attribution.referrerHost)) return false;

  const factsValid = payment.facts.every((fact) => isRecord(fact)
    && requiredString(fact.kind)
    && requiredString(fact.status)
    && typeof fact.amount === 'string' && MONEY_DECIMAL.test(fact.amount)
    && requiredString(fact.currency)
    && requiredString(fact.method)
    && requiredString(fact.processingSource)
    && isNullableString(fact.confirmedAt)
    && requiredString(fact.createdAt));
  const transitionsValid = value.transitions.every((transition) => isRecord(transition)
    && isNullableString(transition.fromStatus)
    && requiredString(transition.toStatus)
    && requiredString(transition.actorType)
    && requiredString(transition.reasonCode)
    && requiredString(transition.occurredAt));
  const notificationsValid = value.notifications.every((notification) => isRecord(notification)
    && (notification.eventKind === 'delivered' || notification.eventKind === 'failed')
    && requiredString(notification.recipientRole)
    && requiredString(notification.channel)
    && requiredString(notification.templateKey)
    && isNullableString(notification.errorCode)
    && requiredString(notification.occurredAt));

  return factsValid && transitionsValid && notificationsValid;
}

export async function loadBookingOwnerDetail(bookingId: string): Promise<BookingOwnerDetail> {
  const { data, error } = await supabase.rpc('get_booking_owner_detail', {
    p_booking_id: bookingId,
  });
  if (error) throw new BookingLifecycleError('request_failed', true);
  if (!isBookingOwnerDetail(data)) throwResponseError(data);
  return data as unknown as BookingOwnerDetail;
}

export async function loadBookingManagementContext(token: string): Promise<BookingManagementContext> {
  const { data, error } = await supabase.rpc('get_booking_by_access_token', { p_token: token });
  if (error) throw new BookingLifecycleError('request_failed', true);
  if (!isRecord(data) || data.ok !== true) throwResponseError(data);
  if (!isRecord(data.booking)) throw new BookingLifecycleError('invalid_response', true);

  const booking = data.booking;
  const status = booking.status;
  const rawActions = booking.allowedActions;
  if (
    !requiredString(booking.id)
    || !requiredString(booking.serviceName)
    || !requiredString(booking.slotDate)
    || !requiredString(booking.slotTime)
    || !requiredString(booking.timezone)
    || typeof status !== 'string'
    || !BOOKING_STATUSES.includes(status as BookingStatus)
    || !requiredVersion(booking.version)
    || !requiredString(booking.paymentStatus)
    || typeof booking.depositRequiredAmount !== 'string'
    || typeof booking.paidAmount !== 'string'
    || !requiredString(booking.currency)
    || !Array.isArray(rawActions)
  ) {
    throw new BookingLifecycleError('invalid_response', true);
  }

  const allowedActions = rawActions.filter(
    (action): action is 'confirm' | 'cancel' | 'reschedule' => (
      action === 'confirm' || action === 'cancel' || action === 'reschedule'
    ),
  );

  return {
    id: booking.id,
    serviceName: booking.serviceName,
    slotDate: booking.slotDate,
    slotTime: booking.slotTime,
    slotEndTime: optionalString(booking.slotEndTime),
    timezone: booking.timezone,
    status: status as BookingStatus,
    version: booking.version,
    paymentStatus: booking.paymentStatus,
    depositRequiredAmount: booking.depositRequiredAmount,
    paidAmount: booking.paidAmount,
    currency: booking.currency,
    allowedActions,
    ownerPagePath: optionalString(booking.ownerPagePath),
  };
}

export async function loadBookingManagementAvailability(input: {
  token: string;
  fromDate: string;
  toDate: string;
}): Promise<PublicAvailabilitySlot[]> {
  const { data, error } = await supabase.rpc('get_booking_management_availability', {
    p_token: input.token,
    p_from_date: input.fromDate,
    p_to_date: input.toDate,
  });
  if (error) throw new BookingLifecycleError('request_failed', true);
  if (!isRecord(data) || data.ok !== true) throwResponseError(data);
  if (!Array.isArray(data.slots)) throw new BookingLifecycleError('invalid_response', true);

  return data.slots.map((raw) => {
    if (
      !isRecord(raw)
      || !requiredString(raw.date)
      || !requiredString(raw.time)
      || typeof raw.available !== 'boolean'
    ) {
      throw new BookingLifecycleError('invalid_response', true);
    }
    return {
      date: raw.date,
      time: raw.time,
      endTime: optionalString(raw.endTime),
      available: raw.available,
    };
  });
}

export async function loadPublicBookingContext(pageId: string): Promise<PublicBookingContext> {
  const { data, error } = await supabase.rpc('get_public_booking_context', { p_page_id: pageId });
  if (error) throw new BookingLifecycleError('request_failed', true);
  if (!isRecord(data) || data.ok !== true) throwResponseError(data);
  if (!isRecord(data.page) || !Array.isArray(data.services)) {
    throw new BookingLifecycleError('invalid_response', true);
  }

  const page = data.page;
  if (!requiredString(page.id) || !requiredString(page.slug) || !requiredString(page.title)) {
    throw new BookingLifecycleError('invalid_response', true);
  }

  const services = data.services.map((raw) => {
    if (!isRecord(raw)) throw new BookingLifecycleError('invalid_response', true);
    const mode = raw.depositMode;
    if (
      !requiredString(raw.id)
      || !requiredString(raw.name)
      || typeof raw.durationMinutes !== 'number'
      || typeof raw.priceAmount !== 'string'
      || !requiredString(raw.currency)
      || (mode !== 'none' && mode !== 'fixed' && mode !== 'percent')
      || typeof raw.depositValue !== 'string'
    ) {
      throw new BookingLifecycleError('invalid_response', true);
    }

    const depositRequiredAmount = typeof raw.depositRequiredAmount === 'string'
      ? raw.depositRequiredAmount
      : calculateDepositAmount({ mode, value: raw.depositValue }, raw.priceAmount);
    const depositMode = mode as DepositConfiguration['mode'];

    return {
      id: raw.id,
      name: raw.name,
      description: optionalString(raw.description),
      durationMinutes: raw.durationMinutes,
      priceAmount: raw.priceAmount,
      currency: raw.currency,
      depositMode,
      depositValue: raw.depositValue,
      depositRequiredAmount,
      paymentInstructions: optionalLocalizedText(raw.paymentInstructions),
    };
  });

  return {
    page: { id: page.id, slug: page.slug, title: page.title },
    services,
  };
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

  const booking: PublicBookingCreated = {
    bookingId: data.bookingId,
    status: data.status,
    version: data.version,
    paymentStatus: data.paymentStatus,
    depositRequiredAmount: data.depositRequiredAmount,
    currency: data.currency,
    accessToken: data.accessToken,
    idempotentReplay: data.idempotentReplay,
  };

  try {
    await supabase.functions?.invoke?.('send-booking-notification', {
      body: {
        bookingId: booking.bookingId,
        accessToken: booking.accessToken,
        locale: input.locale,
      },
    });
  } catch {
    // Booking is authoritative and must not roll back when notification enqueueing fails.
  }

  return booking;
}

export async function manageBookingWithToken(
  input: ManageBookingWithTokenInput,
): Promise<ManagedBookingResult> {
  const { data, error } = await supabase.rpc('manage_booking_by_access_token', {
    p_token: input.token,
    p_action: input.action,
    p_expected_version: input.expectedVersion,
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
