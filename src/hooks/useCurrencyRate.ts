import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import type { Database } from '@/platform/supabase/types';

export const BASE_PRICES_USD = {
    3: 8.90,
    6: 7.90,
    12: 5.90
};

// Fixed KZT prices as per pricing strategy
export const FIXED_PRICES_KZT: Record<number, number> = {
    3: 4350,
    6: 3698,
    12: 3045
};

export function getMonthlyPriceKzt(period: 3 | 6 | 12): number {
    return FIXED_PRICES_KZT[period];
}

export function getTotalPriceKzt(period: 3 | 6 | 12): number {
    return FIXED_PRICES_KZT[period] * period;
}

export function useCurrencyRate() {
    return useQuery({
        queryKey: ['currency_rate', 'USD_KZT'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('currency_rates' as never)
                .select('rate')
                .eq('currency_pair', 'USD_KZT' as never)
                .single();

            if (error) {
                console.error('Failed to fetch currency rate:', error);
                return 497.33;
            }

            return ((data as unknown as { rate: number })?.rate) || 497.33;
        },
        staleTime: 1000 * 60 * 60 * 12, // 12 hours
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}

export function convertUsdToKzt(usdAmount: number, rate: number): number {
    return Math.round(usdAmount * rate);
}
