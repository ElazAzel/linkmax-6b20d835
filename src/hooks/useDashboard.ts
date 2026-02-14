import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { useAuth } from './useAuth';
import { useCloudPageState } from './useCloudPageState';
import { usePremiumStatus } from './usePremiumStatus';
import { useUserProfile } from './useUserProfile';
import { useBlockEditor } from './useBlockEditor';
import { useDashboardSharing } from './useDashboardSharing';
import { useDashboardAI } from './useDashboardAI';
import { useDashboardOnboarding } from './useDashboardOnboarding';
import { useDashboardUsername } from './useDashboardUsername';
import { useDashboardAuthGuard } from './useDashboardAuthGuard';
import { useAchievements } from './useAchievements';
import { useSoundEffects } from './useSoundEffects';
import { useHapticFeedback } from './useHapticFeedback';


import type { Block, PageData } from '@/types/page';
import type { Niche } from '@/lib/niches';

interface UseDashboardOptions {
  onPublish?: (pageData: PageData) => void;
}

export function useDashboard(options?: UseDashboardOptions) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const sounds = useSoundEffects();
  const haptics = useHapticFeedback();

  // Premium status
  const { isPremium, tier, isLoading: premiumLoading } = usePremiumStatus();

  // Cloud page state (data, save, publish, block CRUD)
  const cloudState = useCloudPageState({ onPublish: options?.onPublish });

  // Auth guard
  useDashboardAuthGuard({ isLoading: cloudState.loading });

  // User profile
  const userProfile = useUserProfile(user?.id);

  // Achievements
  const achievements = useAchievements();

  // Profile block helper
  const profileBlock = useMemo(() => {
    return cloudState.pageData?.blocks.find(b => b.type === 'profile') || null;
  }, [cloudState.pageData?.blocks]);

  // Handle update profile (name/bio on profile block)
  const handleUpdateProfile = useCallback((updates: { name: string; bio: string }) => {
    if (!cloudState.pageData) return;
    const profileIdx = cloudState.pageData.blocks.findIndex(b => b.type === 'profile');
    if (profileIdx === -1) return;

    const profileBlk = cloudState.pageData.blocks[profileIdx];
    cloudState.updateBlock(profileBlk.id, {
      ...updates,
    } as Partial<Block>);
  }, [cloudState]);

  // Block editor
  const blockEditor = useBlockEditor({
    isPremium,
    addBlock: cloudState.addBlock,
    updateBlock: cloudState.updateBlock,
    deleteBlock: cloudState.deleteBlock,
    blocks: cloudState.pageData?.blocks || [],
    playAdd: sounds.playAdd,
    playDelete: sounds.playDelete,
    playError: sounds.playError,
    hapticSuccess: haptics.success,
  });

  // Sharing state
  const sharingState = useDashboardSharing({
    onPublish: cloudState.publish,
    onSave: cloudState.save,
  });

  // AI state
  const aiState = useDashboardAI({
    onUpdateProfile: handleUpdateProfile,
    onAddBlock: cloudState.addBlock,
    onReplaceBlocks: cloudState.replaceBlocks,
  });

  // Username state
  const usernameState = useDashboardUsername({
    userId: user?.id,
    initialUsername: userProfile.profile?.username,
    onSaveSuccess: async () => {
      await userProfile.refresh();
    },
  });

  // Onboarding state
  const handleNicheComplete = useCallback(
    (profile: { name: string; bio: string }, blocks: Block[], niche: Niche) => {
      handleUpdateProfile(profile);
      // Replace content blocks with AI-generated ones
      cloudState.replaceBlocks(blocks);
      cloudState.updateNiche(niche);
    },
    [handleUpdateProfile, cloudState]
  );

  const onboardingState = useDashboardOnboarding({
    isUserReady: !!user,
    isPageReady: !!cloudState.pageData,
    blockCount: cloudState.pageData?.blocks.length || 0,
    onNicheComplete: handleNicheComplete,
  });

  // Handle apply template
  const handleApplyTemplate = useCallback((blocks: Block[]) => {
    cloudState.replaceBlocks(blocks);
    toast.success(t('dashboard.templateApplied', 'Template applied!'));
  }, [cloudState, t]);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    const { supabase } = await import('@/platform/supabase/client');
    await supabase.auth.signOut();
    router.push('/');
  }, [router]);

  // Current tier string
  const currentTier = isPremium ? (tier || 'pro') : 'free';

  return useMemo(() => ({
    // Auth
    user,
    handleSignOut,

    // Page data
    pageData: cloudState.pageData,
    loading: cloudState.loading,
    saving: cloudState.saving,
    saveStatus: cloudState.saveStatus,

    // Profile
    profileBlock,
    handleUpdateProfile,
    userProfile,

    // Premium
    isPremium,
    currentTier,
    premiumLoading,

    // Block operations
    updateBlock: cloudState.updateBlock,
    reorderBlocks: cloudState.reorderBlocks,
    updatePageDataPartial: cloudState.updatePageDataPartial,
    updateNiche: cloudState.updateNiche,

    // Sub-state hooks
    blockEditor,
    sharingState,
    aiState,
    usernameState,
    onboardingState,
    achievements,

    // Template
    handleApplyTemplate,
  }), [
    user,
    handleSignOut,
    cloudState.pageData,
    cloudState.loading,
    cloudState.saving,
    cloudState.saveStatus,
    cloudState.updateBlock,
    cloudState.reorderBlocks,
    cloudState.updatePageDataPartial,
    cloudState.updateNiche,
    profileBlock,
    handleUpdateProfile,
    userProfile,
    isPremium,
    currentTier,
    premiumLoading,
    blockEditor,
    sharingState,
    aiState,
    usernameState,
    onboardingState,
    achievements,
    handleApplyTemplate,
  ]);
}
