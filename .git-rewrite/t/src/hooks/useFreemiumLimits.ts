import { usePremiumStatus } from './usePremiumStatus';

// Block tiers based on pricing plans
export const FREE_BLOCKS = [
  'profile', 'link', 'text', 'image', 'button', 'socials', 'separator', 'messenger', 'map', 'avatar'
] as const;

export const PRO_BLOCKS = [
  'video', 'carousel', 'pricing', 'product', 'catalog', 'custom_code', 
  'before_after', 'faq', 'testimonial', 'newsletter', 'scratch', 'search', 'shoutout'
] as const;

export const BUSINESS_BLOCKS = [
  'download', 'form', 'countdown', 'booking'
] as const;

export type FreeTier = 'free' | 'pro';

// Feature flags for each tier
export interface TierFeatures {
  maxBlocks: number;
  maxAIPageGenerationsPerMonth: number; // AI page builder generations
  showWatermark: boolean;
  allowedBlocks: string[];
  premiumBlocks: string[];
  maxLeadsPerMonth: number;
  canUseAnalytics: boolean;
  canUseCRM: boolean;
  canUseScheduler: boolean;
  canUsePixels: boolean;
  canUseCustomDomain: boolean;
  canUseChatbot: boolean;
  canUseAutoNotifications: boolean;
  canUsePayments: boolean;
  canUseWhiteLabel: boolean;
  canUseMultiPage: boolean;
  canUseVerificationBadge: boolean;
  canUsePremiumFrames: boolean;
  canUseAdvancedThemes: boolean;
  canUseCustomPageBackground: boolean;
}

export const FREE_LIMITS: TierFeatures = {
  maxBlocks: Infinity,
  maxAIPageGenerationsPerMonth: 1, // 1 generation per month for free
  showWatermark: true,
  allowedBlocks: [...FREE_BLOCKS] as string[],
  premiumBlocks: [...PRO_BLOCKS, ...BUSINESS_BLOCKS] as unknown as string[],
  maxLeadsPerMonth: 0,
  canUseAnalytics: false,
  canUseCRM: false,
  canUseScheduler: false,
  canUsePixels: false,
  canUseCustomDomain: false,
  canUseChatbot: false,
  canUseAutoNotifications: false,
  canUsePayments: false,
  canUseWhiteLabel: false,
  canUseMultiPage: false,
  canUseVerificationBadge: false,
  canUsePremiumFrames: false,
  canUseAdvancedThemes: false,
  canUseCustomPageBackground: false,
};

// Premium gets ALL Business features except white label
export const PRO_LIMITS: TierFeatures = {
  maxBlocks: Infinity,
  maxAIPageGenerationsPerMonth: 5, // 5 generations per month for premium
  showWatermark: false,
  allowedBlocks: [...FREE_BLOCKS, ...PRO_BLOCKS, ...BUSINESS_BLOCKS] as unknown as string[],
  premiumBlocks: [] as string[], // No premium-locked blocks for pro
  maxLeadsPerMonth: Infinity, // Unlimited leads
  canUseAnalytics: true,
  canUseCRM: true,
  canUseScheduler: true,
  canUsePixels: true,
  canUseCustomDomain: true,
  canUseChatbot: true,
  canUseAutoNotifications: true,
  canUsePayments: true,
  canUseWhiteLabel: false, // White label only for Business
  canUseMultiPage: true,
  canUseVerificationBadge: true,
  canUsePremiumFrames: true,
  canUseAdvancedThemes: true,
  canUseCustomPageBackground: true,
};

// Business only adds white label
export const BUSINESS_LIMITS: TierFeatures = {
  maxBlocks: Infinity,
  maxAIPageGenerationsPerMonth: Infinity, // Unlimited for business
  showWatermark: false,
  allowedBlocks: [...FREE_BLOCKS, ...PRO_BLOCKS, ...BUSINESS_BLOCKS] as unknown as string[],
  premiumBlocks: [] as string[],
  maxLeadsPerMonth: Infinity,
  canUseAnalytics: true,
  canUseCRM: true,
  canUseScheduler: true,
  canUsePixels: true,
  canUseCustomDomain: true,
  canUseChatbot: true,
  canUseAutoNotifications: true,
  canUsePayments: true,
  canUseWhiteLabel: true, // Only Business gets white label
  canUseMultiPage: true,
  canUseVerificationBadge: true,
  canUsePremiumFrames: true,
  canUseAdvancedThemes: true,
  canUseCustomPageBackground: true,
};

// Helper to get block tier (business merged into pro)
export function getBlockTier(blockType: string): FreeTier {
  if ((FREE_BLOCKS as readonly string[]).includes(blockType)) return 'free';
  // Both pro and business blocks now require 'pro' tier
  if ((PRO_BLOCKS as readonly string[]).includes(blockType)) return 'pro';
  if ((BUSINESS_BLOCKS as readonly string[]).includes(blockType)) return 'pro';
  return 'free'; // Default to free for unknown blocks
}

export function useFreemiumLimits() {
  const { isPremium, isLoading, tier = 'free' } = usePremiumStatus();
  
  // Determine current tier limits (business is now pro)
  const getCurrentLimits = () => {
    if (tier === 'pro' || isPremium) return PRO_LIMITS;
    return FREE_LIMITS;
  };
  
  const limits = getCurrentLimits();
  const currentTier: FreeTier = (tier === 'pro' || isPremium) ? 'pro' : 'free';
  
  const canAddBlock = (currentBlockCount: number) => {
    return currentBlockCount < limits.maxBlocks;
  };
  
  // Check if user can USE (add new) this block type
  const canUseBlockType = (blockType: string) => {
    return limits.allowedBlocks.includes(blockType);
  };
  
  // Check if user can EDIT an existing block (for downgraded users)
  // If block exists but is premium, user can only view/delete, not edit
  const canEditBlock = (blockType: string) => {
    return limits.allowedBlocks.includes(blockType);
  };
  
  // Check if block is view-only (exists but can't be edited due to tier)
  const isBlockViewOnly = (blockType: string) => {
    return !limits.allowedBlocks.includes(blockType);
  };
  
  // Get required tier for a block type
  const getRequiredTier = (blockType: string): FreeTier => {
    return getBlockTier(blockType);
  };
  
  const getRemainingBlocks = (currentBlockCount: number) => {
    if (limits.maxBlocks === Infinity) return Infinity;
    return Math.max(0, limits.maxBlocks - currentBlockCount);
  };
  
  // Get AI page generation usage from localStorage (monthly tracking)
  const getAIPageGenerationsThisMonth = (): number => {
    const now = new Date();
    const monthKey = getMonthKey(now);
    const stored = localStorage.getItem('linkmax_ai_page_generations');
    if (!stored) return 0;
    
    try {
      const { monthKeyDate, count } = JSON.parse(stored);
      if (monthKeyDate === monthKey) return count;
      return 0;
    } catch {
      return 0;
    }
  };
  
  const incrementAIPageGeneration = () => {
    const now = new Date();
    const monthKey = getMonthKey(now);
    const current = getAIPageGenerationsThisMonth();
    localStorage.setItem('linkmax_ai_page_generations', JSON.stringify({
      monthKeyDate: monthKey,
      count: current + 1,
    }));
  };
  
  const canUseAIPageGeneration = () => {
    return getAIPageGenerationsThisMonth() < limits.maxAIPageGenerationsPerMonth;
  };
  
  const getRemainingAIPageGenerations = () => {
    if (limits.maxAIPageGenerationsPerMonth === Infinity) return Infinity;
    return Math.max(0, limits.maxAIPageGenerationsPerMonth - getAIPageGenerationsThisMonth());
  };
  
  // Legacy AI usage (for other AI features - unlimited for all)
  const canUseAI = () => true;
  const getRemainingAIRequests = () => Infinity;
  const incrementAIUsage = () => {};
  const getAIUsageThisWeek = () => 0;
  
  // Feature checks
  const canUseFeature = (feature: keyof TierFeatures): boolean => {
    const value = limits[feature];
    return typeof value === 'boolean' ? value : true;
  };
  
  const canUseAnalytics = () => limits.canUseAnalytics;
  const canUseCRM = () => limits.canUseCRM;
  const canUseScheduler = () => limits.canUseScheduler;
  const canUsePixels = () => limits.canUsePixels;
  const canUseCustomDomain = () => limits.canUseCustomDomain;
  const canUseChatbot = () => limits.canUseChatbot;
  const canUseAutoNotifications = () => limits.canUseAutoNotifications;
  const canUsePayments = () => limits.canUsePayments;
  const canUseWhiteLabel = () => limits.canUseWhiteLabel;
  const canUseMultiPage = () => limits.canUseMultiPage;
  const canUseVerificationBadge = () => limits.canUseVerificationBadge;
  const canUsePremiumFrames = () => limits.canUsePremiumFrames;
  const canUseAdvancedThemes = () => limits.canUseAdvancedThemes;
  const canUseCustomPageBackground = () => limits.canUseCustomPageBackground;
  
  const getMaxLeads = () => limits.maxLeadsPerMonth;

  return {
    isPremium: currentTier !== 'free',
    currentTier,
    isLoading,
    limits,
    canAddBlock,
    canUseBlockType,
    canEditBlock,
    isBlockViewOnly,
    getRequiredTier,
    getRemainingBlocks,
    // AI page generation (monthly limit)
    canUseAIPageGeneration,
    getRemainingAIPageGenerations,
    incrementAIPageGeneration,
    getAIPageGenerationsThisMonth,
    // Legacy AI (unlimited for all)
    canUseAI,
    getRemainingAIRequests,
    incrementAIUsage,
    getAIUsageThisWeek,
    // Feature checks
    canUseFeature,
    canUseAnalytics,
    canUseCRM,
    canUseScheduler,
    canUsePixels,
    canUseCustomDomain,
    canUseChatbot,
    canUseAutoNotifications,
    canUsePayments,
    canUseWhiteLabel,
    canUseMultiPage,
    canUseVerificationBadge,
    canUsePremiumFrames,
    canUseAdvancedThemes,
    canUseCustomPageBackground,
    getMaxLeads,
  };
}

// Helper to get month key (YYYY-MM format)
function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
