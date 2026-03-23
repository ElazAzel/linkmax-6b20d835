import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fintechService } from '../fintech';
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
    logger: {
        error: vi.fn(),
        warn: vi.fn(),
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

        it('should return null if table not found (PGRST205)', async () => {
            vi.mocked(supabase.from).mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { premium_tier: 'pro' }, error: null }),
            } as any);

            vi.mocked(supabase.from).mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { id: 'w1' }, error: null }),
            } as any);

            vi.mocked(supabase.from).mockReturnValueOnce({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST205' } }),
            } as any);

            const result = await fintechService.recordPendingIncome(mockParams);
            expect(result).toBeNull();
        });
    });

    describe('getWalletOverview error handling', () => {
        it('should return empty overview if wallet table not found', async () => {
            vi.mocked(supabase.from).mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST205' } }),
            } as any);

            const result = await fintechService.getWalletOverview('u1');
            expect(result.wallet).toBeNull();
            expect(result.transactions).toHaveLength(0);
        });
    });

    describe('requestPayout', () => {
        it('should request payout successfully', async () => {
            const mockWallet = { id: 'w1', balance: 1000 };
            const mockRequest = { id: 'r1', amount: 500 };
            
            vi.mocked(supabase.from).mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: mockWallet, error: null }),
            } as any);

            vi.mocked(supabase.from).mockReturnValueOnce({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockRequest, error: null }),
            } as any);

            const result = await fintechService.requestPayout({
                userId: 'u1',
                amount: 500,
                method: { type: 'card', value: '1234' }
            });

            expect(result).toEqual(mockRequest);
        });

        it('should throw if insufficient funds', async () => {
             vi.mocked(supabase.from).mockReturnValueOnce({
                 select: vi.fn().mockReturnThis(),
                 eq: vi.fn().mockReturnThis(),
                 maybeSingle: vi.fn().mockResolvedValue({ data: { balance: 100 }, error: null }),
             } as any);
 
             await expect(fintechService.requestPayout({
                 userId: 'u1',
                 amount: 500,
                 method: { type: 'card', value: '1234' }
             })).rejects.toThrow('Insufficient funds');
        });
    });
});
