import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/user/useAuth';
import { checkPremiumStatus as checkPremiumStatusService } from '@/services/user';
import { normalizeAppPremiumTier, type AppPremiumTier } from '@/domain/billing/tiers';

export type PremiumTier = AppPremiumTier;

const premiumStatusQueryKey = (userId: string) => ['premiumStatus', userId] as const;

/**
 * The signed-in user's plan. One shared query: about fifteen dashboard
 * components read it, and each used to fetch the profile on its own.
 */
export function usePremiumStatus() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: premiumStatusQueryKey(userId ?? ''),
    enabled: !!userId,
    staleTime: 60 * 1000,
    // Payments finish in another tab: re-check the plan when the user comes back.
    refetchOnWindowFocus: true,
    // The service never throws: it falls back to the free plan.
    queryFn: async () => {
      const status = await checkPremiumStatusService(userId!);
      const mappedTier = normalizeAppPremiumTier(status.tier);
      return {
        isPremium: status.isPremium,
        tier: (mappedTier === 'identity' && status.isPremium ? 'pro' : mappedTier) as PremiumTier,
        inTrial: status.inTrial,
        trialEndsAt: status.trialEndsAt,
      };
    },
  });

  const refresh = useCallback(async () => {
    if (userId) await queryClient.invalidateQueries({ queryKey: premiumStatusQueryKey(userId) });
  }, [queryClient, userId]);

  return {
    isPremium: data?.isPremium ?? false,
    tier: data?.tier ?? ('identity' as PremiumTier),
    inTrial: data?.inTrial ?? false,
    trialEndsAt: data?.trialEndsAt ?? null,
    isLoading: userId ? isLoading : false,
    refresh,
  };
}
