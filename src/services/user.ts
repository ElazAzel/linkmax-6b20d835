/**
 * User service - handles user profile and authentication-related operations
 */
import { supabase } from '@/platform/supabase/client';
import type { AppDatabase } from '@/platform/supabase/extended-types';
import type { PremiumStatusResult, ApiResult } from '@/types/api';
import {
  normalizeAppPremiumTier,
  toDatabasePremiumTier,
  type AppPremiumTier,
  type DatabasePremiumTier,
} from '@/domain/billing/tiers';
import {
  calculatePremiumStatus as domainCalculatePremiumStatus,
  getUserLimits as domainGetUserLimits,
  getTierCommissionRate as domainGetTierCommissionRate,
  validateUsername as domainValidateUsername,
  normalizeUsername as domainNormalizeUsername,
  type PremiumStatus,
  type FreemiumLimits,
  type PremiumTier,
  FREE_TIER_LIMITS,
  STARTER_TIER_LIMITS,
  PRO_TIER_LIMITS,
  CRM_FREE_INBOUND_LIMIT,
} from '@/domain/entities';
import { normalizeError } from '@/domain/value-objects/Result';

// Re-export domain constants and types for backward compatibility
export { FREE_TIER_LIMITS, STARTER_TIER_LIMITS, PRO_TIER_LIMITS, CRM_FREE_INBOUND_LIMIT };
export type { PremiumStatus, FreemiumLimits, PremiumTier };

// ============= DB Types (kept in service layer) =============
export type UserProfile = AppDatabase['public']['Tables']['user_profiles']['Row'];

export interface UpdateUsernameResult {
  success: boolean;
  error?: string;
}

/**
 * Validate username format and length (delegates to domain)
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  return domainValidateUsername(username);
}

/**
 * Normalize username to lowercase (delegates to domain)
 */
export function normalizeUsername(username: string): string {
  return domainNormalizeUsername(username);
}

/**
 * Calculate premium status from DB profile data (adapts DB shape to domain)
 */
export function calculatePremiumStatus(profile: { is_premium: boolean; trial_ends_at: string | null } | null): PremiumStatus {
  if (!profile) return domainCalculatePremiumStatus(null);
  return domainCalculatePremiumStatus({
    isPremium: profile.is_premium,
    trialEndsAt: profile.trial_ends_at,
  });
}

/**
 * Get user's limits based on tier (delegates to domain)
 */
export function getUserLimits(status: PremiumStatus & { tier?: PremiumTier }): FreemiumLimits {
  return domainGetUserLimits(status);
}

/**
 * Get commission rate based on tier (delegates to domain)
 */
export function getTierCommissionRate(tier: PremiumTier): number {
  return domainGetTierCommissionRate(tier);
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
      return { data: null, error: normalizeError(error) };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
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
    let tier: PremiumTier = 'identity';
    let isPremium = false;
    
    // Check if user has active premium
    // Only trust is_premium flag if there's no expiration date set, or if it hasn't expired
    const isPremiumFlagValid = data.is_premium && (!premiumExpiresAt || premiumActive);
    const hasActivePremium = premiumActive || isPremiumFlagValid || inTrial;
    
    // Map tier from profile
    const profileTier = normalizeAppPremiumTier(data.premium_tier);
    
    if (hasActivePremium) {
      isPremium = true;
      tier = profileTier === 'identity' ? 'pro' : profileTier; // Default for legacy premium users
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

export async function updateUserPremiumTier(
  userId: string,
  tier: PremiumTier | DatabasePremiumTier
): Promise<ApiResult<boolean>> {
  try {
    const dbTier = toDatabasePremiumTier(tier);
    const isPaidTier = dbTier === 'pro' || dbTier === 'business';
    const updateData: Partial<AppDatabase['public']['Tables']['user_profiles']['Update']> = {
      premium_tier: dbTier,
      is_premium: isPaidTier,
    };

    if (!isPaidTier) {
      updateData.premium_expires_at = null;
      updateData.trial_ends_at = null;
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      return { data: null, error: normalizeError(error) };
    }

    return { data: true, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export function activateStarterTier(userId: string): Promise<ApiResult<boolean>> {
  return updateUserPremiumTier(userId, 'starter');
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
      return { data: null, error: normalizeError(error) };
    }

    return { data: enabled, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
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
      return { data: null, error: normalizeError(error) };
    }

    return { data: enabled, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
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
      return { data: null, error: normalizeError(error) };
    }

    return { data: enabled, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

