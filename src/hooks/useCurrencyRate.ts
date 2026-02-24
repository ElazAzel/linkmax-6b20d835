import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const BASE_PRICES_USD = {
    3: 8.90,
    6: 7.90,
    12: 5.90
};

export function useCurrencyRate() {
    return useQuery({
        queryKey: ['currency_rate', 'USD_KZT'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('currency_rates')
                .select('rate')
                .eq('currency_pair', 'USD_KZT')
                .single();

            if (error) {
                console.error('Failed to fetch currency rate:', error);
                return 497.33; // Fallback rate to prevent app break
            }

            return (data as any)?.rate || 497.33;
        },
        staleTime: 1000 * 60 * 60 * 12, // 12 hours
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}

export function convertUsdToKzt(usdAmount: number, rate: number): number {
    return Math.round(usdAmount * rate);
}
