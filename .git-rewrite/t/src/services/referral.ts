/**
 * Referral service - handles referral code generation and application
 */
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/logger';

export interface ReferralStats {
  code: string;
  referralsCount: number;
  bonusDaysEarned: number;
}

export interface ApplyReferralResult {
  success: boolean;
  error?: 'invalid_code' | 'already_referred' | 'self_referral';
  bonusDays?: number;
}

/**
 * Generate or get existing referral code for user
 */
export async function getOrCreateReferralCode(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('generate_referral_code', {
      p_user_id: userId
    });

    if (error) {
      logger.error('Error generating referral code', error, { context: 'referral', data: { userId } });
      return null;
    }

    return data as string;
  } catch (error) {
    logger.error('Error in getOrCreateReferralCode', error, { context: 'referral', data: { userId } });
    return null;
  }
}

/**
 * Get referral stats for user
 */
export async function getReferralStats(userId: string): Promise<ReferralStats | null> {
  try {
    // Get referral code
    const { data: codeData } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', userId)
      .maybeSingle();

    if (!codeData) {
      return null;
    }

    // Count referrals
    const { count } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', userId);

    return {
      code: codeData.code,
      referralsCount: count || 0,
      bonusDaysEarned: (count || 0) * 3
    };
  } catch (error) {
    logger.error('Error getting referral stats', error, { context: 'referral', data: { userId } });
    return null;
  }
}

/**
 * Apply referral code for new user
 */
export async function applyReferralCode(
  code: string,
  userId: string
): Promise<ApplyReferralResult> {
  try {
    const { data, error } = await supabase.rpc('apply_referral', {
      p_code: code,
      p_referred_user_id: userId
    });

    if (error) {
      logger.error('Error applying referral', error, { context: 'referral' });
      return { success: false, error: 'invalid_code' };
    }

    const result = data as { success: boolean; error?: string; bonus_days?: number };

    if (!result.success) {
      return {
        success: false,
        error: result.error as ApplyReferralResult['error']
      };
    }

    return {
      success: true,
      bonusDays: result.bonus_days
    };
  } catch (error) {
    logger.error('Error in applyReferralCode:', error, { context: 'referral' });
    return { success: false, error: 'invalid_code' };
  }
}

/**
 * Check if user was referred
 */
export async function wasUserReferred(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', userId)
      .maybeSingle();

    return !!data;
  } catch (error) {
    logger.error('Error checking referral status', error, { context: 'referral', data: { userId } });
    return false;
  }
}
