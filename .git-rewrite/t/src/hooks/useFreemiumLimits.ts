import { usePremiumStatus } from './usePremiumStatus';

export const FREE_LIMITS = {
  maxBlocks: 5,
  maxAIRequestsPerDay: 3,
  showWatermark: true,
  premiumBlocks: ['video', 'carousel', 'download', 'form', 'newsletter', 'messenger', 'testimonial', 'scratch', 'search', 'custom_code', 'catalog', 'countdown'],
};

export const PREMIUM_LIMITS = {
  maxBlocks: Infinity,
  maxAIRequestsPerDay: Infinity,
  showWatermark: false,
  premiumBlocks: [],
};

export function useFreemiumLimits() {
  const { isPremium, isLoading } = usePremiumStatus();
  
  const limits = isPremium ? PREMIUM_LIMITS : FREE_LIMITS;
  
  const canAddBlock = (currentBlockCount: number) => {
    return isPremium || currentBlockCount < FREE_LIMITS.maxBlocks;
  };
  
  const canUseBlockType = (blockType: string) => {
    if (isPremium) return true;
    return !FREE_LIMITS.premiumBlocks.includes(blockType);
  };
  
  const getRemainingBlocks = (currentBlockCount: number) => {
    if (isPremium) return Infinity;
    return Math.max(0, FREE_LIMITS.maxBlocks - currentBlockCount);
  };
  
  // Get AI usage from localStorage (simple tracking)
  const getAIUsageToday = (): number => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('linkmax_ai_usage');
    if (!stored) return 0;
    
    try {
      const { date, count } = JSON.parse(stored);
      if (date === today) return count;
      return 0;
    } catch {
      return 0;
    }
  };
  
  const incrementAIUsage = () => {
    const today = new Date().toDateString();
    const current = getAIUsageToday();
    localStorage.setItem('linkmax_ai_usage', JSON.stringify({
      date: today,
      count: current + 1,
    }));
  };
  
  const canUseAI = () => {
    if (isPremium) return true;
    return getAIUsageToday() < FREE_LIMITS.maxAIRequestsPerDay;
  };
  
  const getRemainingAIRequests = () => {
    if (isPremium) return Infinity;
    return Math.max(0, FREE_LIMITS.maxAIRequestsPerDay - getAIUsageToday());
  };
  
  return {
    isPremium,
    isLoading,
    limits,
    canAddBlock,
    canUseBlockType,
    getRemainingBlocks,
    canUseAI,
    getRemainingAIRequests,
    incrementAIUsage,
    getAIUsageToday,
  };
}
