/**
 * User service - handles user profile and authentication-related operations
 */
import { supabase } from '@/platform/supabase/client';
import type { AppDatabase } from '@/platform/supabase/extended-types';
import type { PremiumStatusResult, ApiResult } from '@/types/api';

// ============= Domain Types & Constants =============

export type PremiumTier = 'identity' | 'starter' | 'pro' | 'business';

export interface PremiumStatus {
  isPremium: boolean;
  inTrial: boolean;
  trialEndsAt: string | null;
  daysRemaining?: number;
}

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

export const CRM_FREE_INBOUND_LIMIT = 50;

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

// ============= Types =============
export type UserProfile = AppDatabase['public']['Tables']['user_profiles']['Row'];

export interface UpdateUsernameResult {
  success: boolean;
  error?: string;
}

// ============= Validation =============

const USERNAME_REGEX = /^[a-z0-9_-]+$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;

/**
 * Validate username format and length
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
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

/**
 * Calculate premium status from profile data (pure function)
 */
export function calculatePremiumStatus(profile: { is_premium: boolean; trial_ends_at: string | null } | null): PremiumStatus {
  if (!profile) {
    return { isPremium: false, inTrial: false, trialEndsAt: null };
  }

  const now = new Date();
  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const inTrial = trialEndsAt ? trialEndsAt > now : false;
  const isPremium = profile.is_premium || inTrial;

  let daysRemaining: number | undefined;
  if (trialEndsAt && inTrial) {
    daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    isPremium,
    inTrial,
    trialEndsAt: profile.trial_ends_at,
    daysRemaining,
  };
}

/**
 * Get user's limits based on tier
 */
export function getUserLimits(status: PremiumStatus & { tier?: PremiumTier }): FreemiumLimits {
  if (status.tier === 'pro' || status.isPremium) return PRO_TIER_LIMITS;
  return FREE_TIER_LIMITS;
}

/**
 * Get commission rate based on tier (per ADR 0026)
 * Starter: 7%, Pro: 1%, Business: 0%
 */
export function getTierCommissionRate(tier: PremiumTier): number {
  switch (tier) {
    case 'business': return 0;
    case 'pro': return 0.01;
    case 'starter': return 0.07;
    default: return 0;
  }
}

// ============= Helper Functions =============

/**
 * Wrap error in standard Error object
 */
function wrapError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error('Unknown error');
}

// ============= API Functions =============

/**
 * Load user profile by ID
 */
export async function loadUserProfile(userId: string): Promise<ApiResult<UserProfile>> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return { data: null, error: wrapError(error) };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: wrapError(error) };
  }
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailability(
  username: string,
  currentUserId: string
): Promise<boolean> {
  const { data: existingUser } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .neq('id', currentUserId)
    .maybeSingle();

  return !existingUser;
}

/**
 * Update user's username and sync with page slug
 */
export async function updateUsername(
  userId: string,
  username: string
): Promise<UpdateUsernameResult> {
  const validation = validateUsername(username);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const normalizedUsername = username.toLowerCase();

  // Check availability
  const isAvailable = await checkUsernameAvailability(normalizedUsername, userId);
  if (!isAvailable) {
    return { success: false, error: 'This username is already taken' };
  }

  try {
    // Update username in profile
    const { error: profileError } = await supabase.from('user_profiles').upsert({
      id: userId,
      username: normalizedUsername,
    });

    if (profileError) {
      return { success: false, error: 'Failed to update username' };
    }

    // Sync page slug with new username
    await supabase.from('pages').update({ slug: normalizedUsername }).eq('user_id', userId);

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update username' };
  }
}

/**
 * Check user's premium status
 */
export async function checkPremiumStatus(userId: string): Promise<PremiumStatusResult> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_premium, trial_ends_at, premium_tier, premium_expires_at')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return { isPremium: false, tier: 'identity', trialEndsAt: null, inTrial: false };
    }

    const now = new Date();
    const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
    const premiumExpiresAt = data.premium_expires_at ? new Date(data.premium_expires_at) : null;
    
    const inTrial = trialEndsAt ? trialEndsAt > now : false;
    const premiumActive = premiumExpiresAt ? premiumExpiresAt > now : false;
    
    // Determine tier based on profile data
    let tier: 'identity' | 'starter' | 'pro' | 'business' = 'identity';
    let isPremium = false;
    
    // Check if user has active premium
    // Only trust is_premium flag if there's no expiration date set, or if it hasn't expired
    const isPremiumFlagValid = data.is_premium && (!premiumExpiresAt || premiumActive);
    const hasActivePremium = premiumActive || isPremiumFlagValid || inTrial;
    
    // Map tier from profile
    const profileTier = data.premium_tier;
    
    if (hasActivePremium) {
      isPremium = true;
      // Map to new tier system
      if (profileTier === 'business') tier = 'business';
      else if (profileTier === 'pro') tier = 'pro';
      else if (profileTier === 'starter') tier = 'starter';
      else tier = 'pro'; // Default for legacy premium users
    } else if (profileTier === 'starter') {
      // Starter is free tier with commission-based monetization
      tier = 'starter';
      isPremium = false; // Starter is not "premium" but has CRM access
    }

    return { isPremium, tier, trialEndsAt: data.trial_ends_at || null, inTrial };
  } catch (error) {
    return { isPremium: false, tier: 'identity', trialEndsAt: null, inTrial: false };
  }
}

/**
 * Update email notification preference
 */
export async function updateEmailNotifications(
  userId: string,
  enabled: boolean
): Promise<ApiResult<boolean>> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ email_notifications_enabled: enabled })
      .eq('id', userId);

    if (error) {
      return { data: null, error: wrapError(error) };
    }

    return { data: enabled, error: null };
  } catch (error) {
    return { data: null, error: wrapError(error) };
  }
}

/**
 * Update Telegram notification settings
 */
export async function updateTelegramNotifications(
  userId: string,
  enabled: boolean,
  chatId: string | null
): Promise<ApiResult<boolean>> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        telegram_notifications_enabled: enabled,
        telegram_chat_id: chatId
      })
      .eq('id', userId);

    if (error) {
      return { data: null, error: wrapError(error) };
    }

    return { data: enabled, error: null };
  } catch (error) {
    return { data: null, error: wrapError(error) };
  }
}

/**
 * Update Kaspi QR widget visibility preference
 */
export async function updateKaspiWidget(
  userId: string,
  enabled: boolean
): Promise<ApiResult<boolean>> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ kaspi_widget_enabled: enabled })
      .eq('id', userId);

    if (error) {
      return { data: null, error: wrapError(error) };
    }

    return { data: enabled, error: null };
  } catch (error) {
    return { data: null, error: wrapError(error) };
  }
}

