import { useState, useEffect, useCallback } from 'react';
import type { Block } from '@/types/page';
import { NICHES, type Niche } from '@/lib/niches';

import { storage } from '@/lib/storage';

const STORAGE_KEYS = {
  AI_BUILDER_USED: 'ai_builder_used',
  SMART_BUILDER_USED: 'smart_builder_used',
  NICHE_COMPLETED: 'niche_onboarding_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_DISMISSED_AT: 'onboarding_dismissed_at',
  // Legacy keys read for backwards compatibility (existing users)
  LEGACY_AI_BUILDER_USED: 'ai_builder_used',
  LEGACY_NICHE_COMPLETED: 'niche_onboarding_completed',
  LEGACY_LINKMAX_COMPLETED: 'linkmax_onboarding_completed',
} as const;

const SIGNUP_CONTEXT_KEYS = {
  from: 'lnkmx_signup_from',
  niche: 'lnkmx_signup_niche',
  refSlug: 'lnkmx_signup_ref_slug',
  desiredSlug: 'lnkmx_signup_desired_slug',
} as const;

/** Minimum block count to skip onboarding (user already has content) */
const MIN_BLOCKS_TO_SKIP_ONBOARDING = 2;
const DISMISS_SNOOZE_MS = 24 * 60 * 60 * 1000;

interface OnboardingProfile {
  name: string;
  bio: string;
}

interface SignupOnboardingContext {
  initialNiche?: Niche;
  from?: string;
  refSlug?: string;
  desiredSlug?: string;
}

interface UseDashboardOnboardingOptions {
  isUserReady: boolean;
  isPageReady: boolean;
  userId?: string | null;
  /** Current block count on the page */
  blockCount: number;
  onNicheComplete: (profile: OnboardingProfile, blocks: Block[], niche: Niche) => void;
}

function getScopedKey(userId: string | null | undefined, key: string): string {
  return userId ? `user:${userId}:${key}` : key;
}

function getScopedValue<T = string>(userId: string | null | undefined, key: string): T | null {
  return storage.get<T>(getScopedKey(userId, key));
}

function getScopedOrLegacyValue<T = string>(
  userId: string | null | undefined,
  key: string
): T | null {
  return getScopedValue<T>(userId, key) ?? storage.get<T>(key);
}

function setScopedValue<T = string>(
  userId: string | null | undefined,
  key: string,
  value: T
): void {
  storage.set(getScopedKey(userId, key), value);
}

function isNiche(value: string | null): value is Niche {
  return Boolean(value && NICHES.includes(value as Niche));
}

function readSessionValue(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.sessionStorage.getItem(key) || undefined;
  } catch {
    return undefined;
  }
}

function clearSignupContext(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.values(SIGNUP_CONTEXT_KEYS).forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Non-critical: context only improves onboarding personalization.
  }
}

function readSignupContext(): SignupOnboardingContext {
  const niche = readSessionValue(SIGNUP_CONTEXT_KEYS.niche) || null;
  return {
    initialNiche: isNiche(niche) ? niche : undefined,
    from: readSessionValue(SIGNUP_CONTEXT_KEYS.from),
    refSlug: readSessionValue(SIGNUP_CONTEXT_KEYS.refSlug),
    desiredSlug: readSessionValue(SIGNUP_CONTEXT_KEYS.desiredSlug),
  };
}

export function useDashboardOnboarding({
  isUserReady,
  isPageReady,
  userId,
  blockCount,
  onNicheComplete,
}: UseDashboardOnboardingOptions) {
  const [showScopeChoice, setShowScopeChoice] = useState(false);
  const [showAIBuilderWizard, setShowAIBuilderWizard] = useState(false);
  const [signupContext, setSignupContext] = useState<SignupOnboardingContext>(() => readSignupContext());

  // Check onboarding status on mount — show scope choice ONLY for brand-new users
  useEffect(() => {
    if (!isUserReady || !isPageReady) return;

    const nextSignupContext = readSignupContext();
    setSignupContext(nextSignupContext);

    const completed =
      getScopedOrLegacyValue<string>(userId, STORAGE_KEYS.ONBOARDING_COMPLETED) ||
      getScopedOrLegacyValue<string>(userId, STORAGE_KEYS.LEGACY_AI_BUILDER_USED) ||
      getScopedOrLegacyValue<string>(userId, STORAGE_KEYS.LEGACY_NICHE_COMPLETED) ||
      getScopedOrLegacyValue<string>(userId, STORAGE_KEYS.LEGACY_LINKMAX_COMPLETED);
    const dismissedAt = getScopedOrLegacyValue<number>(userId, STORAGE_KEYS.ONBOARDING_DISMISSED_AT);
    const dismissedRecently = dismissedAt ? Date.now() - dismissedAt < DISMISS_SNOOZE_MS : false;

    const hasExistingContent = blockCount > MIN_BLOCKS_TO_SKIP_ONBOARDING;

    if (hasExistingContent || completed) {
      if (!getScopedValue<string>(userId, STORAGE_KEYS.ONBOARDING_COMPLETED)) {
        setScopedValue(userId, STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      }
      return;
    }

    if (dismissedRecently) return;

    // New user with no content — show scope chooser first.
    const timer = window.setTimeout(() => setShowScopeChoice(true), 500);
    return () => window.clearTimeout(timer);
  }, [isUserReady, isPageReady, userId, blockCount]);

  const handleScopeClose = useCallback(() => {
    setScopedValue(userId, STORAGE_KEYS.ONBOARDING_DISMISSED_AT, Date.now());
    setShowScopeChoice(false);
  }, [userId]);

  const handleChooseSingle = useCallback(() => {
    setShowScopeChoice(false);
    setShowAIBuilderWizard(true);
  }, []);

  const handleAIBuilderClose = useCallback(() => {
    setScopedValue(userId, STORAGE_KEYS.ONBOARDING_DISMISSED_AT, Date.now());
    setShowAIBuilderWizard(false);
  }, [userId]);

  const handleAIBuilderComplete = useCallback(
    (profile: OnboardingProfile, blocks: Block[], niche: Niche) => {
      onNicheComplete(profile, blocks, niche);
      setScopedValue(userId, STORAGE_KEYS.SMART_BUILDER_USED, 'true');
      setScopedValue(userId, STORAGE_KEYS.AI_BUILDER_USED, 'true');
      setScopedValue(userId, STORAGE_KEYS.NICHE_COMPLETED, 'true');
      setScopedValue(userId, STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      storage.remove(getScopedKey(userId, STORAGE_KEYS.ONBOARDING_DISMISSED_AT));
      clearSignupContext();
      setShowAIBuilderWizard(false);
    },
    [onNicheComplete, userId]
  );

  const openAIBuilderFromSettings = useCallback(() => {
    setSignupContext(readSignupContext());
    setShowAIBuilderWizard(true);
  }, []);

  return {
    showScopeChoice,
    showAIBuilderWizard,
    signupContext,
    handleScopeClose,
    handleChooseSingle,
    handleAIBuilderClose,
    handleAIBuilderComplete,
    openAIBuilderFromSettings,
  };
}
