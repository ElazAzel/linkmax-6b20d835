import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';
import { Json } from '@/platform/supabase/types';
import { getTierCommissionRate, type PremiumTier } from '@/services/user';

export type TransactionType = 'income' | 'withdrawal' | 'fee' | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface WalletTransaction {
    id: string;
    wallet_id: string;
    user_id: string;
    gross_amount: number;
    fee_amount: number;
    net_amount: number;
    type: TransactionType | string;
    status: TransactionStatus;
    description: string | null;
    metadata: Record<string, unknown>;
    related_entity_id?: string | null;
    related_entity_type?: string | null;
    created_at: string;
}

export interface WalletOverview {
    wallet: {
        id: string;
        user_id: string;
        balance: number;
        currency: string;
        created_at: string | null;
        updated_at: string | null;
    } | null;
    transactions: WalletTransaction[];
    pendingGMV: number;
}

export type PayoutMethod = {
    type: 'card' | 'bank' | 'crypto' | string;
    value: string;
    details?: Record<string, unknown>;
};

// Dynamic commission rates per ADR 0026
// Starter: 7%, Pro: 1%, Business: 0%, Identity: N/A
const TIER_RATES = {
    starter: 0.07,
    pro: 0.01,
    business: 0.00,
} as const;

const DEFAULT_TAKE_RATE = TIER_RATES.starter;

/**
 * Get commission rate for a user based on their tier
 */
export async function getUserCommissionRate(userId: string): Promise<number> {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('premium_tier, is_premium')
            .eq('id', userId)
            .single();

        if (error || !data) {
            return DEFAULT_TAKE_RATE;
        }

        const tier = (data.premium_tier as PremiumTier) || (data.is_premium ? 'pro' : 'starter');
        return getTierCommissionRate(tier);
    } catch {
        return DEFAULT_TAKE_RATE;
    }
}

/**
 * Fintech Service - Handles wallet operations and ledger entries.
 * This is the foundation for the "Fintech Pivot" strategy (ADR 0026).
 */
export const fintechService = {
    async recordPendingIncome(params: {
        userId: string;
        amount: number;
        description: string;
        relatedEntityId?: string;
        relatedEntityType?: 'lead' | 'booking' | 'event' | 'wallet_transaction';
        metadata?: Record<string, unknown>;
    }) {
        try {
            // Get dynamic commission rate based on user's tier
            const commissionRate = await getUserCommissionRate(params.userId);

            // Calculate amounts per Q2 "Starter Tier" logic
            const grossAmount = params.amount;
            const feeAmount = Number((grossAmount * commissionRate).toFixed(2));
            const netAmount = grossAmount - feeAmount;

            const { data: wallet, error: walletError } = await supabase
                .from('user_wallets')
                .select('id')
                .eq('user_id', params.userId)
                .single();

            if (walletError || !wallet) {
                logger.error('Wallet not found for user', walletError);
                throw new Error('Wallet not found');
            }

            // Single insert with gross/fee/net per modern schema
            // NOTE: wallet_transactions might not be in types.ts yet
            const { data: transaction, error: txError } = await supabase
                .from('wallet_transactions')
                .insert({
                    wallet_id: wallet.id,
                    user_id: params.userId,
                    gross_amount: grossAmount,
                    fee_amount: feeAmount,
                    net_amount: netAmount,
                    type: 'payment',
                    status: 'pending',
                    description: params.description,
                    related_entity_id: params.relatedEntityId || null,
                    related_entity_type: params.relatedEntityType || null,
                    metadata: (params.metadata || {}) as Json
                })
                .select()
                .single();

            if (txError) {
                // PGRST205: Table not found, 42P01: Relation not found
                if (txError.code === 'PGRST205' || txError.code === '42P01') {
                    logger.warn('Wallet transactions table not found. Skipping transaction recording.', { data: { amount: grossAmount } });
                    return null;
                }
                throw txError;
            }

            return transaction;
        } catch (err) {
            logger.error('Failed to record pending income', err);
            throw err;
        }
    },

    async getWalletOverview(userId: string): Promise<WalletOverview> {
        try {
            const { data: wallet, error: walletError } = await supabase
                .from('user_wallets')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (walletError) {
                if (walletError.code === 'PGRST205' || walletError.code === '42P01') {
                    return { wallet: null, transactions: [], pendingGMV: 0 };
                }
                throw walletError;
            }

            const { data: transactions, error: txError } = await supabase
                .from('wallet_transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (txError) {
                if (txError.code === 'PGRST205' || txError.code === '42P01') {
                    return {
                        wallet,
                        transactions: [],
                        pendingGMV: 0,
                    };
                }
                throw txError;
            }

            const { data: pendingData, error: pendingError } = await supabase
                .from('wallet_transactions')
                .select('gross_amount, net_amount')
                .eq('user_id', userId)
                .eq('type', 'payment')
                .eq('status', 'pending');

            if (pendingError) {
                if (pendingError.code === 'PGRST205' || pendingError.code === '42P01') {
                    return {
                        wallet,
                        transactions: (transactions || []),
                        pendingGMV: 0,
                    };
                }
                throw pendingError;
            }

            const pendingGMV = (pendingData || []).reduce((acc: number, curr: { gross_amount: number | string }) => acc + Number(curr.gross_amount || 0), 0);

            return {
                wallet,
                transactions: (transactions || []),
                pendingGMV
            };
        } catch (err) {
            logger.error('Failed to get wallet overview', err);
            throw err;
        }
    },

    async requestPayout(params: { userId: string; amount: number; method: PayoutMethod; notes?: string }) {
        const { userId, amount, method, notes } = params;

        const { data: wallet } = await supabase
            .from('user_wallets')
            .select('id, balance')
            .eq('user_id', userId)
            .maybeSingle();

        if (!wallet || wallet.balance < amount) {
            throw new Error('Insufficient funds');
        }

        const { data: request, error: requestError } = await supabase
            .from('token_withdrawals')
            .insert({
                user_id: userId,
                amount,
                payment_method: method.type,
                payment_details: {
                    value: method.value,
                    ...(method.details || {}),
                    ...(notes ? { notes } : {})
                } as unknown as Json,
                status: 'pending'
            })
            .select()
            .single();

        if (requestError) throw requestError;

        return request;
    }
};
