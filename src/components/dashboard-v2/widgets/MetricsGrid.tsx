'use client';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { useDashboardMetrics } from '@/hooks/dashboard/useDashboardMetrics';
import Eye from 'lucide-react/dist/esm/icons/eye';
import MousePointer2 from 'lucide-react/dist/esm/icons/mouse-pointer-2';
import Users from 'lucide-react/dist/esm/icons/users';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Activity from 'lucide-react/dist/esm/icons/activity';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricsGridProps {
  pageId: string | undefined;
}

export const MetricsGrid = memo(function MetricsGrid({ pageId }: MetricsGridProps) {
  const { t } = useTranslation();
  const { totalViews, totalClicks, totalLeads, conversionRate, interactionRate, loading, error } = useDashboardMetrics(pageId);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10" />
        ))}
      </div>
    );
  }

  if (error) return null;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
    >
      <motion.div variants={item}>
        <StatCard
          icon={<Eye className="h-5 w-5 text-blue-400" />}
          value={totalViews}
          label={t('metrics.views', 'Просмотры')}
          variant="glass"
          compact
          className="h-full rounded-[2rem] border-white/10"
        />
      </motion.div>

      <motion.div variants={item}>
        <StatCard
          icon={<MousePointer2 className="h-5 w-5 text-purple-400" />}
          value={totalClicks}
          label={t('metrics.clicks', 'Клики')}
          variant="glass"
          compact
          className="h-full rounded-[2rem] border-white/10"
        />
      </motion.div>

      <motion.div variants={item}>
        <StatCard
          icon={<Activity className="h-5 w-5 text-violet-400" />}
          value={`${interactionRate.toFixed(1)}%`}
          label={t('metrics.ctr', 'Interaction')}
          variant="glass"
          compact
          className="h-full rounded-[2rem] border-white/10"
        />
      </motion.div>

      <motion.div variants={item}>
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          value={`${conversionRate.toFixed(1)}%`}
          label={t('metrics.conversion', 'Конверсия')}
          variant="glass"
          compact
          className="h-full rounded-[2rem] border-white/10"
        />
      </motion.div>
    </motion.div>
  );
});
