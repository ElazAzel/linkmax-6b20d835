import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import {
  getCompletedQuestsToday,
  completeQuest,
  DAILY_QUESTS,
  getQuestProgress,
  type Quest
} from '@/services/quests';

export function useDailyQuests(userId: string | undefined) {
  const { t } = useTranslation();
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
          toast.success(t('quests.toastDailyVisit', '👋 +{{count}} Linkkon за ежедневный визит!', {
            count: result.tokensEarned,
          }), {
            duration: 3000,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to load quests:', error, { context: 'useDailyQuests' });
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
        toast.success(t('quests.toastCompleted', '{{icon}} +{{count}} Linkkon за "{{title}}"!', {
          icon: quest.icon,
          count: result.tokensEarned,
          title: t(quest.titleKey),
        }), {
          duration: 3000,
        });
      }
    }
  }, [userId, completedQuests, t]);

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
