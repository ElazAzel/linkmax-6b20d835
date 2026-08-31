import { selectRevenueNextAction } from '@/domain/revenue/next-best-action';
import type { RevenueOutcomeSummary } from '@/services/revenue-outcomes';
import { AttentionQueue } from './AttentionQueue';
import { NextRevenueAction } from './NextRevenueAction';
import { OutcomeStrip } from './OutcomeStrip';

interface OutcomeHomeProps {
  summary: RevenueOutcomeSummary;
  onNavigate: (href: string) => void;
}

export function OutcomeHome({ summary, onNavigate }: OutcomeHomeProps) {
  const action = selectRevenueNextAction({
    hasKit: summary.readiness.hasKit,
    activeServiceCount: summary.readiness.activeServiceCount,
    hasFutureAvailability: summary.readiness.hasFutureAvailability,
    depositSelected: summary.readiness.depositSelected,
    hasValidDepositInstructions: summary.readiness.hasValidPaymentInstructions,
    isPublished: summary.readiness.isPublished,
    attributedExternalVisitCount: summary.readiness.attributedExternalVisitCount,
    pendingPaymentCount: summary.operations.pendingPayments.length,
    pastAppointmentsNeedingReview: summary.operations.pastAppointments.length,
    upcomingUnacknowledgedCount: summary.operations.upcomingUnacknowledged.length,
    qualifiedServiceViewCount: summary.funnel.serviceViewed,
    bookingCount: summary.funnel.bookingCreated,
  });

  return (
    <section className="space-y-4" data-testid="revenue-outcome-home" aria-label="Revenue outcomes">
      <OutcomeStrip summary={summary} />
      <NextRevenueAction action={action} onNavigate={onNavigate} />
      <AttentionQueue operations={summary.operations} onNavigate={onNavigate} />
    </section>
  );
}
