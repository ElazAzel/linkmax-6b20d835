/**
 * User Entity - Core domain model for users
 * Pure business logic, no external dependencies
 */
import {
  getTierCommissionRate as getContractTierCommissionRate,
  getTierDisplayName as getContractTierDisplayName,
  type AppPremiumTier,
} from '@/domain/billing/tiers';

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

/**
 * Unified CRM inbound limit for free tier.
 * "Inbound" = leads + bookings + event registrations created by end-customers.
 * Scope: per owner user_id, per calendar month (UTC).
 */
export const CRM_FREE_INBOUND_LIMIT = 50;

export type PremiumTier = AppPremiumTier;

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
  canUseCRM: true,
  showWatermark: true,
  maxLeadsPerMonth: 50,
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

// Pro tier includes ALL premium features (AI capped at 10/mo)
export const PRO_TIER_LIMITS: FreemiumLimits = {
  maxBlocks: Infinity,
  maxAIPageGenerationsPerMonth: 10,
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
  canUseWhiteLabel: true,
  canUseMultiPage: true,
  canUseVerificationBadge: true,
  canUsePremiumFrames: true,
  canUseAdvancedThemes: true,
};

/**
 * Get user's limits based on tier
 */
export function getUserLimits(status: PremiumStatus & { tier?: PremiumTier }): FreemiumLimits {
  if (status.tier === 'starter' || status.tier === 'pro' || status.tier === 'business' || status.isPremium) {
    return PRO_TIER_LIMITS;
  }
  return FREE_TIER_LIMITS;
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: PremiumTier): string {
  return getContractTierDisplayName(tier);
}

/**
 * Get commission rate based on tier (per ADR 0026)
 * Starter: 7%, Pro: 1%, Business: 0%
 */
export function getTierCommissionRate(tier: PremiumTier): number {
  return getContractTierCommissionRate(tier);
}
