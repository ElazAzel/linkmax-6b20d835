import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Target from 'lucide-react/dist/esm/icons/target';
import { Card } from '@/components/ui/card';
import type { CrmMetrics } from '@/services/crm.service';

interface CrmStatsWidgetProps {
  metrics: CrmMetrics | null;
  isLoading: boolean;
}

export const CrmStatsWidget = memo(function CrmStatsWidget({ metrics, isLoading }: CrmStatsWidgetProps) {
  const { t } = useTranslation();

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: t('crm.metrics.conversion', 'Конверсия'),
      value: `${metrics.conversionRate.toFixed(1)}%`,
      icon: Target,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      label: t('crm.metrics.avgCheck', 'Средний чек'),
      value: `${Math.round(metrics.averageCheck).toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      label: t('crm.metrics.pipeline', 'Прогноз'),
      value: `${Math.round(metrics.pipelineValue).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-4 rounded-[2rem] glass border-white/10 flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-all duration-500 shadow-glass-sm">
              <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} mb-2 group-hover:scale-110 transition-transform`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
                {stat.label}
              </span>
              <span className="text-sm font-black tabular-nums tracking-tighter">
                {stat.value}
              </span>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
});
