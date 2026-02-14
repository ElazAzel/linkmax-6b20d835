import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { updateUserStreak, getStreakData, type StreakData, type UpdateStreakResult } from '@/services/streak';

export function useStreak(userId: string | undefined) {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [milestoneReached, setMilestoneReached] = useState<UpdateStreakResult | null>(null);

  const checkStreak = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Update streak (will check if already updated today)
      const result = await updateUserStreak(userId);
      
      if (result?.updated && result.milestone && result.bonusDays > 0) {
        setMilestoneReached(result);
        toast.success(`🔥 ${result.currentStreak} day streak! +${result.bonusDays} bonus trial days!`, {
          duration: 5000,
        });
      } else if (result?.updated && result.currentStreak > 1) {
        toast.success(`🔥 ${result.currentStreak} day streak!`, {
          duration: 3000,
        });
      }

      // Fetch fresh data
      const data = await getStreakData(userId);
      setStreakData(data);
    } catch (error) {
      console.error('Failed to check streak:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  const dismissMilestone = useCallback(() => {
    setMilestoneReached(null);
  }, []);

  return { 
    streakData, 
    loading, 
    milestoneReached, 
    dismissMilestone,
    refetch: checkStreak 
  };
}
