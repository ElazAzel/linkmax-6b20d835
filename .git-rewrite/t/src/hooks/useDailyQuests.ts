import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  getCompletedQuestsToday, 
  completeQuest, 
  DAILY_QUESTS, 
  getQuestProgress,
  type Quest 
} from '@/services/quests';

export function useDailyQuests(userId: string | undefined) {
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuests = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const completed = await getCompletedQuestsToday(userId);
      setCompletedQuests(completed);
      
      // Auto-complete daily visit quest
      if (!completed.includes('daily_visit')) {
        const result = await completeQuest(userId, 'daily_visit');
        if (result.success) {
          setCompletedQuests(prev => [...prev, 'daily_visit']);
          toast.success(`👋 +${result.bonusHours}ч trial за ежедневный визит!`, {
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load quests:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  const markQuestComplete = useCallback(async (questKey: string) => {
    if (!userId || completedQuests.includes(questKey)) return;

    const result = await completeQuest(userId, questKey);
    if (result.success) {
      setCompletedQuests(prev => [...prev, questKey]);
      const quest = DAILY_QUESTS.find(q => q.key === questKey);
      if (quest) {
        toast.success(`${quest.icon} +${result.bonusHours}ч trial за "${quest.title}"!`, {
          duration: 3000,
        });
      }
    }
  }, [userId, completedQuests]);

  const isQuestCompleted = useCallback((questKey: string) => {
    return completedQuests.includes(questKey);
  }, [completedQuests]);

  const progress = getQuestProgress(completedQuests);

  return {
    quests: DAILY_QUESTS,
    completedQuests,
    loading,
    markQuestComplete,
    isQuestCompleted,
    progress,
    refetch: loadQuests,
  };
}
