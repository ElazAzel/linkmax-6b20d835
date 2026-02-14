import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { checkPremiumStatus as checkPremiumStatusService } from '@/services/user';

export type PremiumTier = 'free' | 'pro';

export function usePremiumStatus() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [tier, setTier] = useState<PremiumTier>('free');
  const [inTrial, setInTrial] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsPremium(false);
      setTier('free');
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
      setTier(status.tier || (status.isPremium ? 'pro' : 'free'));
      setInTrial(status.inTrial);
      setTrialEndsAt(status.trialEndsAt);
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremium(false);
      setTier('free');
      setInTrial(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { isPremium, tier, inTrial, trialEndsAt, isLoading, refresh: checkStatus };
}
