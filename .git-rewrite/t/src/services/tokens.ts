import { supabase } from '@/integrations/supabase/client';

export interface TokenBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface TokenTransaction {
  id: string;
  amount: number;
  type: 'earn' | 'spend' | 'bonus';
  source: string;
  description: string | null;
  createdAt: string;
}

export const PREMIUM_COST = 100; // 100 Linkkon = 1 day premium

export const TOKEN_REWARDS = {
  daily_visit: 5,
  add_block: 10,
  edit_profile: 5,
  share_page: 10,
  use_ai: 15,
  referral: 50,
  achievement_common: 10,
  achievement_rare: 25,
  achievement_epic: 50,
  achievement_legendary: 100,
} as const;

export async function getTokenBalance(userId: string): Promise<TokenBalance | null> {
  const { data, error } = await supabase
    .from('user_tokens')
    .select('balance, total_earned, total_spent')
    .eq('user_id', userId)
    .single();

  if (error) {
    // Create token record if doesn't exist
    if (error.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('user_tokens')
        .insert({ user_id: userId, balance: 0, total_earned: 0, total_spent: 0 });
      
      if (!insertError) {
        return { balance: 0, totalEarned: 0, totalSpent: 0 };
      }
    }
    console.error('Error getting token balance:', error);
    return null;
  }

  return {
    balance: data.balance,
    totalEarned: data.total_earned,
    totalSpent: data.total_spent,
  };
}

export async function getTokenTransactions(userId: string, limit = 20): Promise<TokenTransaction[]> {
  const { data, error } = await supabase
    .from('token_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting transactions:', error);
    return [];
  }

  return (data || []).map(t => ({
    id: t.id,
    amount: t.amount,
    type: t.type as 'earn' | 'spend' | 'bonus',
    source: t.source,
    description: t.description,
    createdAt: t.created_at,
  }));
}

export async function addTokens(
  userId: string,
  amount: number,
  source: string,
  description?: string
): Promise<{ success: boolean; newBalance?: number }> {
  const { data, error } = await supabase.rpc('add_linkkon_tokens', {
    p_user_id: userId,
    p_amount: amount,
    p_source: source,
    p_description: description || null,
  });

  if (error) {
    console.error('Error adding tokens:', error);
    return { success: false };
  }

  const result = data as { success: boolean; new_balance?: number };
  return { success: result.success, newBalance: result.new_balance };
}

export async function convertToPremium(userId: string): Promise<{
  success: boolean;
  error?: string;
  premiumUntil?: string;
}> {
  const { data, error } = await supabase.rpc('convert_tokens_to_premium', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error converting to premium:', error);
    return { success: false, error: 'server_error' };
  }

  const result = data as { success: boolean; error?: string; premium_until?: string };
  return {
    success: result.success,
    error: result.error,
    premiumUntil: result.premium_until,
  };
}

export function canAffordPremium(balance: number): boolean {
  return balance >= PREMIUM_COST;
}
