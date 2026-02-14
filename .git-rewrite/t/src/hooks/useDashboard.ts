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
import { useDailyQuests } from '@/hooks/useDailyQuests';
import { useTokens } from '@/hooks/useTokens';
import { storage } from '@/lib/storage';
import type { Block, ProfileBlock } from '@/types/page';
import type { UserStats } from '@/types/achievements';

interface UseDashboardOptions {
  onPublish?: (pageData: import('@/types/page').PageData) => void;
}

/**
 * Main dashboard state hook - composes all dashboard-related hooks
 */
export function useDashboard(options?: UseDashboardOptions) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isPremium, isLoading: premiumLoading, tier: currentTier = 'free' } = usePremiumStatus();
  const blockHints = useBlockHints();
  const achievements = useAchievements();
  const { playAdd, playDelete, playError } = useSoundEffects();
  const isMobile = useIsMobile();
  const haptic = useHapticFeedback();

  // Page state from cloud - with onPublish callback for versioning
  const pageState = useCloudPageState({ onPublish: options?.onPublish });
  const { pageData, loading, addBlock, updateBlock, save, publish } = pageState;

  // Auth guard - redirects to /auth if not logged in
  const { user, isLoading: authLoading } = useDashboardAuthGuard({
    isLoading: loading,
  });

  // Daily quests
  const dailyQuests = useDailyQuests(user?.id);

  // Token economy
  const tokens = useTokens();

  // User profile
  const userProfile = useUserProfile(user?.id);

  // NOTE: Daily visit tokens are claimed via useDailyQuests (daily_visit quest)
  // Do NOT claim here to avoid double rewards

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

    // Check if features were used (stored in storage)
    if (storage.get<string>('ai_used') === 'true') {
      featuresUsed.add('ai');
    }
    if (storage.get<string>('template_used') === 'true') {
      featuresUsed.add('template');
    }
    if (storage.get<string>('chatbot_used') === 'true') {
      featuresUsed.add('chatbot');
    }
    if (storage.get<string>('published') === 'true') {
      featuresUsed.add('published');
    }

    const stats: UserStats = {
      blocksUsed,
      totalBlocks: pageData.blocks.length,
      featuresUsed,
      pageViews: parseInt(storage.get<string>('page_views') || '0', 10),
      published: storage.get<string>('published') === 'true',
      friendsCount,
    };

    achievements.checkAchievements(stats);
  }, [pageData?.blocks, userProfile.profile?.friends_count, achievements]);

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
    onClaimAIToken: () => tokens.claimDailyTokens('use_ai'),
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
    onClaimBlockToken: () => tokens.claimDailyTokens('add_block'),
  });

  // Onboarding - skip if user already has content (more than 2 blocks)
  const onboardingState = useDashboardOnboarding({
    isUserReady: !!user,
    isPageReady: !!pageData,
    blockCount: pageData?.blocks?.length || 0,
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
      storage.set('template_used', 'true');

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
    currentTier,
    premiumTier: currentTier,
    premiumLoading,

    // Page operations
    ...pageState,
    updateNiche: pageState.updateNiche,

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

    // Tokens
    tokens,

    // Actions
    handleSignOut,
    handleUpdateProfile,
    handleApplyTemplate,
  };
}
