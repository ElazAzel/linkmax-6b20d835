/**
 * Shared fintech utilities for Supabase Edge Functions.
 * Centralizes the "Success-First" fee logic for the platform.
 */

export const TIER_RATES = {
    starter: 0.07,
    pro: 0.01,
    business: 0.00,
} as const;

/**
 * Calculates fee based on user tier and gross amount
 */
export function calculateFintechFee(params: {
    amount: number;
    isPremium: boolean;
    tier?: string;
}) {
    const { amount, isPremium, tier } = params;
    
    // Default to Starter (7%), move to Pro (1%) if premium
    let rate: number = isPremium ? TIER_RATES.pro : TIER_RATES.starter;
    
    // Explicit tier override if provided
    if (tier && TIER_RATES[tier as keyof typeof TIER_RATES] !== undefined) {
        rate = TIER_RATES[tier as keyof typeof TIER_RATES];
    }

    const feeAmount = Number((amount * rate).toFixed(2));
    const netAmount = Number((amount - feeAmount).toFixed(2));

    return {
        grossAmount: amount,
        feeAmount,
        netAmount,
        rate
    };
}
