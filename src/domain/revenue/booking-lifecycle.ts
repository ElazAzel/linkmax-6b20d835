export type BookingStatus = 'pending_payment' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface BookingTransitionOptions {
  privilegedCorrection?: boolean;
  reason?: string;
}

export const BOOKING_TRANSITIONS = {
  pending_payment: ['confirmed', 'cancelled'],
  confirmed: ['confirmed', 'completed', 'cancelled', 'no_show'],
  completed: ['confirmed'],
  cancelled: [],
  no_show: ['confirmed'],
} as const satisfies Readonly<Record<BookingStatus, readonly BookingStatus[]>>;

const CORRECTABLE_TERMINAL_STATUSES = new Set<BookingStatus>(['completed', 'no_show']);

export function canTransitionBooking(
  fromStatus: BookingStatus,
  toStatus: BookingStatus,
  options: BookingTransitionOptions = {},
): boolean {
  const isDeclared = (BOOKING_TRANSITIONS[fromStatus] as readonly BookingStatus[]).includes(toStatus);

  if (!isDeclared) {
    return false;
  }

  if (!CORRECTABLE_TERMINAL_STATUSES.has(fromStatus)) {
    return true;
  }

  return options.privilegedCorrection === true && Boolean(options.reason?.trim());
}
