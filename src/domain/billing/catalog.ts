export type BillingPeriodMonths = 3 | 6 | 12;
type BillingTier = 'free' | 'identity' | 'starter' | 'pro' | 'business';

const PRO_PERIODS = [3, 6, 12] as const satisfies readonly BillingPeriodMonths[];

export const BILLING_CATALOG = {
  pro: {
    periods: PRO_PERIODS,
    pricesKzt: {
      3: 13_050,
      6: 22_185,
      12: 36_540,
    },
  },
  commissionRates: {
    free: 0,
    identity: 0,
    starter: 0.07,
    pro: 0.01,
    business: 0,
  },
} as const satisfies {
  pro: {
    periods: readonly BillingPeriodMonths[];
    pricesKzt: Record<BillingPeriodMonths, number>;
  };
  commissionRates: Record<BillingTier, number>;
};

export function getProPrice(period: BillingPeriodMonths) {
  const totalKzt = BILLING_CATALOG.pro.pricesKzt[period];

  return {
    months: period,
    monthlyKzt: Math.round(totalKzt / period),
    totalKzt,
  } as const;
}

export function getPlanCommissionRate(tier: BillingTier): number {
  return BILLING_CATALOG.commissionRates[tier];
}
