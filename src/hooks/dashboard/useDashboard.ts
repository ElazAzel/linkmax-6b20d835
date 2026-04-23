import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useMemo } from 'react';

import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/user/useAuth';
import { useCloudPageState } from '@/hooks/page/useCloudPageState';
import { usePremiumStatus } from '@/hooks/user/usePremiumStatus';
import { useUserProfile } from '@/hooks/user/useUserProfile';
import { useBlockEditor } from '@/hooks/editor/useBlockEditor';
import { useDashboardSharing } from '@/hooks/dashboard/useDashboardSharing';
import { useDashboardAI } from '@/hooks/dashboard/useDashboardAI';
import { useDashboardOnboarding } from '@/hooks/dashboard/useDashboardOnboarding';
import { useDashboardUsername } from '@/hooks/dashboard/useDashboardUsername';
import { useDashboardAuthGuard } from '@/hooks/dashboard/useDashboardAuthGuard';
import { useAchievements } from '@/hooks/user/useAchievements';
import { useSoundEffects } from '@/hooks/ui/useSoundEffects';
import { useHapticFeedback } from '@/hooks/ui/useHapticFeedback';


import type { Block, PageData } from '@/types/page';
import type { Niche } from '@/lib/niches';
import type { EditorHistoryType } from '@/hooks/editor/useEditorHistory';

interface UseDashboardOptions {
  onPublish?: (pageData: PageData) => void;
  editorHistory?: EditorHistoryType;
}

export function useDashboard(options?: UseDashboardOptions) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sounds = useSoundEffects();
  const haptics = useHapticFeedback();

  // Premium status
  const { isPremium, tier, isLoading: premiumLoading } = usePremiumStatus();

  // Cloud page state (data, save, publish, block CRUD)
  const cloudState = useCloudPageState({ onPublish: options?.onPublish });

  // Auth guard
  useDashboardAuthGuard({ isLoading: cloudState.loading });

  // Update last_seen_at for online status tracking
  useEffect(() => {
    if (!user?.id) return;
    const updateLastSeen = async () => {
      try {
        const { supabase } = await import('@/platform/supabase/client');
        await (supabase.from('user_profiles') as any).update({ last_seen_at: new Date().toISOString() }).eq('id', user.id);
      } catch { /* non-critical */ }
    };
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 3 * 60 * 1000); // every 3 min
    return () => clearInterval(interval);
  }, [user?.id]);

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

  // Block editor (with history reference — passed from DashboardV2)
  const blockEditor = useBlockEditor({
    isPremium,
    addBlock: cloudState.addBlock,
    updateBlock: cloudState.updateBlock,
    deleteBlock: cloudState.deleteBlock,
    blocks: cloudState.pageData?.blocks || [],
    editorHistory: options?.editorHistory,
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
      // APPEND new blocks to existing ones (don't replace)
      blocks.forEach((block) => {
        cloudState.addBlock(block);
      });
      cloudState.updateNiche(niche);

      // If wizard requested immediate publish, fire it after a short delay
      // (let block additions settle into pageData first)
      import('@/lib/storage').then(({ storage }) => {
        if (storage.get<string>('wizard_wants_publish') === 'true') {
          storage.remove('wizard_wants_publish');
          setTimeout(() => {
            cloudState.publish().then(() => {
              toast.success(t('dashboard.publishedFromWizard', 'Страница опубликована! 🎉'));
            }).catch((err) => {
              console.warn('Auto-publish from wizard failed:', err);
            });
          }, 1200);
        }
      });
    },
    [handleUpdateProfile, cloudState, t]
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
    navigate('/');
  }, [navigate]);

  // Current tier string (using new 4-tier model)
  const currentTier = isPremium ? (tier || 'pro') : 'identity';

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
    updateEntityFields: cloudState.updateEntityFields,

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
    cloudState.updateEntityFields,
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
