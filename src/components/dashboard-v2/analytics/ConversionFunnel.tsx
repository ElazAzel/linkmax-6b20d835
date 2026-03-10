/**
 * ConversionFunnel - Visual funnel showing conversion stages with premium animations
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Eye from 'lucide-react/dist/esm/icons/eye';
import MousePointerClick from 'lucide-react/dist/esm/icons/mouse-pointer-click';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import UserCheck from 'lucide-react/dist/esm/icons/user-check';
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { cn } from '@/lib/utils/utils';
import { motion } from 'framer-motion';

interface FunnelStage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  dropOff: number | null;
  icon: React.ElementType;
  gradient: string;
  textColor: string;
}

interface ConversionFunnelProps {
  views: number;
  clicks: number;
  shares: number;
  conversions: number;
}

export const ConversionFunnel = memo(function ConversionFunnel({
  views,
  clicks,
  shares,
  conversions,
}: ConversionFunnelProps) {
  const { t } = useTranslation();

  const stages: FunnelStage[] = [
    {
      id: 'views',
      name: t('analytics.funnel.views', 'Просмотры'),
      count: views,
      percentage: 100,
      dropOff: null,
      icon: Eye,
      gradient: 'from-blue-500/20 to-blue-500/40',
      textColor: 'text-blue-500',
    },
    {
      id: 'clicks',
      name: t('analytics.funnel.clicks', 'Клики'),
      count: clicks,
      percentage: views > 0 ? Math.round((clicks / views) * 100) : 0,
      dropOff: views > 0 ? 100 - Math.round((clicks / views) * 100) : 0,
      icon: MousePointerClick,
      gradient: 'from-emerald-500/20 to-emerald-500/40',
      textColor: 'text-emerald-500',
    },
    {
      id: 'engagement',
      name: t('analytics.funnel.engagement', 'Вовлечение'),
      count: clicks + shares,
      percentage: views > 0 ? Math.round(((clicks + shares) / views) * 100) : 0,
      dropOff: clicks > 0 ? 100 - Math.round(((clicks + shares) / clicks) * 100) : null,
      icon: Share2,
      gradient: 'from-violet-500/20 to-violet-500/40',
      textColor: 'text-violet-500',
    },
    {
      id: 'conversions',
      name: t('analytics.funnel.conversions', 'Конверсии'),
      count: conversions,
      percentage: views > 0 ? Math.round((conversions / views) * 100) : 0,
      dropOff: (clicks + shares) > 0 ? 100 - Math.round((conversions / (clicks + shares)) * 100) : null,
      icon: UserCheck,
      gradient: 'from-amber-500/20 to-amber-500/40',
      textColor: 'text-amber-500',
    },
  ];

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
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <Card className="p-6 overflow-hidden relative border-primary/10">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <TrendingDown className="w-32 h-32 rotate-12" />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black text-lg tracking-tight">{t('analytics.funnel.title', 'Воронка конверсии')}</h3>
          <p className="text-xs text-muted-foreground">{t('analytics.funnel.subtitle', 'Путь посетителя до покупки')}</p>
        </div>
        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">
          PRO Insights
        </Badge>
      </div>

      <motion.div
        className="space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const widthPercent = Math.max(15, stage.percentage);

          return (
            <motion.div key={stage.id} variants={item} className="relative">
              {/* Drop-off indicator */}
              {index > 0 && (
                <div className="absolute -top-4 left-10 flex items-center gap-1.5 py-1 px-2 rounded-full bg-destructive/10 text-xs font-bold text-destructive border border-destructive/20 z-10">
                  <TrendingDown className="h-3 w-3" />
                  {stage.dropOff && stage.dropOff > 0 ? `${stage.dropOff}% ${t('analytics.funnel.dropOff', 'потерь')}` : t('analytics.funnel.retention', 'удержание')}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-1.5 rounded-lg bg-background border shadow-sm", stage.textColor)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-bold tracking-tight">{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black">{stage.count.toLocaleString()}</span>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground uppercase font-bold leading-none mb-1">
                        {index === 0 ? 'Base' : 'Conv.'}
                      </span>
                      <Badge variant="outline" className={cn("text-xs font-black h-5", stage.textColor, "bg-background/50 backdrop-blur-sm")}>
                        {stage.percentage}%
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="h-10 bg-muted/30 rounded-xl overflow-hidden relative border border-border/50 group">
                  <motion.div
                    className={cn("h-full bg-gradient-to-r transition-all duration-1000", stage.gradient)}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPercent}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 20, delay: index * 0.1 }}
                  />

                  {/* Subtle pattern over the bar */}
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />

                  {index < stages.length - 1 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-hover:text-primary/50 transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Global Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-primary/[0.03] to-violet-500/[0.03] border border-primary/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                {t('analytics.funnel.overallLabel', 'Итоговая конверсия')}
              </p>
              <h4 className="font-black text-xl leading-tight">
                {views > 0 ? ((conversions / views) * 100).toFixed(2) : 0}%
              </h4>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
              Efficiency
            </p>
            <div className="flex items-center gap-1 justify-end">
              {[1, 2, 3, 4, 5].map((s) => {
                const rate = views > 0 ? (conversions / views) * 100 : 0;
                const active = s <= Math.ceil(rate / 2);
                return (
                  <div
                    key={s}
                    className={cn(
                      "h-1.5 w-4 rounded-full transition-colors",
                      active ? "bg-emerald-500" : "bg-muted"
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </Card>
  );
});
