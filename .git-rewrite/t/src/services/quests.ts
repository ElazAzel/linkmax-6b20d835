import { supabase } from '@/integrations/supabase/client';

export interface Quest {
  key: string;
  title: string;
  description: string;
  icon: string;
  bonusHours: number;
  checkCompletion?: () => boolean;
}

export const DAILY_QUESTS: Quest[] = [
  {
    key: 'daily_visit',
    title: 'Ежедневный визит',
    description: 'Зайди в приложение',
    icon: '👋',
    bonusHours: 1,
  },
  {
    key: 'add_block',
    title: 'Добавь блок',
    description: 'Добавь новый блок на страницу',
    icon: '➕',
    bonusHours: 2,
  },
  {
    key: 'edit_profile',
    title: 'Обнови профиль',
    description: 'Измени имя или био профиля',
    icon: '✏️',
    bonusHours: 1,
  },
  {
    key: 'share_page',
    title: 'Поделись страницей',
    description: 'Скопируй ссылку на свою страницу',
    icon: '🔗',
    bonusHours: 2,
  },
  {
    key: 'use_ai',
    title: 'Используй AI',
    description: 'Сгенерируй контент с помощью AI',
    icon: '🤖',
    bonusHours: 3,
  },
];

export interface CompletedQuest {
  quest_key: string;
  completed_date: string;
  reward_claimed: boolean;
}

export async function getCompletedQuestsToday(userId: string): Promise<string[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('daily_quests_completed')
    .select('quest_key')
    .eq('user_id', userId)
    .eq('completed_date', today);

  if (error) {
    console.error('Error fetching completed quests:', error);
    return [];
  }

  return (data || []).map(q => q.quest_key);
}

export async function completeQuest(userId: string, questKey: string): Promise<{ success: boolean; bonusHours: number }> {
  const quest = DAILY_QUESTS.find(q => q.key === questKey);
  if (!quest) {
    return { success: false, bonusHours: 0 };
  }

  const { data, error } = await supabase.rpc('complete_daily_quest', {
    p_user_id: userId,
    p_quest_key: questKey,
    p_bonus_hours: quest.bonusHours,
  });

  if (error) {
    console.error('Error completing quest:', error);
    return { success: false, bonusHours: 0 };
  }

  const result = data as { success: boolean; bonus_hours?: number; reason?: string };
  return { 
    success: result.success, 
    bonusHours: result.bonus_hours || 0 
  };
}

export function getQuestProgress(completedKeys: string[]): { completed: number; total: number; bonusEarned: number } {
  const completed = completedKeys.length;
  const total = DAILY_QUESTS.length;
  const bonusEarned = DAILY_QUESTS
    .filter(q => completedKeys.includes(q.key))
    .reduce((sum, q) => sum + q.bonusHours, 0);

  return { completed, total, bonusEarned };
}
