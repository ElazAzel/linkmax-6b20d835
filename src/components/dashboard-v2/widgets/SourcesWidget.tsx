'use client';

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { useLeads } from '@/hooks/crm/useLeads';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/utils';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Instagram from 'lucide-react/dist/esm/icons/instagram';
import Facebook from 'lucide-react/dist/esm/icons/facebook';
import Search from 'lucide-react/dist/esm/icons/search';

interface SourcesWidgetProps {
  className?: string;
}

export const SourcesWidget = memo(function SourcesWidget({ className }: SourcesWidgetProps) {
  const { t } = useTranslation();
  const { leads, loading } = useLeads();

  const sourceData = useMemo(() => {
    if (!leads.length) return [];

    const counts: Record<string, number> = {
      direct: 0,
      instagram: 0,
      facebook: 0,
      google: 0,
      ads: 0,
      other: 0,
    };

    leads.forEach(lead => {
      const utmSource = (lead.metadata?.utm_source as string)?.toLowerCase();
      const referrer = (lead.metadata?.referrer as string)?.toLowerCase();

      if (utmSource?.includes('instagram') || referrer?.includes('instagram')) counts.instagram++;
      else if (utmSource?.includes('facebook') || referrer?.includes('facebook')) counts.facebook++;
      else if (utmSource?.includes('google') || referrer?.includes('google')) counts.google++;
      else if (utmSource?.includes('ads') || utmSource?.includes('promo')) counts.ads++;
      else if (referrer === 'direct' || !referrer) counts.direct++;
      else counts.other++;
    });

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [leads]);

  if (loading) {
    return <Skeleton className={cn("h-64 rounded-[2.5rem] bg-white/5", className)} />;
  }

  if (!leads.length || !sourceData.length) return null;

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'instagram': return <Instagram className="h-3 w-3 text-pink-400" />;
      case 'facebook': return <Facebook className="h-3 w-3 text-blue-400" />;
      case 'google': return <Search className="h-3 w-3 text-red-400" />;
      case 'direct': return <Globe className="h-3 w-3 text-emerald-400" />;
      case 'ads': return <Tag className="h-3 w-3 text-amber-400" />;
      default: return <Tag className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'instagram': return 'bg-pink-400';
      case 'facebook': return 'bg-blue-400';
      case 'google': return 'bg-red-400';
      case 'direct': return 'bg-emerald-400';
      case 'ads': return 'bg-amber-400';
      default: return 'bg-muted-foreground';
    }
  };

  const maxCount = Math.max(...sourceData.map(d => d[1]));

  return (
    <Card className={cn("p-6 md:p-8 glass border-white/10 shadow-glass-lg rounded-[2.5rem] overflow-hidden content-glow", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">
          {t('crm.sources.title', 'Источники лидов')}
        </h3>
        <div className="flex -space-x-1">
          {sourceData.slice(0, 3).map(([source]) => (
            <div key={source} className="h-5 w-5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center">
              {getSourceIcon(source)}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {sourceData.map(([source, count], idx) => (
          <div key={source} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="capitalize">{source}</span>
                <span className="text-xs text-muted-foreground opacity-60">
                  {Math.round((count / leads.length) * 100)}%
                </span>
              </div>
              <span>{count}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(count / maxCount) * 100}%` }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: "circOut" }}
                className={cn("h-full rounded-full", getSourceColor(source))}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-white/5">
        <p className="text-xs font-medium text-muted-foreground/60 leading-tight">
          {t('crm.sources.footer', 'Статистика основана на последних полученных лидах с учетом UTM-меток и рефереров.')}
        </p>
      </div>
    </Card>
  );
});
