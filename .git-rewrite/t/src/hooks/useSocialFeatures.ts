/**
 * Hook for managing social features - challenges, gifts, activities
 */
import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useAuth } from './useAuth';
import { useTranslation } from 'react-i18next';
import {
  getWeeklyChallenges,
  getChallengeProgress,
  claimChallengeReward,
  getPendingGifts,
  claimPremiumGift,
  getFriendActivities,
  type WeeklyChallenge,
  type ChallengeProgress,
  type PremiumGift,
  type FriendActivity
} from '@/services/social';
import { toast } from 'sonner';

export function useSocialFeatures() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [progress, setProgress] = useState<ChallengeProgress[]>([]);
  const [pendingGifts, setPendingGifts] = useState<PremiumGift[]>([]);
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [challengesData, progressData, giftsData, activitiesData] = await Promise.all([
        getWeeklyChallenges(),
        getChallengeProgress(user.id),
        getPendingGifts(),
        getFriendActivities()
      ]);

      setChallenges(challengesData);
      setProgress(progressData);
      setPendingGifts(giftsData);
      setActivities(activitiesData);
    } catch (error) {
      logger.error('Error loading social data:', error, { context: 'useSocialFeatures' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const claimChallenge = useCallback(async (challengeId: string) => {
    const result = await claimChallengeReward(challengeId);
    if (result.success) {
      toast.success(t('toasts.social.rewardClaimed', { hours: result.hours }));
      loadData();
    } else {
      toast.error(t('toasts.social.rewardError'));
    }
    return result;
  }, [loadData, t]);

  const claimGift = useCallback(async (giftId: string) => {
    const result = await claimPremiumGift(giftId);
    if (result.success) {
      toast.success(t('toasts.social.giftActivated', { days: result.days }));
      loadData();
    } else {
      toast.error(t('toasts.social.giftError'));
    }
    return result;
  }, [loadData, t]);

  // Calculate stats
  const completedChallenges = progress.filter(p => p.is_completed).length;
  const unclaimedRewards = progress.filter(p => p.is_completed && !p.reward_claimed).length;
  const totalRewardHours = progress
    .filter(p => p.is_completed && !p.reward_claimed)
    .reduce((sum, p) => sum + (p.challenge?.reward_hours || 0), 0);

  return {
    challenges,
    progress,
    pendingGifts,
    activities,
    loading,
    refresh: loadData,
    claimChallenge,
    claimGift,
    stats: {
      completedChallenges,
      unclaimedRewards,
      totalRewardHours,
      pendingGiftsCount: pendingGifts.length
    }
  };
}
