'use client';

import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { useDashboardMetrics } from '@/hooks/dashboard/useDashboardMetrics';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/utils';
import { supabase } from '@/platform/supabase/client';
import Eye from 'lucide-react/dist/esm/icons/eye';
import MousePointer2 from 'lucide-react/dist/esm/icons/mouse-pointer-2';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';

interface ConversionFunnelWidgetProps {
  pageId: string | undefined;
  className?: string;
}

interface ActivationStepCount {
  label: string;
  value: number;
}

export const ConversionFunnelWidget = memo(function ConversionFunnelWidget({
  pageId,
  className
}: ConversionFunnelWidgetProps) {
  const { t } = useTranslation();
  const { totalViews, totalClicks, totalLeads, loading, error } = useDashboardMetrics(pageId);
  const [activationSteps, setActivationSteps] = useState<ActivationStepCount[]>([]);

  useEffect(() => {
    if (!pageId) {
      setActivationSteps([]);
      return;
    }

    (async () => {
      const eventTypes = [
        'activation:funnel_step_create_page_completed',
        'activation:funnel_step_add_block_completed',
        'activation:funnel_step_publish_completed',
        'activation:funnel_step_first_lead_completed',
      ];

      const counts = await Promise.all(
        eventTypes.map(async (eventType) => {
          const { count } = await supabase
            .from('analytics')
            .select('*', { count: 'exact', head: true })
            .eq('page_id', pageId)
            .eq('event_type', eventType);
          return count || 0;
        })
      );

      setActivationSteps([
        { label: t('activation.steps.createPage', 'Создание страницы'), value: counts[0] },
        { label: t('activation.steps.addBlock', 'Добавление блока'), value: counts[1] },
        { label: t('activation.steps.publish', 'Публикация'), value: counts[2] },
        { label: t('activation.steps.firstLead', 'Первый лид'), value: counts[3] },
      ]);
    })();
  }, [pageId, t]);

  if (loading) {
    return <Skeleton className={cn("h-64 rounded-[2.5rem] bg-white/5", className)} />;
  }

  if (error || (!totalViews && !totalClicks && !totalLeads && activationSteps.length === 0)) return null;

  const steps = [
    {
      label: t('metrics.funnel.views', 'Просмотры'),
      value: totalViews,
      icon: Eye,
      color: 'bg-blue-500',
      width: 'w-full',
    },
    {
      label: t('metrics.funnel.clicks', 'Интерес (клики)'),
      value: totalClicks,
      icon: MousePointer2,
      color: 'bg-purple-500',
      width: totalViews > 0 ? `${Math.max((totalClicks / totalViews) * 100, 15)}%` : 'w-[15%]',
      percent: totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0,
    },
    {
      label: t('metrics.funnel.leads', 'Заявки'),
      value: totalLeads,
      icon: MessageSquare,
      color: 'bg-emerald-500',
      width: totalViews > 0 ? `${Math.max((totalLeads / totalViews) * 100, 10)}%` : 'w-[10%]',
      percent: totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : 0,
    },
  ];

  return (
    <Card className={cn("p-6 md:p-8 glass border-white/10 shadow-glass-lg rounded-[2.5rem] overflow-hidden", className)}>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">
          {t('metrics.funnel.title', 'Воронка конверсии')}
        </h3>
        <span className="text-xs font-bold text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/5">
          {t('metrics.funnel.last30Days', 'Последние 30 дней')}
        </span>
      </div>

      <div className="space-y-6">
        {steps.map((step, idx) => (
          <div key={idx} className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn("h-6 w-6 rounded-md flex items-center justify-center text-white shadow-sm", step.color)}>
                  <step.icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold">{step.label}</span>
              </div>
              <span className="text-sm font-black tracking-tight">{step.value}</span>
            </div>

            <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: step.width }}
                transition={{ duration: 1, delay: idx * 0.2, ease: "circOut" }}
                className={cn("h-full rounded-full group relative", step.color)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
              </motion.div>
            </div>

            {idx > 0 && totalViews > 0 && (
              <div className="absolute -top-4 right-0 text-xs font-black text-muted-foreground">
                {step.percent}%
              </div>
            )}
          </div>
        ))}
      </div>

      {activationSteps.length > 0 && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {t('metrics.funnel.activationTitle', 'Онбординг-воронка: страница → блок → публикация → лид')}
          </h4>
          {activationSteps.map((step, idx) => {
            const base = activationSteps[0]?.value || 0;
            const conversion = idx === 0 || base === 0 ? 100 : Math.round((step.value / base) * 100);
            return (
              <div key={step.label} className="flex items-center justify-between text-xs">
                <span className="text-foreground/80">{idx + 1}. {step.label}</span>
                <span className="font-bold">{step.value} · {conversion}%</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] leading-relaxed text-muted-foreground font-medium">
        <strong className="text-foreground font-black block mb-1">
          {t('metrics.funnel.insightTitle', 'Совет от LinkMAX AI')}
        </strong>
        {totalViews > 0 && totalLeads === 0
          ? t('metrics.funnel.insightNoLeads', 'У вас есть просмотры, но нет заявок. Попробуйте добавить форму сбора контактов на первый экран.')
          : totalClicks > 0 && (totalLeads / totalClicks) < 0.1
          ? t('metrics.funnel.insightLowConversion', 'Много кликов, но мало заявок. Убедитесь, что ваше предложение (оффер) понятно клиенту.')
          : t('metrics.funnel.insightGoodJob', 'Ваша воронка работает стабильно. Продолжайте привлекать трафик через соцсети!')}
      </div>
    </Card>
  );
});
