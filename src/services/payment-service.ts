import { supabase } from '@/platform/supabase/client';

export type PaymentProvider = 'kaspi' | 'robokassa' | 'stripe';

export interface PaymentOrder {
    id: string;
    zoneId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    provider: PaymentProvider;
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface PaymentSession {
    orderId: string;
    paymentUrl: string;
    provider: PaymentProvider;
}

/**
 * PaymentService handles financial transactions, billing, and integration with payment gateways.
 * Currently supports a skeleton for Kaspi and Robokassa.
 */
export class PaymentService {
    /**
     * Creates a new payment order and returns a session URL for the user to complete payment.
     * Invokes the secure 'create-payment-session' Edge Function.
     */
    static async createOrder(params: {
        zoneId: string;
        planCode: string;
        cycle: 'monthly' | 'yearly';
        description: string;
        metadata?: Record<string, any>;
    }): Promise<PaymentSession> {
        const { data, error } = await supabase.functions.invoke('create-payment-session', {
            body: params
        });

        if (error || !data.success) {
            console.error('Failed to create payment session:', error || data?.error);
            throw new Error(data?.error || 'Payment initialization failed');
        }

        return {
            orderId: data.orderId,
            paymentUrl: data.paymentUrl,
            provider: 'robokassa' // Currently primary provider
        };
    }

    /**
     * Checks the status of a specific order.
     */
    static async getOrderStatus(orderId: string): Promise<PaymentOrder['status']> {
        const { data, error } = await supabase
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .single();

        if (error) return 'pending';
        return data.status as PaymentOrder['status'];
    }
}
