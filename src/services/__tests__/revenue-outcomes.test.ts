import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabase } from '@/platform/supabase/client';
import { fetchRevenueOutcomeSummary } from '../revenue-outcomes';

vi.mock('@/platform/supabase/client', () => ({
  supabase: { rpc: vi.fn() },
}));

const fixture = {
  ok: true,
  pageId: 'page-1',
  period: { from: '2026-08-01', to: '2026-08-30', timezone: 'Asia/Almaty' },
  currency: 'KZT',
  outcome: {
    paidCompletedCount: 3,
    freeCompletedCount: 1,
    noShowCount: 1,
    pendingPaymentCount: 2,
    bookingCount: 8,
    collectedAmount: '27000.00',
    refundedAmount: '2000.00',
    netCollectedAmount: '25000.00',
    pendingPaymentAmount: '4000.00',
  },
  operations: { pendingPayments: [], pastAppointments: [], upcomingUnacknowledged: [] },
  readiness: {
    hasKit: true,
    isPublished: true,
    activeServiceCount: 2,
    hasFutureAvailability: true,
    depositSelected: true,
    hasValidPaymentInstructions: true,
    hasMixedCurrencies: false,
    attributedExternalVisitCount: 10,
  },
  funnel: {
    serviceViewed: 30,
    bookingStarted: 12,
    bookingCreated: 8,
    bookingPaid: 5,
    bookingCompleted: 4,
  },
  bySource: [{
    source: 'instagram',
    serviceViewed: 20,
    bookingStarted: 9,
    bookingCreated: 6,
    bookingPaid: 4,
    bookingCompleted: 3,
    netCollectedAmount: '19000.00',
    currency: 'KZT',
  }],
  metadata: {
    generatedAt: '2026-08-30T12:00:00.000Z',
    provisionalCompletionDays: 7,
    provisionalFrom: '2026-08-24',
    moneySource: 'booking_payment_ledger_projection',
  },
} as const;

describe('revenue outcome service', () => {
  beforeEach(() => vi.mocked(supabase.rpc).mockReset());

  it('accepts and returns the complete literal server contract', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: fixture, error: null } as never);

    await expect(fetchRevenueOutcomeSummary('page-1', '2026-08-01', '2026-08-30'))
      .resolves.toEqual({ ok: true, value: fixture });
    expect(supabase.rpc).toHaveBeenCalledWith('get_revenue_outcome_summary', {
      p_page_id: 'page-1',
      p_from: '2026-08-01',
      p_to: '2026-08-30',
    });
  });

  it('rejects malformed decimal values at the adapter boundary', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        ...fixture,
        outcome: { ...fixture.outcome, netCollectedAmount: 25000 },
      },
      error: null,
    } as never);

    await expect(fetchRevenueOutcomeSummary('page-1', '2026-08-01', '2026-08-30'))
      .resolves.toEqual({ ok: false, error: 'invalid_outcome_summary' });
  });

  it('preserves a stable server denial code', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: { ok: false, code: 'not_allowed' },
      error: null,
    } as never);

    await expect(fetchRevenueOutcomeSummary('page-1', '2026-08-01', '2026-08-30'))
      .resolves.toEqual({ ok: false, error: 'not_allowed' });
  });
});
