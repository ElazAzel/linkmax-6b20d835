import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/useAuth';
import { subDays } from 'date-fns';
import { useTranslation } from 'react-i18next';

export interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  description: string;
}

export interface FunnelInsight {
  type: 'warning' | 'success' | 'info';
  message: string;
}

export interface FunnelData {
  steps: FunnelStep[];
  totalVisitors: number;
  overallConversionRate: number;
  insights: FunnelInsight[];
}

export function useFunnelAnalytics(days: number = 30) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [pageId, setPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);

  // Fetch user's page ID
  useEffect(() => {
    async function fetchPageId() {
      if (!user) return;

      const { data } = await supabase
        .from('pages')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setPageId(data.id);
      }
    }

    fetchPageId();
  }, [user]);

  const fetchFunnelData = useCallback(async () => {
    if (!user || !pageId) return;

    try {
      setLoading(true);

      const startDate = subDays(new Date(), days);

      // Fetch analytics events
      const { data: events, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('page_id', pageId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch form submissions (leads)
      const { data: leads } = await supabase
        .from('leads')
        .select('id, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Fetch bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, created_at')
        .eq('owner_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Calculate funnel steps
      const viewEvents = events?.filter(e => e.event_type === 'view') || [];
      const clickEvents = events?.filter(e => e.event_type === 'click') || [];
      const shareEvents = events?.filter(e => e.event_type === 'share') || [];

      // Unique visitors based on different sessions (approximation)
      const uniqueViewers = viewEvents.length;
      const uniqueClickers = new Set(clickEvents.map(e => (e.metadata as Record<string, unknown>)?.session || e.id)).size;

      // Engagements = clicks + shares
      const engagements = clickEvents.length + shareEvents.length;

      // Conversions = leads + bookings
      const conversions = (leads?.length || 0) + (bookings?.length || 0);

      // Build funnel steps
      const steps: FunnelStep[] = [
        {
          name: 'view',
          count: uniqueViewers,
          percentage: 100,
          description: t('funnel.viewDesc', 'Пользователи посетили вашу страницу'),
        },
        {
          name: 'click',
          count: uniqueClickers,
          percentage: uniqueViewers > 0 ? (uniqueClickers / uniqueViewers) * 100 : 0,
          description: t('funnel.clickDesc', 'Кликнули на блоки или ссылки'),
        },
        {
          name: 'engage',
          count: engagements,
          percentage: uniqueViewers > 0 ? (engagements / uniqueViewers) * 100 : 0,
          description: t('funnel.engageDesc', 'Совершили действия (клики, шеры)'),
        },
        {
          name: 'convert',
          count: conversions,
          percentage: uniqueViewers > 0 ? (conversions / uniqueViewers) * 100 : 0,
          description: t('funnel.convertDesc', 'Оставили заявку или забронировали'),
        },
      ];

      // Calculate overall conversion rate
      const overallConversionRate = uniqueViewers > 0
        ? (conversions / uniqueViewers) * 100
        : 0;

      // Generate insights
      const insights: FunnelInsight[] = [];

      // Click-through rate insight
      const ctr = uniqueViewers > 0 ? (uniqueClickers / uniqueViewers) * 100 : 0;
      if (ctr < 20) {
        insights.push({
          type: 'warning',
          message: t('funnel.insightLowCtr', 'Низкий CTR ({{rate}}%). Попробуйте добавить более заметные кнопки.', { rate: ctr.toFixed(1) }),
        });
      } else if (ctr >= 50) {
        insights.push({
          type: 'success',
          message: t('funnel.insightHighCtr', 'Отличный CTR ({{rate}}%)! Контент вовлекает пользователей.', { rate: ctr.toFixed(1) }),
        });
      }

      // Engagement to conversion rate
      if (engagements > 0 && conversions === 0) {
        insights.push({
          type: 'warning',
          message: t('funnel.insightNoConversions', 'Есть вовлечение, но нет конверсий. Добавьте форму или бронирование.'),
        });
      }

      // Overall conversion insight
      if (overallConversionRate >= 5) {
        insights.push({
          type: 'success',
          message: t('funnel.insightGoodConversion', 'Хорошая конверсия {{rate}}%!', { rate: overallConversionRate.toFixed(1) }),
        });
      } else if (overallConversionRate > 0 && overallConversionRate < 2) {
        insights.push({
          type: 'info',
          message: t('funnel.insightLowConversion', 'Конверсия {{rate}}%. Оптимизируйте CTA и формы.', { rate: overallConversionRate.toFixed(1) }),
        });
      }

      // No data insight
      if (uniqueViewers < 10) {
        insights.push({
          type: 'info',
          message: t('funnel.insightLowTraffic', 'Мало данных для анализа. Поделитесь ссылкой на страницу.'),
        });
      }

      setFunnel({
        steps,
        totalVisitors: uniqueViewers,
        overallConversionRate,
        insights,
      });
    } catch (error) {
      logger.error('Error fetching funnel analytics:', error, { context: 'useFunnelAnalytics' });
    } finally {
      setLoading(false);
    }
  }, [user, pageId, days, t]);

  useEffect(() => {
    if (pageId) {
      fetchFunnelData();
    }
  }, [fetchFunnelData, pageId]);

  return {
    funnel,
    loading,
    refresh: fetchFunnelData,
  };
}
