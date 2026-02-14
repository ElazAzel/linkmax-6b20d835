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

export type FreeTier = 'free' | 'pro' | 'business';

// Feature flags for each tier
export interface TierFeatures {
  maxBlocks: number;
  maxAIRequestsPerWeek: number;
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
  maxBlocks: Infinity, // Unlimited links/blocks as per pricing
  maxAIRequestsPerWeek: 3,
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

export const PRO_LIMITS: TierFeatures = {
  maxBlocks: Infinity,
  maxAIRequestsPerWeek: Infinity,
  showWatermark: false,
  allowedBlocks: [...FREE_BLOCKS, ...PRO_BLOCKS] as unknown as string[],
  premiumBlocks: [...BUSINESS_BLOCKS] as unknown as string[],
  maxLeadsPerMonth: 100,
  canUseAnalytics: true,
  canUseCRM: true,
  canUseScheduler: true,
  canUsePixels: true,
  canUseCustomDomain: false,
  canUseChatbot: false,
  canUseAutoNotifications: false,
  canUsePayments: false,
  canUseWhiteLabel: false,
  canUseMultiPage: false,
  canUseVerificationBadge: true,
  canUsePremiumFrames: true,
  canUseAdvancedThemes: true,
  canUseCustomPageBackground: false,
};

export const BUSINESS_LIMITS: TierFeatures = {
  maxBlocks: Infinity,
  maxAIRequestsPerWeek: Infinity,
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
  canUseWhiteLabel: true,
  canUseMultiPage: true,
  canUseVerificationBadge: true,
  canUsePremiumFrames: true,
  canUseAdvancedThemes: true,
  canUseCustomPageBackground: true,
};

// Helper to get block tier
export function getBlockTier(blockType: string): FreeTier {
  if ((FREE_BLOCKS as readonly string[]).includes(blockType)) return 'free';
  if ((PRO_BLOCKS as readonly string[]).includes(blockType)) return 'pro';
  if ((BUSINESS_BLOCKS as readonly string[]).includes(blockType)) return 'business';
  return 'free'; // Default to free for unknown blocks
}

export function useFreemiumLimits() {
  const { isPremium, isLoading, tier = 'free' } = usePremiumStatus();
  
  // Determine current tier limits
  const getCurrentLimits = () => {
    if (tier === 'business') return BUSINESS_LIMITS;
    if (tier === 'pro' || isPremium) return PRO_LIMITS;
    return FREE_LIMITS;
  };
  
  const limits = getCurrentLimits();
  const currentTier: FreeTier = tier === 'business' ? 'business' : (tier === 'pro' || isPremium) ? 'pro' : 'free';
  
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
  
  // Get AI usage from localStorage (weekly tracking)
  const getAIUsageThisWeek = (): number => {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const stored = localStorage.getItem('linkmax_ai_usage');
    if (!stored) return 0;
    
    try {
      const { weekStartDate, count } = JSON.parse(stored);
      if (weekStartDate === weekStart) return count;
      return 0;
    } catch {
      return 0;
    }
  };
  
  const incrementAIUsage = () => {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const current = getAIUsageThisWeek();
    localStorage.setItem('linkmax_ai_usage', JSON.stringify({
      weekStartDate: weekStart,
      count: current + 1,
    }));
  };
  
  const canUseAI = () => {
    if (currentTier !== 'free') return true;
    return getAIUsageThisWeek() < FREE_LIMITS.maxAIRequestsPerWeek;
  };
  
  const getRemainingAIRequests = () => {
    if (currentTier !== 'free') return Infinity;
    return Math.max(0, FREE_LIMITS.maxAIRequestsPerWeek - getAIUsageThisWeek());
  };
  
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

// Helper to get week start date string (Monday)
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}
