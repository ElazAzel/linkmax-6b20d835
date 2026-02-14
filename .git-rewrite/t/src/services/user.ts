/**
 * User service - handles user profile and authentication-related operations
 */
import { supabase } from '@/integrations/supabase/client';
import type { DbUserProfile, PremiumStatusResult, ApiResult } from '@/types/api';

// ============= Types =============
export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_premium: boolean | null;
  trial_ends_at: string | null;
  email_notifications_enabled: boolean | null;
  telegram_notifications_enabled: boolean | null;
  telegram_chat_id: string | null;
  push_notifications_enabled: boolean | null;
  push_subscription: unknown | null;
  friends_count: number | null;
}

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

  if (username.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} characters` };
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Username must be less than ${USERNAME_MAX_LENGTH} characters` };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain lowercase letters, numbers, hyphens, and underscores',
    };
  }

  return { valid: true };
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

    return { data: data as UserProfile | null, error: null };
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
      return { isPremium: false, tier: 'free', trialEndsAt: null, inTrial: false };
    }

    const now = new Date();
    const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
    const premiumExpiresAt = (data as { premium_expires_at?: string }).premium_expires_at 
      ? new Date((data as { premium_expires_at?: string }).premium_expires_at!) 
      : null;
    
    const inTrial = trialEndsAt ? trialEndsAt > now : false;
    const premiumActive = premiumExpiresAt ? premiumExpiresAt > now : false;
    
    // Determine tier - Business tier is now merged into Pro
    const dbTier = (data as { premium_tier?: string }).premium_tier as 'free' | 'pro' | 'business' | undefined;
    
    let tier: 'free' | 'pro' = 'free';
    let isPremium = false;
    
    // Check if user has active premium
    const hasActivePremium = premiumActive || data.is_premium || inTrial;
    
    if (hasActivePremium) {
      isPremium = true;
      // Both 'business' and 'pro' are now 'pro' tier (business merged into pro)
      tier = 'pro';
    }

    return { isPremium, tier, trialEndsAt: data.trial_ends_at, inTrial };
  } catch (error) {
    return { isPremium: false, tier: 'free', trialEndsAt: null, inTrial: false };
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

