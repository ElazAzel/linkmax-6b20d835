import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';
import { Json } from '@/integrations/supabase/types';

export type TransactionType = 'income' | 'withdrawal' | 'fee' | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface WalletTransaction {
    id: string;
    wallet_id: string;
    user_id: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    description: string;
    metadata: Record<string, unknown>;
    related_entity_id?: string;
    related_entity_type?: string;
    created_at: string;
}

export type PayoutMethod = {
    type: 'card' | 'bank' | 'crypto' | string;
    value: string;
    details?: Record<string, unknown>;
};

const DEFAULT_TAKE_RATE = 0.05; // 5% commission

/**
 * Fintech Service - Handles wallet operations and ledger entries.
 * This is the foundation for the "Fintech Pivot" strategy.
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
            const { data: wallet, error: walletError } = await (supabase as any)
                .from('user_wallets')
                .select('id')
                .eq('user_id', params.userId)
                .single();

            if (walletError || !wallet) {
                logger.error('Wallet not found for user', walletError);
                throw new Error('Wallet not found');
            }

            const { data: transaction, error: txError } = await (supabase as any)
                .from('wallet_transactions')
                .insert({
                    wallet_id: wallet.id,
                    user_id: params.userId,
                    amount: params.amount,
                    type: 'income',
                    status: 'pending',
                    description: params.description,
                    related_entity_id: params.relatedEntityId,
                    related_entity_type: params.relatedEntityType,
                    metadata: (params.metadata || {}) as Json
                })
                .select()
                .single();

            if (txError) throw txError;

            const feeAmount = params.amount * DEFAULT_TAKE_RATE;
            await (supabase as any)
                .from('wallet_transactions')
                .insert({
                    wallet_id: wallet.id,
                    user_id: params.userId,
                    amount: -feeAmount,
                    type: 'fee',
                    status: 'pending',
                    description: `Platform fee (5%) for: ${params.description}`,
                    related_entity_id: transaction.id,
                    related_entity_type: 'wallet_transaction',
                    metadata: { parent_tx_id: transaction.id } as Json
                });

            return transaction;
        } catch (err) {
            logger.error('Failed to record pending income', err);
            throw err;
        }
    },

    async getWalletOverview(userId: string) {
        try {
            const { data: wallet, error: walletError } = await (supabase as any)
                .from('user_wallets')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (walletError) throw walletError;

            const { data: transactions, error: txError } = await (supabase as any)
                .from('wallet_transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (txError) throw txError;

            const { data: pendingData } = await (supabase as any)
                .from('wallet_transactions')
                .select('amount')
                .eq('user_id', userId)
                .eq('type', 'income')
                .eq('status', 'pending');

            const pendingGMV = (pendingData || []).reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

            return {
                wallet,
                transactions,
                pendingGMV
            };
        } catch (err) {
            logger.error('Failed to get wallet overview', err);
            throw err;
        }
    },

    async requestPayout(params: { userId: string; amount: number; method: PayoutMethod; notes?: string }) {
        const { userId, amount, method, notes } = params;

        const { data: wallet } = await (supabase as any)
            .from('user_wallets')
            .select('id, balance')
            .eq('user_id', userId)
            .single();

        if (!wallet || wallet.balance < amount) {
            throw new Error('Insufficient funds');
        }

        const { data: request, error: requestError } = await (supabase as any)
            .from('payout_requests')
            .insert({
                user_id: userId,
                wallet_id: wallet.id,
                amount,
                payout_method: method as Json,
                notes,
                status: 'requested'
            })
            .select()
            .single();

        if (requestError) throw requestError;

        return request;
    }
};
