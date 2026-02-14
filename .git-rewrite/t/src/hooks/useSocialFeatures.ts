/**
 * Hook for managing social features - challenges, gifts, activities
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
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
      console.error('Error loading social data:', error);
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
      toast.success(`Награда получена: +${result.hours} часов Premium!`);
      loadData();
    } else {
      toast.error('Не удалось получить награду');
    }
    return result;
  }, [loadData]);

  const claimGift = useCallback(async (giftId: string) => {
    const result = await claimPremiumGift(giftId);
    if (result.success) {
      toast.success(`Подарок активирован: +${result.days} дней Premium!`);
      loadData();
    } else {
      toast.error('Не удалось активировать подарок');
    }
    return result;
  }, [loadData]);

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
