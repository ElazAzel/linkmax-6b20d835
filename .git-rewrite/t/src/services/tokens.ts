import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/logger';

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
  sellerId?: string;
  buyerId?: string;
  itemType?: string;
  itemId?: string;
  originalPrice?: number;
  platformFee?: number;
  netAmount?: number;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  paymentMethod?: string;
  paymentDetails?: Record<string, unknown>;
  adminNotes?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
}

// Updated token rewards - new rates
export const PREMIUM_COST = 100; // 100 tokens = 1 day premium
export const PLATFORM_FEE_PERCENT = 4; // 4% platform fee
export const TOKEN_TO_TENGE_RATE = 1; // 1 token = 1 tenge

export const TOKEN_REWARDS = {
  daily_visit: 0.9,        // Daily login
  add_block: 1.8,          // Add block (once per day)
  use_ai: 0.5,             // Use AI feature
  referral: 50,            // Friend publishes page with min 1 block
  achievement_common: 10,
  achievement_rare: 25,
  achievement_epic: 50,
  achievement_legendary: 100,
} as const;

// Referral bonus: every 3 referrals = 1 day premium
export const REFERRAL_PREMIUM_THRESHOLD = 3;

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
    logger.error('Error getting token balance', error, { context: 'tokens', data: { userId } });
    return null;
  }

  return {
    balance: data.balance,
    totalEarned: data.total_earned,
    totalSpent: data.total_spent,
  };
}

export async function getTokenTransactions(userId: string, limit = 50): Promise<TokenTransaction[]> {
  const { data, error } = await supabase
    .from('token_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error getting transactions', error, { context: 'tokens', data: { userId } });
    return [];
  }

  return (data || []).map(t => ({
    id: t.id,
    amount: t.amount,
    type: t.type as 'earn' | 'spend' | 'bonus',
    source: t.source,
    description: t.description,
    createdAt: t.created_at,
    sellerId: t.seller_id || undefined,
    buyerId: t.buyer_id || undefined,
    itemType: t.item_type || undefined,
    itemId: t.item_id || undefined,
    originalPrice: t.original_price || undefined,
    platformFee: t.platform_fee || undefined,
    netAmount: t.net_amount || undefined,
  }));
}

// Claim daily token reward with once-per-day limit
export async function claimDailyReward(
  userId: string,
  actionType: 'daily_visit' | 'add_block' | 'use_ai'
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  const amount = TOKEN_REWARDS[actionType];

  const { data, error } = await supabase.rpc('claim_daily_token_reward', {
    p_user_id: userId,
    p_amount: amount,
    p_action_type: actionType,
  });

  if (error) {
    logger.error('Error claiming daily reward', error, { context: 'tokens', data: { userId, actionType } });
    return { success: false, error: 'server_error' };
  }

  const result = data as { success: boolean; error?: string; new_balance?: number };
  return {
    success: result.success,
    error: result.error,
    newBalance: result.new_balance,
  };
}

// Legacy addTokens for achievements and referrals (not daily limited)
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
    logger.error('Error adding tokens', error, { context: 'tokens', data: { userId, amount, source } });
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
    logger.error('Error converting to premium', error, { context: 'tokens', data: { userId } });
    return { success: false, error: 'server_error' };
  }

  const result = data as { success: boolean; error?: string; premium_until?: string };
  return {
    success: result.success,
    error: result.error,
    premiumUntil: result.premium_until,
  };
}

// Marketplace purchase with platform fee
export async function purchaseItem(
  buyerId: string,
  sellerId: string | null,
  itemType: 'template' | 'product' | 'block_access' | 'premium',
  itemId: string,
  price: number,
  description?: string
): Promise<{ success: boolean; error?: string; totalCost?: number; platformFee?: number }> {
  const { data, error } = await supabase.rpc('process_marketplace_purchase', {
    p_buyer_id: buyerId,
    p_seller_id: sellerId,
    p_item_type: itemType,
    p_item_id: itemId,
    p_price: price,
    p_description: description || null,
  });

  if (error) {
    logger.error('Error processing purchase', error, { context: 'tokens', data: { buyerId, itemType, price } });
    return { success: false, error: 'server_error' };
  }

  const result = data as { success: boolean; error?: string; total_cost?: number; platform_fee?: number };
  return {
    success: result.success,
    error: result.error,
    totalCost: result.total_cost,
    platformFee: result.platform_fee,
  };
}

// Calculate price with platform fee for display
export function calculatePriceWithFee(basePrice: number): {
  basePrice: number;
  platformFee: number;
  totalPrice: number;
} {
  const platformFee = Math.round(basePrice * PLATFORM_FEE_PERCENT / 100 * 100) / 100;
  return {
    basePrice,
    platformFee,
    totalPrice: basePrice + platformFee,
  };
}

// Check if user can withdraw (premium only)
export async function requestWithdrawal(
  userId: string,
  amount: number,
  paymentMethod: string,
  paymentDetails: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  // First check if user is premium
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('is_premium')
    .eq('id', userId)
    .single();

  if (profileError || !profile?.is_premium) {
    return { success: false, error: 'premium_required' };
  }

  // Check balance
  const balance = await getTokenBalance(userId);
  if (!balance || balance.balance < amount) {
    return { success: false, error: 'insufficient_balance' };
  }

  // Create withdrawal request
  const { error } = await supabase
    .from('token_withdrawals')
    .insert([{
      user_id: userId,
      amount,
      payment_method: paymentMethod,
      payment_details: JSON.parse(JSON.stringify(paymentDetails)),
    }]);

  if (error) {
    logger.error('Error creating withdrawal request', error, { context: 'tokens', data: { userId, amount } });
    return { success: false, error: 'server_error' };
  }

  return { success: true };
}

// Get user's withdrawal history
export async function getWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
  const { data, error } = await supabase
    .from('token_withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error getting withdrawals', error, { context: 'tokens', data: { userId } });
    return [];
  }

  return (data || []).map(w => ({
    id: w.id,
    userId: w.user_id,
    amount: w.amount,
    status: w.status as 'pending' | 'approved' | 'rejected' | 'completed',
    paymentMethod: w.payment_method || undefined,
    paymentDetails: w.payment_details as Record<string, unknown> || undefined,
    adminNotes: w.admin_notes || undefined,
    processedBy: w.processed_by || undefined,
    processedAt: w.processed_at || undefined,
    createdAt: w.created_at,
  }));
}

// Admin: Get token analytics
export async function getTokenAnalytics(startDate?: string, endDate?: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.rpc('get_token_analytics', {
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  });

  if (error) {
    logger.error('Error getting token analytics', error, { context: 'tokens' });
    return null;
  }

  return data as Record<string, unknown>;
}

// Admin: Get all pending withdrawals
export async function getAllWithdrawals(status?: string): Promise<WithdrawalRequest[]> {
  let query = supabase
    .from('token_withdrawals')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error getting withdrawals', error, { context: 'tokens' });
    return [];
  }

  return (data || []).map(w => ({
    id: w.id,
    userId: w.user_id,
    amount: w.amount,
    status: w.status as 'pending' | 'approved' | 'rejected' | 'completed',
    paymentMethod: w.payment_method || undefined,
    paymentDetails: w.payment_details as Record<string, unknown> || undefined,
    adminNotes: w.admin_notes || undefined,
    processedBy: w.processed_by || undefined,
    processedAt: w.processed_at || undefined,
    createdAt: w.created_at,
  }));
}

// Admin: Process withdrawal
export async function processWithdrawal(
  withdrawalId: string,
  status: 'approved' | 'rejected' | 'completed',
  adminId: string,
  notes?: string
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('token_withdrawals')
    .update({
      status,
      admin_notes: notes,
      processed_by: adminId,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', withdrawalId);

  if (error) {
    logger.error('Error processing withdrawal', error, { context: 'tokens', data: { withdrawalId, status } });
    return { success: false };
  }

  return { success: true };
}

// Get all transactions for admin
export async function getAllTransactions(
  limit = 100,
  offset = 0,
  filters?: { type?: string; itemType?: string }
): Promise<TokenTransaction[]> {
  let query = supabase
    .from('token_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.itemType) {
    query = query.eq('item_type', filters.itemType);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error getting all transactions', error, { context: 'tokens' });
    return [];
  }

  return (data || []).map(t => ({
    id: t.id,
    amount: t.amount,
    type: t.type as 'earn' | 'spend' | 'bonus',
    source: t.source,
    description: t.description,
    createdAt: t.created_at,
    sellerId: t.seller_id || undefined,
    buyerId: t.buyer_id || undefined,
    itemType: t.item_type || undefined,
    itemId: t.item_id || undefined,
    originalPrice: t.original_price || undefined,
    platformFee: t.platform_fee || undefined,
    netAmount: t.net_amount || undefined,
  }));
}

export function canAffordPremium(balance: number): boolean {
  return balance >= PREMIUM_COST;
}
