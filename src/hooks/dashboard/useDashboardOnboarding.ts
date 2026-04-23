import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Block } from '@/types/page';
import type { Niche } from '@/lib/niches';

import { storage } from '@/lib/storage';

const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
  // Legacy keys read for backwards compatibility (existing users)
  LEGACY_AI_BUILDER_USED: 'ai_builder_used',
  LEGACY_NICHE_COMPLETED: 'niche_onboarding_completed',
  LEGACY_LINKMAX_COMPLETED: 'linkmax_onboarding_completed',
} as const;

/** Minimum block count to skip onboarding (user already has content) */
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
  const [showAIBuilderWizard, setShowAIBuilderWizard] = useState(false);

  // Check onboarding status on mount — show wizard ONLY for brand-new users
  useEffect(() => {
    if (!isUserReady || !isPageReady) return;

    // Read unified key + any legacy keys (for users who completed onboarding before refactor)
    const completed =
      storage.get<string>(STORAGE_KEYS.ONBOARDING_COMPLETED) ||
      storage.get<string>(STORAGE_KEYS.LEGACY_AI_BUILDER_USED) ||
      storage.get<string>(STORAGE_KEYS.LEGACY_NICHE_COMPLETED) ||
      storage.get<string>(STORAGE_KEYS.LEGACY_LINKMAX_COMPLETED);

    // Skip if user already has content (more than 2 blocks)
    const hasExistingContent = blockCount > MIN_BLOCKS_TO_SKIP_ONBOARDING;

    if (hasExistingContent || completed) {
      // Migrate to single unified key
      if (!storage.get<string>(STORAGE_KEYS.ONBOARDING_COMPLETED)) {
        storage.set(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      }
      return;
    }

    // New user with no content — show AI Builder wizard
    setTimeout(() => setShowAIBuilderWizard(true), 500);
  }, [isUserReady, isPageReady, blockCount]);

  const handleAIBuilderClose = useCallback(() => {
    storage.set(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    setShowAIBuilderWizard(false);
  }, []);

  const handleAIBuilderComplete = useCallback(
    (profile: OnboardingProfile, blocks: Block[], niche: Niche) => {
      onNicheComplete(profile, blocks, niche);
      storage.set(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      setShowAIBuilderWizard(false);
    },
    [onNicheComplete]
  );

  // Manual open from settings (for existing users)
  const openAIBuilderFromSettings = useCallback(() => {
    setShowAIBuilderWizard(true);
  }, []);

  return {
    showAIBuilderWizard,
    handleAIBuilderClose,
    handleAIBuilderComplete,
    openAIBuilderFromSettings,
  };
}
