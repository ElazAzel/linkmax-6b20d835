import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from '../payment-service';
import { supabase } from '@/platform/supabase/client';

describe('PaymentService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createOrder', () => {
        it('should return session on success', async () => {
            const mockData = {
                success: true,
                orderId: 'order-123',
                paymentUrl: 'https://robokassa.ru/pay'
            };

            vi.mocked(supabase.functions.invoke).mockResolvedValue({
                data: mockData,
                error: null
            } as any);

            const params = {
                zoneId: 'zone-1',
                planCode: 'pro',
                cycle: 'monthly' as const,
                description: 'Pro Subscription'
            };

            const result = await PaymentService.createOrder(params);

            expect(result).toEqual({
                orderId: 'order-123',
                paymentUrl: 'https://robokassa.ru/pay',
                provider: 'robokassa'
            });
            expect(supabase.functions.invoke).toHaveBeenCalledWith('create-payment-session', {
                body: params
            });
        });

        it('should throw error if function return success: false', async () => {
            vi.mocked(supabase.functions.invoke).mockResolvedValue({
                data: { success: false, error: 'Internal Error' },
                error: null
            } as any);

            await expect(PaymentService.createOrder({
                zoneId: 'z1',
                planCode: 'p1',
                cycle: 'monthly',
                description: 'd1'
            })).rejects.toThrow('Internal Error');
        });

        it('should throw error if invoke fails', async () => {
            vi.mocked(supabase.functions.invoke).mockResolvedValue({
                data: null,
                error: { message: 'Network Error' }
            } as any);

            await expect(PaymentService.createOrder({
                zoneId: 'z1',
                planCode: 'p1',
                cycle: 'monthly',
                description: 'd1'
            })).rejects.toThrow('Network Error');
        });
    });

    describe('getOrderStatus', () => {
        it('should return status from DB', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { status: 'completed' }, error: null })
            } as any);

            const status = await PaymentService.getOrderStatus('order-123');
            expect(status).toBe('completed');
        });

        it('should default to pending on error', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } })
            } as any);

            const status = await PaymentService.getOrderStatus('order-123');
            expect(status).toBe('pending');
        });
    });
});
