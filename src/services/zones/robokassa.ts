import { supabase } from '@/platform/supabase/client';

export interface RoboKassaPaymentParams {
    type: 'subscription' | 'payment' | 'tokens' | 'zone_upgrade';
    amount: number;
    userId: string;
    zoneId?: string;
    relatedId?: string;
    description?: string;
    plan?: string;
    period?: number;
}

/**
 * Calls the robokassa edge function to generate a payment URL
 */
export async function generateRoboKassaUrl(params: RoboKassaPaymentParams): Promise<{ url: string; invId: string }> {
    const { data, error } = await supabase.functions.invoke('robokassa', {
        body: params,
    });

    if (error) {
        console.error('Error generating RoboKassa URL:', error);
        throw new Error(error.message || 'Failed to generate payment URL');
    }

    return {
        url: data.url,
        invId: data.invId
    };
}
