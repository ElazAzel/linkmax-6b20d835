import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Achievement, UnlockedAchievement, UserStats } from '@/types/achievements';
import { ACHIEVEMENTS } from '@/types/achievements';

export function useAchievements() {
  const { user } = useAuth();
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);

  // Load unlocked achievements from database
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadAchievements = async () => {
      try {
        const { data, error } = await supabase
          .from('user_achievements')
          .select('achievement_key')
          .eq('user_id', user.id);

        if (error) throw error;

        const unlocked = new Set(data?.map(a => a.achievement_key) || []);
        setUnlockedAchievements(unlocked);
      } catch (error) {
        console.error('Failed to load achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, [user]);

  // Check and unlock new achievements
  const checkAchievements = useCallback(async (stats: UserStats) => {
    if (!user) return;

    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      // Skip if already unlocked
      if (unlockedAchievements.has(achievement.key)) continue;

      // Check if condition is met
      if (achievement.condition(stats)) {
        try {
          // Save to database
          const { error } = await supabase
            .from('user_achievements')
            .insert({
              user_id: user.id,
              achievement_key: achievement.key,
            });

          if (error) {
            // Ignore unique constraint violations (already unlocked)
            if (!error.message.includes('duplicate key')) {
              console.error('Failed to unlock achievement:', error);
            }
            continue;
          }

          newlyUnlocked.push(achievement);
          
          // Update local state
          setUnlockedAchievements(prev => new Set([...prev, achievement.key]));
        } catch (error) {
          console.error('Error unlocking achievement:', error);
        }
      }
    }

    // Show notification for the first newly unlocked achievement
    if (newlyUnlocked.length > 0) {
      setNewAchievement(newlyUnlocked[0]);
    }
  }, [user, unlockedAchievements]);

  const dismissAchievementNotification = useCallback(() => {
    setNewAchievement(null);
  }, []);

  const getProgress = useCallback(() => {
    const total = ACHIEVEMENTS.length;
    const unlocked = unlockedAchievements.size;
    return {
      unlocked,
      total,
      percentage: Math.round((unlocked / total) * 100),
    };
  }, [unlockedAchievements]);

  const getAchievementsByCategory = useCallback((category: Achievement['category']) => {
    return ACHIEVEMENTS.filter(a => a.category === category).map(achievement => ({
      ...achievement,
      unlocked: unlockedAchievements.has(achievement.key),
    }));
  }, [unlockedAchievements]);

  const getAllAchievements = useCallback(() => {
    return ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      unlocked: unlockedAchievements.has(achievement.key),
    }));
  }, [unlockedAchievements]);

  return {
    loading,
    unlockedAchievements,
    newAchievement,
    checkAchievements,
    dismissAchievementNotification,
    getProgress,
    getAchievementsByCategory,
    getAllAchievements,
  };
}
