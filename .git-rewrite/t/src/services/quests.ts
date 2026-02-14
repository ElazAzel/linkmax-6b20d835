import { supabase } from '@/platform/supabase/client';

export interface Quest {
  key: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  tokens: number; // Changed from bonusHours to tokens
  checkCompletion?: () => boolean;
}

export const DAILY_QUESTS: Quest[] = [
  {
    key: 'daily_visit',
    titleKey: 'quests.dailyVisit.title',
    descriptionKey: 'quests.dailyVisit.description',
    icon: '👋',
    tokens: 5,
  },
  {
    key: 'add_block',
    titleKey: 'quests.addBlock.title',
    descriptionKey: 'quests.addBlock.description',
    icon: '➕',
    tokens: 10,
  },
  {
    key: 'edit_profile',
    titleKey: 'quests.editProfile.title',
    descriptionKey: 'quests.editProfile.description',
    icon: '✏️',
    tokens: 5,
  },
  {
    key: 'share_page',
    titleKey: 'quests.sharePage.title',
    descriptionKey: 'quests.sharePage.description',
    icon: '🔗',
    tokens: 10,
  },
  {
    key: 'use_ai',
    titleKey: 'quests.useAi.title',
    descriptionKey: 'quests.useAi.description',
    icon: '🤖',
    tokens: 15,
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

export async function completeQuest(userId: string, questKey: string): Promise<{ success: boolean; tokensEarned: number }> {
  const quest = DAILY_QUESTS.find(q => q.key === questKey);
  if (!quest) {
    return { success: false, tokensEarned: 0 };
  }

  // Use bonus_hours param but it will be converted to tokens in the DB function
  const { data, error } = await supabase.rpc('complete_daily_quest', {
    p_user_id: userId,
    p_quest_key: questKey,
    p_bonus_hours: Math.ceil(quest.tokens / 5), // Convert tokens to hours for backward compat
  });

  if (error) {
    console.error('Error completing quest:', error);
    return { success: false, tokensEarned: 0 };
  }

  const result = data as { success: boolean; tokens_earned?: number; reason?: string };
  return { 
    success: result.success, 
    tokensEarned: result.tokens_earned || quest.tokens 
  };
}

export function getQuestProgress(completedKeys: string[]): { completed: number; total: number; tokensEarned: number } {
  const completed = completedKeys.length;
  const total = DAILY_QUESTS.length;
  const tokensEarned = DAILY_QUESTS
    .filter(q => completedKeys.includes(q.key))
    .reduce((sum, q) => sum + q.tokens, 0);

  return { completed, total, tokensEarned };
}
