import { useCallback, useEffect, useRef } from 'react';
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
import type { UserStats } from '@/types/achievements';

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

  // Check achievements when page data or profile changes
  const lastCheckedRef = useRef<string>('');
  
  useEffect(() => {
    if (!pageData?.blocks || achievements.loading) return;

    // Create a simple hash to avoid checking on every render
    const friendsCount = userProfile.profile?.friends_count ?? 0;
    const checksum = `${pageData.blocks.length}-${friendsCount}`;
    if (lastCheckedRef.current === checksum) return;
    lastCheckedRef.current = checksum;

    // Build UserStats from current state
    const blocksUsed = new Set<string>();
    const featuresUsed = new Set<string>();

    pageData.blocks.forEach(block => {
      blocksUsed.add(block.type);
    });

    // Check if features were used (stored in localStorage)
    if (localStorage.getItem('linkmax_ai_used') === 'true') {
      featuresUsed.add('ai');
    }
    if (localStorage.getItem('linkmax_template_used') === 'true') {
      featuresUsed.add('template');
    }
    if (localStorage.getItem('linkmax_chatbot_used') === 'true') {
      featuresUsed.add('chatbot');
    }
    if (localStorage.getItem('linkmax_published') === 'true') {
      featuresUsed.add('published');
    }

    const stats: UserStats = {
      blocksUsed,
      totalBlocks: pageData.blocks.length,
      featuresUsed,
      pageViews: parseInt(localStorage.getItem('linkmax_page_views') || '0', 10),
      published: localStorage.getItem('linkmax_published') === 'true',
      friendsCount,
    };

    achievements.checkAchievements(stats);
  }, [pageData?.blocks, userProfile.profile?.friends_count, achievements.loading]);

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
    onReplaceBlocks: pageState.replaceBlocks,
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

  // Apply template - replaces all blocks at once (like AI Builder)
  const handleApplyTemplate = useCallback(
    (blocks: Block[]) => {
      // Mark template as used for achievements
      localStorage.setItem('linkmax_template_used', 'true');
      
      // Generate unique IDs for all blocks
      const blocksWithIds = blocks.map((block, index) => ({
        ...block,
        id: `${block.type}-${Date.now()}-${index}`,
      }));
      
      // Replace all content blocks at once (keeps profile block)
      pageState.replaceBlocks(blocksWithIds);
      
      // Complete quest
      dailyQuests.markQuestComplete('use_template');
    },
    [pageState.replaceBlocks, dailyQuests.markQuestComplete]
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
