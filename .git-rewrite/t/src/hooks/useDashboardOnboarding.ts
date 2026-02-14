import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Block } from '@/types/page';
import type { Niche } from '@/lib/niches';

import { storage } from '@/lib/storage';

const STORAGE_KEYS = {
  NICHE_COMPLETED: 'niche_onboarding_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

/** Minimum block count to skip AI onboarding (user already has content) */
const MIN_BLOCKS_TO_SKIP_ONBOARDING = 2;

interface OnboardingProfile {
  name: string;
  bio: string;
}

interface UseDashboardOnboardingOptions {
  isUserReady: boolean;
  isPageReady: boolean;
  /** Current block count on the page */
  blockCount: number;
  onNicheComplete: (profile: OnboardingProfile, blocks: Block[], niche: Niche) => void;
}

export function useDashboardOnboarding({
  isUserReady,
  isPageReady,
  blockCount,
  onNicheComplete,
}: UseDashboardOnboardingOptions) {
  const { t } = useTranslation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNicheOnboarding, setShowNicheOnboarding] = useState(false);

  // Check onboarding status on mount
  useEffect(() => {
    if (!isUserReady || !isPageReady) return;

    const hasCompletedNiche = storage.get<string>(STORAGE_KEYS.NICHE_COMPLETED);
    const hasCompletedOnboarding = storage.get<string>(STORAGE_KEYS.ONBOARDING_COMPLETED);

    // Skip AI builder onboarding if user already has content (more than 2 blocks)
    const hasExistingContent = blockCount > MIN_BLOCKS_TO_SKIP_ONBOARDING;

    if (hasExistingContent) {
      // Auto-mark as completed if user has content
      if (!hasCompletedNiche) {
        storage.set(STORAGE_KEYS.NICHE_COMPLETED, 'true');
      }
      if (!hasCompletedOnboarding) {
        storage.set(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      }
      return;
    }

    if (!hasCompletedNiche) {
      setTimeout(() => setShowNicheOnboarding(true), 500);
    } else if (!hasCompletedOnboarding) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, [isUserReady, isPageReady, blockCount]);

  const handleOnboardingComplete = useCallback(() => {
    storage.set(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    setShowOnboarding(false);
    toast.success(t('dashboard.onboardingComplete', 'Добро пожаловать! Начните создавать свою страницу.'));
  }, [t]);

  const handleOnboardingSkip = useCallback(() => {
    storage.set(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    setShowOnboarding(false);
  }, []);

  const handleNicheOnboardingClose = useCallback(() => {
    storage.set(STORAGE_KEYS.NICHE_COMPLETED, 'true');
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
