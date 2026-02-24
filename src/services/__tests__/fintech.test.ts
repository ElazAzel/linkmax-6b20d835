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
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
            } as any);

            await expect(fintechService.recordPendingIncome(mockParams)).rejects.toThrow('Wallet not found');
            expect(logger.error).toHaveBeenCalled();
        });

        it('should create transaction and fee record on success', async () => {
            const mockWallet = { id: 'wallet-789' };
            const mockTransaction = { id: 'tx-001', amount: 1000 };

            const mockFrom = vi.mocked(supabase.from);

            // Chain for wallet lookup
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockWallet, error: null })
            } as any);

            // Chain for main transaction creation
            mockFrom.mockReturnValueOnce({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null })
            } as any);

            // Chain for fee transaction creation
            mockFrom.mockReturnValueOnce({
                insert: vi.fn().mockResolvedValue({ data: null, error: null })
            } as any);

            const result = await fintechService.recordPendingIncome(mockParams);

            expect(result).toEqual(mockTransaction);
            expect(mockFrom).toHaveBeenCalledWith('user_wallets');
            expect(mockFrom).toHaveBeenCalledWith('wallet_transactions');

            // Verify fee calculation (5% of 1000 = 50)
            const feeCall = vi.mocked(mockFrom).mock.results[2].value.insert;
            expect(feeCall).toHaveBeenCalledWith(expect.objectContaining({
                amount: -50,
                type: 'fee'
            }));
        });
    });

    describe('getWalletOverview', () => {
        it('should return wallet, transactions and pending GMV', async () => {
            const userId = 'user-123';
            const mockWallet = { id: 'w1', balance: 500 };
            const mockTxs = [{ id: 't1', amount: 100 }];
            const mockPending = [{ amount: 200 }, { amount: 300 }];

            const mockFrom = vi.mocked(supabase.from);

            // Wallet call
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockWallet, error: null })
            } as any);

            // Transactions call
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: mockTxs, error: null })
            } as any);

            // Pending GMV call
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                match: vi.fn().mockReturnThis(), // Assuming multiple eq or filter
                // The implementation uses multiple .eq().eq().eq()
                // So we need to mock the chain correctly
            } as any);

            // Let's adjust the mock for the chain .eq().eq().eq()
            const mockChain: any = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
            };
            mockChain.then = function (resolve: any) {
                resolve({ data: mockPending, error: null });
            };

            mockFrom.mockReturnValueOnce(mockChain as any);

            const result = await fintechService.getWalletOverview(userId);

            expect(result.wallet).toEqual(mockWallet);
            expect(result.transactions).toEqual(mockTxs);
            expect(result.pendingGMV).toBe(500); // 200 + 300
        });
    });
});
