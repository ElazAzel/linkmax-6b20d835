import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Block } from '@/types/page';
import type { Niche } from '@/lib/niches';

const STORAGE_KEYS = {
  NICHE_COMPLETED: 'linkmax_niche_onboarding_completed',
  ONBOARDING_COMPLETED: 'linkmax_onboarding_completed',
} as const;

interface OnboardingProfile {
  name: string;
  bio: string;
}

interface UseDashboardOnboardingOptions {
  isUserReady: boolean;
  isPageReady: boolean;
  onNicheComplete: (profile: OnboardingProfile, blocks: Block[], niche: Niche) => void;
}

export function useDashboardOnboarding({
  isUserReady,
  isPageReady,
  onNicheComplete,
}: UseDashboardOnboardingOptions) {
  const { t } = useTranslation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNicheOnboarding, setShowNicheOnboarding] = useState(false);

  // Check onboarding status on mount
  useEffect(() => {
    if (!isUserReady || !isPageReady) return;

    const hasCompletedNiche = localStorage.getItem(STORAGE_KEYS.NICHE_COMPLETED);
    const hasCompletedOnboarding = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);

    if (!hasCompletedNiche) {
      setTimeout(() => setShowNicheOnboarding(true), 500);
    } else if (!hasCompletedOnboarding) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, [isUserReady, isPageReady]);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    setShowOnboarding(false);
    toast.success(t('dashboard.onboardingComplete', 'Добро пожаловать! Начните создавать свою страницу.'));
  }, [t]);

  const handleOnboardingSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    setShowOnboarding(false);
  }, []);

  const handleNicheOnboardingClose = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.NICHE_COMPLETED, 'true');
    setShowNicheOnboarding(false);
  }, []);

  const handleNicheOnboardingComplete = useCallback(
    (profile: OnboardingProfile, blocks: Block[], niche: Niche) => {
      onNicheComplete(profile, blocks, niche);
      setShowNicheOnboarding(false);
      setTimeout(() => setShowOnboarding(true), 500);
    },
    [onNicheComplete]
  );

  return {
    showOnboarding,
    showNicheOnboarding,
    handleOnboardingComplete,
    handleOnboardingSkip,
    handleNicheOnboardingClose,
    handleNicheOnboardingComplete,
  };
}
