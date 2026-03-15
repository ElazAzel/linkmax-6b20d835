import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fintechService } from '../fintech';
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn()
    }
}));

describe('fintechService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(supabase.from).mockReset();
    });

    describe('recordPendingIncome', () => {
        const mockParams = {
            userId: 'user-123',
            amount: 1000,
            description: 'Test Booking',
            relatedEntityId: 'booking-456',
            relatedEntityType: 'booking' as const
        };

        it('should throw error if wallet not found', async () => {
            const mockFrom = vi.mocked(supabase.from);

            // 1. getUserCommissionRate calls user_profiles
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { premium_tier: 'starter' }, error: null })
            } as any);

            // 2. recordPendingIncome calls user_wallets
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
            } as any);

            await expect(fintechService.recordPendingIncome(mockParams)).rejects.toThrow('Wallet not found');
            expect(logger.error).toHaveBeenCalled();
        });

        it('should create transaction with fee calculation on success (Starter 7%)', async () => {
            const mockWallet = { id: 'wallet-789' };
            const mockTransaction = { id: 'tx-001' };
            const mockProfile = { premium_tier: 'starter' };

            const mockFrom = vi.mocked(supabase.from);

            // 1. getUserCommissionRate calls user_profiles
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
            } as any);

            // 2. recordPendingIncome calls user_wallets
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockWallet, error: null })
            } as any);

            // 3. Chain for main transaction creation (insert)
            mockFrom.mockReturnValueOnce({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null })
            } as any);

            const result = await fintechService.recordPendingIncome(mockParams);

            expect(result).toEqual(mockTransaction);
            expect(mockFrom).toHaveBeenCalledWith('user_profiles');
            expect(mockFrom).toHaveBeenCalledWith('user_wallets');
            expect(mockFrom).toHaveBeenCalledWith('wallet_transactions');

            const insertCall = vi.mocked(mockFrom).mock.results[2].value.insert;
            expect(insertCall).toHaveBeenCalledWith(expect.objectContaining({
                gross_amount: 1000,
                fee_amount: 70, // 7% of 1000
                net_amount: 930
            }));
        });

        it('should create transaction with fee calculation on success (Pro 1%)', async () => {
            const mockWallet = { id: 'wallet-789' };
            const mockTransaction = { id: 'tx-002' };
            const mockProfile = { premium_tier: 'pro' };

            const mockFrom = vi.mocked(supabase.from);

            // 1. getUserCommissionRate calls user_profiles
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
            } as any);

            // 2. recordPendingIncome calls user_wallets
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockWallet, error: null })
            } as any);

            // 3. Chain for main transaction creation (insert)
            mockFrom.mockReturnValueOnce({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null })
            } as any);

            const result = await fintechService.recordPendingIncome(mockParams);

            expect(result).toEqual(mockTransaction);

            const insertCall = vi.mocked(mockFrom).mock.results[2].value.insert;
            expect(insertCall).toHaveBeenCalledWith(expect.objectContaining({
                gross_amount: 1000,
                fee_amount: 10, // 1% of 1000
                net_amount: 990
            }));
        });
    });

    describe('getWalletOverview', () => {
        it('should return wallet, transactions and pending GMV', async () => {
            const userId = 'user-123';
            const mockWallet = { id: 'w1', balance: 500 };
            const mockTxs = [{ id: 't1', gross_amount: 100 }];
            const mockPending = [{ gross_amount: 200 }, { gross_amount: 300 }];

            const mockFrom = vi.mocked(supabase.from);

            // Wallet call
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: mockWallet, error: null })
            } as any);

            // Transactions call
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: mockTxs, error: null })
            } as any);

            // Pending GMV call: emulate chained .select().eq().eq().eq() that resolves when awaited
            const pendingQuery: any = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
            };
            pendingQuery.then = (resolve: any) => {
                resolve({ data: mockPending, error: null });
            };

            mockFrom.mockReturnValueOnce(pendingQuery as any);

            const result = await fintechService.getWalletOverview(userId);

            expect(result.wallet).toEqual(mockWallet);
            expect(result.transactions).toEqual(mockTxs);
            expect(result.pendingGMV).toBe(500); // 200 + 300
        });
    });
});
