import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { RevenueOutcomeSummary } from '@/services/revenue-outcomes';
import { OutcomeHome } from '../OutcomeHome';

function summary(
  overrides: Partial<RevenueOutcomeSummary> = {},
): RevenueOutcomeSummary {
  return {
    ok: true,
    pageId: 'page-1',
    period: { from: '2026-08-01', to: '2026-08-30', timezone: 'Asia/Almaty' },
    currency: 'KZT',
    outcome: {
      paidCompletedCount: 2,
      freeCompletedCount: 0,
      noShowCount: 0,
      pendingPaymentCount: 0,
      bookingCount: 2,
      collectedAmount: '12000.00',
      refundedAmount: '0.00',
      netCollectedAmount: '12000.00',
      pendingPaymentAmount: '0.00',
    },
    operations: { pendingPayments: [], pastAppointments: [], upcomingUnacknowledged: [] },
    readiness: {
      hasKit: true,
      isPublished: true,
      activeServiceCount: 2,
      hasFutureAvailability: true,
      depositSelected: false,
      hasValidPaymentInstructions: true,
      hasMixedCurrencies: false,
      attributedExternalVisitCount: 4,
    },
    funnel: {
      serviceViewed: 10,
      bookingStarted: 5,
      bookingCreated: 2,
      bookingPaid: 2,
      bookingCompleted: 2,
    },
    bySource: [],
    metadata: {
      generatedAt: '2026-08-30T12:00:00Z',
      provisionalCompletionDays: 7,
      provisionalFrom: '2026-08-24',
      moneySource: 'booking_payment_ledger_projection',
    },
    ...overrides,
  };
}

function operation(id: string, status: 'pending_payment' | 'confirmed') {
  return {
    bookingId: id,
    version: 1,
    status,
    localStart: '2026-08-30T12:00:00',
    timezone: 'Asia/Almaty',
    serviceName: 'Маникюр',
    totalAmount: '7000.00',
    depositRequiredAmount: '2000.00',
    paidAmount: '0.00',
    refundedAmount: '0.00',
    currency: 'KZT',
    attributionSource: 'instagram',
  } as const;
}

describe('OutcomeHome', () => {
  it('renders one outcome, one next action, and one operational queue', () => {
    render(<OutcomeHome summary={summary()} onNavigate={vi.fn()} />);

    expect(screen.getAllByTestId('revenue-outcome-strip')).toHaveLength(1);
    expect(screen.getAllByTestId('revenue-next-action')).toHaveLength(1);
    expect(screen.getAllByTestId('revenue-attention-queue')).toHaveLength(1);
    expect(screen.getByTestId('revenue-outcome-home')).not.toHaveTextContent(/SEO|просмотр страницы/i);
  });

  it('gives a new user one setup CTA instead of a zero-heavy financial dashboard', () => {
    const empty = summary({
      outcome: {
        paidCompletedCount: 0,
        freeCompletedCount: 0,
        noShowCount: 0,
        pendingPaymentCount: 0,
        bookingCount: 0,
        collectedAmount: '0.00',
        refundedAmount: '0.00',
        netCollectedAmount: '0.00',
        pendingPaymentAmount: '0.00',
      },
      readiness: {
        ...summary().readiness,
        hasKit: false,
        activeServiceCount: 0,
        hasFutureAvailability: false,
        isPublished: false,
        attributedExternalVisitCount: 0,
      },
    });

    render(<OutcomeHome summary={empty} onNavigate={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Настроить запись' })).toBeInTheDocument();
    expect(screen.queryByText('0 ₸')).not.toBeInTheDocument();
  });

  it('prioritizes pending deposits while keeping both operational groups visible', () => {
    const pending = operation('booking-pending', 'pending_payment');
    const past = operation('booking-past', 'confirmed');
    const data = summary({
      outcome: { ...summary().outcome, pendingPaymentCount: 1, pendingPaymentAmount: '2000.00' },
      operations: {
        pendingPayments: [pending],
        pastAppointments: [past],
        upcomingUnacknowledged: [],
      },
    });

    render(<OutcomeHome summary={data} onNavigate={vi.fn()} />);

    expect(within(screen.getByTestId('revenue-next-action'))
      .getByRole('button', { name: 'Проверить предоплату' })).toBeInTheDocument();
    const queue = within(screen.getByTestId('revenue-attention-queue'));
    expect(queue.getByText('Ожидают предоплату')).toBeInTheDocument();
    expect(queue.getByText('Прошедшие без результата')).toBeInTheDocument();
  });
});
