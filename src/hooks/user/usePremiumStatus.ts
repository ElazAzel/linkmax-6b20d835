import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/user/useAuth';
import { checkPremiumStatus as checkPremiumStatusService } from '@/services/user';
import { logger } from '@/lib/utils/logger';
import { normalizeAppPremiumTier, type AppPremiumTier } from '@/domain/billing/tiers';

export type PremiumTier = AppPremiumTier;

export function usePremiumStatus() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [tier, setTier] = useState<PremiumTier>('identity');
  const [inTrial, setInTrial] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsPremium(false);
      setTier('identity');
      setInTrial(false);
      setTrialEndsAt(null);
      setIsLoading(false);
      return;
    }

    checkStatus();
  }, [user]);

  const checkStatus = async () => {
    if (!user) return;

    try {
      const status = await checkPremiumStatusService(user.id);
      setIsPremium(status.isPremium);
      const mappedTier = normalizeAppPremiumTier(status.tier);
      setTier(mappedTier === 'identity' && status.isPremium ? 'pro' : mappedTier);
      setInTrial(status.inTrial);
      setTrialEndsAt(status.trialEndsAt);
    } catch (error) {
      logger.error('Error checking premium status', error, { context: 'usePremiumStatus' });
      setIsPremium(false);
      setTier('identity');
      setInTrial(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { isPremium, tier, inTrial, trialEndsAt, isLoading, refresh: checkStatus };
}
