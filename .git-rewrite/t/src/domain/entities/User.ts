/**
 * User Entity - Core domain model for users
 * Pure business logic, no external dependencies
 */

// ============= Value Objects =============

export interface UserProfile {
  id: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPremium: boolean;
  trialEndsAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PremiumStatus {
  isPremium: boolean;
  inTrial: boolean;
  trialEndsAt: string | null;
  daysRemaining?: number;
}

// ============= Username Validation =============

const USERNAME_REGEX = /^[a-z0-9_-]+$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;

export interface UsernameValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate username format and length
 */
export function validateUsername(username: string): UsernameValidationResult {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  if (trimmed.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} characters` };
  }

  if (trimmed.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Username must be less than ${USERNAME_MAX_LENGTH} characters` };
  }

  if (!USERNAME_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Username can only contain lowercase letters, numbers, hyphens, and underscores',
    };
  }

  return { valid: true };
}

/**
 * Normalize username to lowercase
 */
export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim();
}

// ============= Premium Status Logic =============

/**
 * Calculate premium status from profile data
 */
export function calculatePremiumStatus(profile: UserProfile | null): PremiumStatus {
  if (!profile) {
    return { isPremium: false, inTrial: false, trialEndsAt: null };
  }

  const now = new Date();
  const trialEndsAt = profile.trialEndsAt ? new Date(profile.trialEndsAt) : null;
  const inTrial = trialEndsAt ? trialEndsAt > now : false;
  const isPremium = profile.isPremium || inTrial;

  let daysRemaining: number | undefined;
  if (trialEndsAt && inTrial) {
    daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    isPremium,
    inTrial,
    trialEndsAt: profile.trialEndsAt,
    daysRemaining,
  };
}

/**
 * Check if user can access premium features
 */
export function canAccessPremiumFeatures(status: PremiumStatus): boolean {
  return status.isPremium;
}

/**
 * Check if trial is about to expire (within 24 hours)
 */
export function isTrialExpiringSoon(status: PremiumStatus): boolean {
  if (!status.inTrial || !status.daysRemaining) {
    return false;
  }
  return status.daysRemaining <= 1;
}

// ============= Freemium Limits =============

export type PremiumTier = 'free' | 'pro' | 'business';

export interface FreemiumLimits {
  maxBlocks: number;
  maxAIPageGenerationsPerMonth: number;
  canUseAnalytics: boolean;
  canUseCRM: boolean;
  showWatermark: boolean;
  maxLeadsPerMonth: number;
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
}

export const FREE_TIER_LIMITS: FreemiumLimits = {
  maxBlocks: Infinity,
  maxAIPageGenerationsPerMonth: 1,
  canUseAnalytics: false,
  canUseCRM: false,
  showWatermark: true,
  maxLeadsPerMonth: 0,
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
};

// Premium gets ALL Business features except white label
export const PRO_TIER_LIMITS: FreemiumLimits = {
  maxBlocks: Infinity,
  maxAIPageGenerationsPerMonth: 5,
  canUseAnalytics: true,
  canUseCRM: true,
  showWatermark: false,
  maxLeadsPerMonth: Infinity,
  canUseScheduler: true,
  canUsePixels: true,
  canUseCustomDomain: true,
  canUseChatbot: true,
  canUseAutoNotifications: true,
  canUsePayments: true,
  canUseWhiteLabel: false, // Only Business
  canUseMultiPage: true,
  canUseVerificationBadge: true,
  canUsePremiumFrames: true,
  canUseAdvancedThemes: true,
};

// Business only adds white label
export const BUSINESS_TIER_LIMITS: FreemiumLimits = {
  maxBlocks: Infinity,
  maxAIPageGenerationsPerMonth: Infinity,
  canUseAnalytics: true,
  canUseCRM: true,
  showWatermark: false,
  maxLeadsPerMonth: Infinity,
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
};

/**
 * Get user's limits based on tier
 */
export function getUserLimits(status: PremiumStatus & { tier?: PremiumTier }): FreemiumLimits {
  if (status.tier === 'business') return BUSINESS_TIER_LIMITS;
  if (status.tier === 'pro' || status.isPremium) return PRO_TIER_LIMITS;
  return FREE_TIER_LIMITS;
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: PremiumTier): string {
  switch (tier) {
    case 'business': return 'BUSINESS';
    case 'pro': return 'PRO';
    default: return 'BASIC';
  }
}
