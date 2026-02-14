import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCloudPageState } from '@/hooks/useCloudPageState';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useBlockHints } from '@/hooks/useBlockHints';
import { useAchievements } from '@/hooks/useAchievements';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useDashboardOnboarding } from '@/hooks/useDashboardOnboarding';
import { useDashboardAuthGuard } from '@/hooks/useDashboardAuthGuard';
import { useDashboardSharing } from '@/hooks/useDashboardSharing';
import { useDashboardUsername } from '@/hooks/useDashboardUsername';
import { useDashboardAI } from '@/hooks/useDashboardAI';
import { useBlockEditor } from '@/hooks/useBlockEditor';
import { useEditorModeToggle } from '@/hooks/useEditorModeToggle';
import { useDailyQuests } from '@/hooks/useDailyQuests';
import type { Block, ProfileBlock, PageData } from '@/types/page';

/**
 * Main dashboard state hook - composes all dashboard-related hooks
 */
export function useDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus();
  const blockHints = useBlockHints();
  const achievements = useAchievements();
  const { playAdd, playDelete, playError } = useSoundEffects();
  const isMobile = useIsMobile();
  const haptic = useHapticFeedback();

  // Page state from cloud
  const pageState = useCloudPageState();
  const { pageData, loading, addBlock, updateBlock, save, publish } = pageState;

  // Auth guard - redirects to /auth if not logged in
  const { user, isLoading: authLoading } = useDashboardAuthGuard({
    isLoading: loading,
  });

  // Daily quests
  const dailyQuests = useDailyQuests(user?.id);

  // User profile
  const userProfile = useUserProfile(user?.id);

  // Username management
  const usernameState = useDashboardUsername({
    userId: user?.id,
    initialUsername: userProfile.profile?.username,
    onSaveSuccess: save,
  });

  // Sharing and preview
  const sharingState = useDashboardSharing({
    onPublish: publish,
    onSave: save,
    onQuestComplete: dailyQuests.markQuestComplete,
  });

  // AI tools
  const aiState = useDashboardAI({
    onUpdateProfile: (profile) => {
      const profileBlock = pageData?.blocks.find((b) => b.type === 'profile');
      if (profileBlock) {
        updateBlock(profileBlock.id, profile);
      }
    },
    onAddBlock: addBlock,
    onQuestComplete: dailyQuests.markQuestComplete,
  });

  // Block editing with undo
  const blockEditor = useBlockEditor({
    isPremium,
    addBlock,
    updateBlock,
    deleteBlock: pageState.deleteBlock,
    blocks: pageData?.blocks || [],
    playAdd,
    playDelete,
    playError,
    hapticSuccess: haptic.success,
    onBlockHint: blockHints.showHint,
    onQuestComplete: dailyQuests.markQuestComplete,
  });

  // Editor mode toggle (linear/grid)
  const editorModeState = useEditorModeToggle({
    pageData,
    updatePageData: pageState.updatePageDataPartial,
  });

  // Onboarding
  const onboardingState = useDashboardOnboarding({
    isUserReady: !!user,
    isPageReady: !!pageData,
    onNicheComplete: (profile, blocks, niche) => {
      const profileBlock = pageData?.blocks.find((b) => b.type === 'profile');
      if (profile && profileBlock) {
        updateBlock(profileBlock.id, { name: profile.name, bio: profile.bio });
      }
      blocks.forEach((block) => addBlock(block));
      // Save the selected niche
      pageState.updateNiche(niche);
    },
  });

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  // Update profile block
  const handleUpdateProfile = useCallback(
    (updates: Partial<ProfileBlock>) => {
      const profileBlock = pageData?.blocks.find((b) => b.type === 'profile');
      if (profileBlock) {
        updateBlock(profileBlock.id, updates);
      }
    },
    [pageData, updateBlock]
  );

  // Apply template
  const handleApplyTemplate = useCallback(
    (blocks: Block[]) => {
      blocks.forEach((block, index) => {
        addBlock({ ...block, id: `${block.type}-${Date.now()}-${index}` });
      });
    },
    [addBlock]
  );

  // Get profile block
  const profileBlock = pageData?.blocks.find(
    (b) => b.type === 'profile'
  ) as ProfileBlock | undefined;

  return {
    // Core state
    user,
    pageData,
    profileBlock,
    loading: loading || authLoading,
    isMobile,
    isPremium,
    premiumLoading,

    // Page operations
    ...pageState,
    updateNiche: pageState.updateNiche,

    // Editor mode
    editorMode: editorModeState.currentMode,
    toggleEditorMode: editorModeState.toggleMode,
    isGridMode: editorModeState.isGridMode,

    // User profile
    userProfile,

    // Username
    usernameState,

    // Sharing
    sharingState,

    // AI
    aiState,

    // Block editor
    blockEditor,

    // Onboarding
    onboardingState,

    // Achievements
    achievements,

    // Block hints
    blockHints,

    // Haptic
    haptic,

    // Daily quests
    dailyQuests,

    // Actions
    handleSignOut,
    handleUpdateProfile,
    handleApplyTemplate,
  };
}
