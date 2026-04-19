import { useState, useEffect, useCallback } from 'react';
import type { Block } from '@/types/page';
import type { Niche } from '@/lib/niches';

import { storage } from '@/lib/storage';

const STORAGE_KEYS = {
  AI_BUILDER_USED: 'ai_builder_used',
  SMART_BUILDER_USED: 'smart_builder_used',
  NICHE_COMPLETED: 'niche_onboarding_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

/** Minimum block count to skip onboarding (user already has content). */
const MIN_BLOCKS_TO_SKIP_ONBOARDING = 2;

interface OnboardingProfile {
  name: string;
  bio: string;
}

interface UseDashboardOnboardingOptions {
  isUserReady: boolean;
  isPageReady: boolean;
  userId?: string | null;
  /** Current block count on the page. */
  blockCount: number;
  onNicheComplete: (profile: OnboardingProfile, blocks: Block[], niche: Niche) => void;
}

function getScopedKey(userId: string | null | undefined, key: string): string {
  return userId ? `user:${userId}:${key}` : key;
}

function getScopedFlag(userId: string | null | undefined, key: string): string | null {
  return storage.get<string>(getScopedKey(userId, key));
}

function setScopedFlag(userId: string | null | undefined, key: string): void {
  storage.set(getScopedKey(userId, key), 'true');
}

export function useDashboardOnboarding({
  isUserReady,
  isPageReady,
  userId,
  blockCount,
  onNicheComplete,
}: UseDashboardOnboardingOptions) {
  const [showAIBuilderWizard, setShowAIBuilderWizard] = useState(false);

  useEffect(() => {
    if (!isUserReady || !isPageReady) return;

    const hasUsedBuilder = getScopedFlag(userId, STORAGE_KEYS.SMART_BUILDER_USED)
      || getScopedFlag(userId, STORAGE_KEYS.AI_BUILDER_USED);
    const hasCompletedNiche = getScopedFlag(userId, STORAGE_KEYS.NICHE_COMPLETED);
    const hasCompletedOnboarding = getScopedFlag(userId, STORAGE_KEYS.ONBOARDING_COMPLETED);
    const hasExistingContent = blockCount > MIN_BLOCKS_TO_SKIP_ONBOARDING;

    if (hasExistingContent || hasUsedBuilder || hasCompletedNiche || hasCompletedOnboarding) {
      if (!hasCompletedNiche) setScopedFlag(userId, STORAGE_KEYS.NICHE_COMPLETED);
      if (!hasCompletedOnboarding) setScopedFlag(userId, STORAGE_KEYS.ONBOARDING_COMPLETED);
      return;
    }

    const timer = window.setTimeout(() => setShowAIBuilderWizard(true), 500);
    return () => window.clearTimeout(timer);
  }, [isUserReady, isPageReady, userId, blockCount]);

  const handleAIBuilderClose = useCallback(() => {
    setScopedFlag(userId, STORAGE_KEYS.NICHE_COMPLETED);
    setScopedFlag(userId, STORAGE_KEYS.ONBOARDING_COMPLETED);
    setShowAIBuilderWizard(false);
  }, [userId]);

  const handleAIBuilderComplete = useCallback(
    (profile: OnboardingProfile, blocks: Block[], niche: Niche) => {
      onNicheComplete(profile, blocks, niche);
      setScopedFlag(userId, STORAGE_KEYS.SMART_BUILDER_USED);
      setScopedFlag(userId, STORAGE_KEYS.AI_BUILDER_USED);
      setScopedFlag(userId, STORAGE_KEYS.NICHE_COMPLETED);
      setScopedFlag(userId, STORAGE_KEYS.ONBOARDING_COMPLETED);
      setShowAIBuilderWizard(false);
    },
    [onNicheComplete, userId]
  );

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
