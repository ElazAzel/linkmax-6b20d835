import { BEAUTY_NICHES, type BeautyNiche } from '@/domain/revenue-kits/beauty-v1';
import type { Niche } from '@/lib/niches';

export type SignupNiche = Niche | BeautyNiche;

type DashboardOnboardingSelection =
  | { kind: 'beauty-revenue-kit'; initialNiche: BeautyNiche }
  | { kind: 'ai-builder'; initialNiche: Niche | undefined };

interface SelectDashboardOnboardingWizardOptions {
  beautyRevenueKitEnabled: boolean;
  signupNiche?: SignupNiche;
}

export function isBeautyRevenueKitNiche(niche: string | undefined): niche is BeautyNiche {
  return BEAUTY_NICHES.includes(niche as BeautyNiche);
}

export function selectDashboardOnboardingWizard({
  beautyRevenueKitEnabled,
  signupNiche,
}: SelectDashboardOnboardingWizardOptions): DashboardOnboardingSelection {
  if (beautyRevenueKitEnabled && isBeautyRevenueKitNiche(signupNiche)) {
    return { kind: 'beauty-revenue-kit', initialNiche: signupNiche };
  }

  return {
    kind: 'ai-builder',
    initialNiche: isBeautyRevenueKitNiche(signupNiche) ? 'beauty' : signupNiche,
  };
}
