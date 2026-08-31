import { describe, expect, it } from 'vitest';

import { selectDashboardOnboardingWizard } from '../dashboard-onboarding';

describe('dashboard revenue kit routing', () => {
  it('keeps the existing AI builder when the flag is off', () => {
    expect(selectDashboardOnboardingWizard({
      beautyRevenueKitEnabled: false,
      signupNiche: 'nails',
    })).toEqual({ kind: 'ai-builder', initialNiche: 'beauty' });
  });

  it.each(['nails', 'lashes', 'brows'] as const)(
    'selects the revenue kit for an eligible %s signup',
    (signupNiche) => {
      expect(selectDashboardOnboardingWizard({
        beautyRevenueKitEnabled: true,
        signupNiche,
      })).toEqual({ kind: 'beauty-revenue-kit', initialNiche: signupNiche });
    },
  );

  it('does not divert an expert into the beauty flow', () => {
    expect(selectDashboardOnboardingWizard({
      beautyRevenueKitEnabled: true,
      signupNiche: 'expert',
    })).toEqual({ kind: 'ai-builder', initialNiche: 'expert' });
  });

  it('keeps the catch-all onboarding route unchanged', () => {
    expect(selectDashboardOnboardingWizard({
      beautyRevenueKitEnabled: true,
      signupNiche: undefined,
    })).toEqual({ kind: 'ai-builder', initialNiche: undefined });
  });
});
