export const REVENUE_EVENTS = {
  revenueKitStarted: 'revenue_kit_started',
  revenueKitStepCompleted: 'revenue_kit_step_completed',
  revenueKitApplied: 'revenue_kit_applied',
  pagePublished: 'page_published',
  bioLinkCopied: 'bio_link_copied',
  serviceViewed: 'service_viewed',
  bookingStarted: 'booking_started',
  bookingSlotSelected: 'booking_slot_selected',
  bookingDetailsSubmitted: 'booking_details_submitted',
  bookingCreated: 'booking_created',
  depositInstructionsViewed: 'deposit_instructions_viewed',
  depositPaymentStarted: 'deposit_payment_started',
  depositPaymentSucceeded: 'deposit_payment_succeeded',
  depositPaymentManuallyConfirmed: 'deposit_payment_manually_confirmed',
  bookingConfirmed: 'booking_confirmed',
  reminderQueued: 'reminder_queued',
  reminderDelivered: 'reminder_delivered',
  customerAttendanceConfirmed: 'customer_attendance_confirmed',
  bookingRescheduled: 'booking_rescheduled',
  bookingCancelled: 'booking_cancelled',
  bookingCompleted: 'booking_completed',
  bookingNoShow: 'booking_no_show',
  bookingPaymentRecorded: 'booking_payment_recorded',
  bookingRefundRecorded: 'booking_refund_recorded',
  outcomeDashboardViewed: 'outcome_dashboard_viewed',
  nextBestActionClicked: 'next_best_action_clicked',
} as const;

export type RevenueEventName = (typeof REVENUE_EVENTS)[keyof typeof REVENUE_EVENTS];

export interface RevenueEventEnvelope {
  taxonomyVersion: 2;
  eventId: string;
  eventName: RevenueEventName;
  occurredAt: string;
  actorType: 'visitor' | 'creator' | 'system' | 'provider';
  userId: string | null;
  pageId: string;
  serviceOfferingId: string | null;
  bookingId: string | null;
  visitorId: string | null;
  sessionId: string | null;
  source: 'client' | 'edge' | 'system';
  properties: Record<string, string | number | boolean | null>;
}

const AUTHORITATIVE_REVENUE_EVENTS: ReadonlySet<string> = new Set([
  REVENUE_EVENTS.bookingCreated,
  REVENUE_EVENTS.depositPaymentSucceeded,
  REVENUE_EVENTS.depositPaymentManuallyConfirmed,
  REVENUE_EVENTS.bookingConfirmed,
  REVENUE_EVENTS.reminderQueued,
  REVENUE_EVENTS.reminderDelivered,
  REVENUE_EVENTS.bookingRescheduled,
  REVENUE_EVENTS.bookingCancelled,
  REVENUE_EVENTS.bookingCompleted,
  REVENUE_EVENTS.bookingNoShow,
  REVENUE_EVENTS.bookingPaymentRecorded,
  REVENUE_EVENTS.bookingRefundRecorded,
]);

export function isAuthoritativeRevenueEvent(eventName: string): eventName is RevenueEventName {
  return AUTHORITATIVE_REVENUE_EVENTS.has(eventName);
}
