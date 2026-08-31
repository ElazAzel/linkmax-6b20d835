export type RevenueNextActionId =
  | 'start_revenue_kit'
  | 'add_first_service'
  | 'set_availability'
  | 'configure_deposit'
  | 'publish_page'
  | 'copy_bio_link'
  | 'confirm_pending_deposit'
  | 'review_past_appointments'
  | 'send_upcoming_confirmation'
  | 'improve_booking_conversion'
  | 'open_outcome_insights';

export interface RevenueReadinessInput {
  hasKit: boolean;
  activeServiceCount: number;
  hasFutureAvailability: boolean;
  depositSelected: boolean;
  hasValidDepositInstructions: boolean;
  isPublished: boolean;
  attributedExternalVisitCount: number;
  pendingPaymentCount: number;
  pastAppointmentsNeedingReview: number;
  upcomingUnacknowledgedCount: number;
  qualifiedServiceViewCount: number;
  bookingCount: number;
}

export interface RevenueNextAction {
  id: RevenueNextActionId;
  href: string;
  reasonCode: string;
}

export function selectRevenueNextAction(input: RevenueReadinessInput): RevenueNextAction {
  if (!input.hasKit) {
    return {
      id: 'start_revenue_kit',
      href: '/dashboard/home?tab=editor&revenueKit=beauty-v1',
      reasonCode: 'revenue_kit_missing',
    };
  }
  if (input.activeServiceCount < 1) {
    return {
      id: 'add_first_service',
      href: '/dashboard/home?tab=editor&revenueKit=beauty-v1&step=services',
      reasonCode: 'no_active_service',
    };
  }
  if (!input.hasFutureAvailability) {
    return {
      id: 'set_availability',
      href: '/dashboard/home?tab=editor&revenueKit=beauty-v1&step=availability',
      reasonCode: 'no_future_availability',
    };
  }
  if (input.depositSelected && !input.hasValidDepositInstructions) {
    return {
      id: 'configure_deposit',
      href: '/dashboard/home?tab=editor&revenueKit=beauty-v1&step=deposit-policy',
      reasonCode: 'deposit_instructions_invalid',
    };
  }
  if (!input.isPublished) {
    return {
      id: 'publish_page',
      href: '/dashboard/home?tab=editor&action=publish',
      reasonCode: 'page_unpublished',
    };
  }
  if (input.attributedExternalVisitCount < 1) {
    return {
      id: 'copy_bio_link',
      href: '/dashboard/home?action=share',
      reasonCode: 'no_attributed_external_visit',
    };
  }
  if (input.pendingPaymentCount > 0) {
    return {
      id: 'confirm_pending_deposit',
      href: '/dashboard/activity?filter=pending_payment',
      reasonCode: 'pending_deposit_requires_review',
    };
  }
  if (input.pastAppointmentsNeedingReview > 0) {
    return {
      id: 'review_past_appointments',
      href: '/dashboard/activity?filter=past_confirmed',
      reasonCode: 'past_appointment_unresolved',
    };
  }
  if (input.upcomingUnacknowledgedCount > 0) {
    return {
      id: 'send_upcoming_confirmation',
      href: '/dashboard/activity?filter=confirmation_due',
      reasonCode: 'upcoming_confirmation_due',
    };
  }
  if (input.qualifiedServiceViewCount >= 50 && input.bookingCount === 0) {
    return {
      id: 'improve_booking_conversion',
      href: '/dashboard/insights?view=revenue&focus=booking_conversion',
      reasonCode: 'qualified_views_without_booking',
    };
  }
  return {
    id: 'open_outcome_insights',
    href: '/dashboard/insights?view=revenue',
    reasonCode: 'revenue_operations_healthy',
  };
}
