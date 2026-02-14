import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function usePremiumStatus() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsPremium(false);
      setIsLoading(false);
      return;
    }

    checkPremiumStatus();
  }, [user]);

  const checkPremiumStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_premium, trial_ends_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking premium status:', error);
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      // Check if user has premium subscription
      if (data?.is_premium) {
        setIsPremium(true);
        setIsLoading(false);
        return;
      }

      // Check if trial is still active
      if (data?.trial_ends_at) {
        const trialEnd = new Date(data.trial_ends_at);
        const now = new Date();
        setIsPremium(trialEnd > now);
      } else {
        setIsPremium(false);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error in premium status check:', error);
      setIsPremium(false);
      setIsLoading(false);
    }
  };

  return { isPremium, isLoading };
}
