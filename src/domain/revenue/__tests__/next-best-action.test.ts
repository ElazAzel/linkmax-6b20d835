import { describe, expect, it } from 'vitest';

import { selectRevenueNextAction, type RevenueReadinessInput } from '../next-best-action';

const healthy: RevenueReadinessInput = {
  hasKit: true,
  activeServiceCount: 2,
  hasFutureAvailability: true,
  depositSelected: false,
  hasValidDepositInstructions: true,
  isPublished: true,
  attributedExternalVisitCount: 1,
  pendingPaymentCount: 0,
  pastAppointmentsNeedingReview: 0,
  upcomingUnacknowledgedCount: 0,
  qualifiedServiceViewCount: 0,
  bookingCount: 1,
};

describe('selectRevenueNextAction', () => {
  it('uses the ordered readiness and operational priority table', () => {
    expect(selectRevenueNextAction({ ...healthy, hasKit: false })).toMatchObject({
      id: 'start_revenue_kit', reasonCode: 'revenue_kit_missing',
    });
    expect(selectRevenueNextAction({ ...healthy, activeServiceCount: 0 })).toMatchObject({
      id: 'add_first_service', reasonCode: 'no_active_service',
    });
    expect(selectRevenueNextAction({ ...healthy, hasFutureAvailability: false })).toMatchObject({
      id: 'set_availability', reasonCode: 'no_future_availability',
    });
    expect(selectRevenueNextAction({
      ...healthy, depositSelected: true, hasValidDepositInstructions: false,
    })).toMatchObject({ id: 'configure_deposit', reasonCode: 'deposit_instructions_invalid' });
    expect(selectRevenueNextAction({ ...healthy, isPublished: false })).toMatchObject({
      id: 'publish_page', reasonCode: 'page_unpublished',
    });
    expect(selectRevenueNextAction({ ...healthy, attributedExternalVisitCount: 0 })).toMatchObject({
      id: 'copy_bio_link', reasonCode: 'no_attributed_external_visit',
    });
  });

  it('puts pending deposits ahead of past appointment review', () => {
    expect(selectRevenueNextAction({
      ...healthy,
      pendingPaymentCount: 2,
      pastAppointmentsNeedingReview: 1,
    })).toMatchObject({ id: 'confirm_pending_deposit', href: '/dashboard/activity?filter=pending_payment' });
  });

  it('reviews past appointments before sending upcoming confirmations', () => {
    expect(selectRevenueNextAction({
      ...healthy,
      pastAppointmentsNeedingReview: 1,
      upcomingUnacknowledgedCount: 2,
    })).toMatchObject({ id: 'review_past_appointments', reasonCode: 'past_appointment_unresolved' });
  });

  it('requires a qualified minimum sample before suggesting conversion work', () => {
    expect(selectRevenueNextAction({
      ...healthy,
      qualifiedServiceViewCount: 49,
      bookingCount: 0,
    })).toMatchObject({ id: 'open_outcome_insights' });
    expect(selectRevenueNextAction({
      ...healthy,
      qualifiedServiceViewCount: 50,
      bookingCount: 0,
    })).toMatchObject({ id: 'improve_booking_conversion', reasonCode: 'qualified_views_without_booking' });
  });

  it('falls back to one outcome-insights action', () => {
    expect(selectRevenueNextAction(healthy)).toEqual({
      id: 'open_outcome_insights',
      href: '/dashboard/insights?view=revenue',
      reasonCode: 'revenue_operations_healthy',
    });
  });
});
