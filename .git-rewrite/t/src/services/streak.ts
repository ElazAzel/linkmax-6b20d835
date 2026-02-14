import { supabase } from '@/platform/supabase/client';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  bonusDaysEarned: number;
}

export interface UpdateStreakResult {
  updated: boolean;
  currentStreak: number;
  longestStreak: number;
  bonusDays: number;
  milestone: boolean;
}

export async function updateUserStreak(userId: string): Promise<UpdateStreakResult | null> {
  const { data, error } = await supabase.rpc('update_user_streak', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error updating streak:', error);
    return null;
  }

  const result = data as unknown as UpdateStreakResult;
  return result;
}

export async function getStreakData(userId: string): Promise<StreakData | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('current_streak, longest_streak, last_active_date, streak_bonus_days')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching streak data:', error);
    return null;
  }

  return {
    currentStreak: data.current_streak || 0,
    longestStreak: data.longest_streak || 0,
    lastActiveDate: data.last_active_date,
    bonusDaysEarned: data.streak_bonus_days || 0,
  };
}

export const STREAK_MILESTONES = [
  { days: 7, bonus: 1, label: '1 Week' },
  { days: 14, bonus: 2, label: '2 Weeks' },
  { days: 30, bonus: 3, label: '1 Month' },
  { days: 60, bonus: 5, label: '2 Months' },
  { days: 100, bonus: 7, label: '100 Days' },
];

export function getNextMilestone(currentStreak: number) {
  return STREAK_MILESTONES.find(m => m.days > currentStreak) || null;
}
