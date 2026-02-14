import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { checkPremiumStatus as checkPremiumStatusService } from '@/services/user';

export function usePremiumStatus() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [inTrial, setInTrial] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsPremium(false);
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
      setInTrial(status.inTrial);
      setTrialEndsAt(status.trialEndsAt);
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremium(false);
      setInTrial(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { isPremium, inTrial, trialEndsAt, isLoading, refresh: checkStatus };
}
