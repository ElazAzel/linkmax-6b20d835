import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getOrCreateReferralCode,
  getReferralStats,
  applyReferralCode,
  wasUserReferred,
  type ReferralStats
} from '@/services/referral';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

export function useReferral(userId: string | undefined) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [wasReferred, setWasReferred] = useState(false);

  const loadStats = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // First ensure user has a referral code
      await getOrCreateReferralCode(userId);

      // Then get stats
      const data = await getReferralStats(userId);
      setStats(data);

      // Check if user was referred
      const referred = await wasUserReferred(userId);
      setWasReferred(referred);
    } catch (error) {
      logger.error('Error loading referral stats:', error, { context: 'useReferral' });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const applyCode = useCallback(async (code: string) => {
    if (!userId || !code.trim()) return false;

    setApplying(true);
    try {
      const result = await applyReferralCode(code.trim(), userId);

      if (result.success) {
        toast.success(t('referral.toastSuccess', '🎉 +{{count}} дней Premium для вас и друга!', {
          count: result.bonusDays,
        }));
        setWasReferred(true);
        return true;
      } else {
        const errorMessages: Record<string, string> = {
          'invalid_code': t('referral.errors.invalidCode', 'Неверный код приглашения'),
          'already_referred': t('referral.errors.alreadyReferred', 'Вы уже использовали реферальный код'),
          'self_referral': t('referral.errors.selfReferral', 'Нельзя использовать свой код'),
        };
        toast.error(errorMessages[result.error || 'invalid_code']);
        return false;
      }
    } catch (error) {
      toast.error(t('referral.errors.applyFailed', 'Ошибка при применении кода'));
      return false;
    } finally {
      setApplying(false);
    }
  }, [userId, t]);

  const copyCode = useCallback(() => {
    if (stats?.code) {
      navigator.clipboard.writeText(stats.code);
      toast.success(t('referral.codeCopied', 'Код скопирован!'));
    }
  }, [stats?.code, t]);

  const shareLink = useCallback(() => {
    if (stats?.code) {
      const url = `${window.location.origin}/auth?ref=${stats.code}`;
      navigator.clipboard.writeText(url);
      toast.success(t('referral.linkCopied', 'Ссылка скопирована!'));
    }
  }, [stats?.code, t]);

  return {
    stats,
    loading,
    applying,
    wasReferred,
    applyCode,
    copyCode,
    shareLink,
    refresh: loadStats
  };
}
