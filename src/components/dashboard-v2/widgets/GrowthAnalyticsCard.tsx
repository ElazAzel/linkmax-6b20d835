import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Users from 'lucide-react/dist/esm/icons/users';
import Copy from 'lucide-react/dist/esm/icons/copy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getGrowthMetrics } from '@/services/viral-growth';
import { calculateViralKFactor } from '@/lib/growth/viral-engine';

interface GrowthAnalyticsCardProps {
  pageId: string;
}

const EMPTY_METRICS = { shares: 0, visits: 0, signups: 0, clones: 0, invites: 0 };

export function GrowthAnalyticsCard({ pageId }: GrowthAnalyticsCardProps) {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getGrowthMetrics(pageId).then((next) => {
      if (active) setMetrics(next);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [pageId]);

  const kFactor = calculateViralKFactor({ invitesSent: metrics.shares, attributedSignups: metrics.signups, activeUsers: 1 });

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('growth.analytics.title', 'Виральная аналитика')}</CardTitle>
        <p className="text-xs text-muted-foreground">{t('growth.analytics.subtitle', 'События коротких ссылок, referral-переходов и клонирования.')}</p>
      </CardHeader>
      <CardContent>
        {loading ? <div className="h-16 animate-pulse rounded-xl bg-muted/50" /> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric icon={<Share2 className="h-4 w-4" />} label={t('growth.analytics.shares', 'Шеры')} value={metrics.shares} />
            <Metric icon={<Users className="h-4 w-4" />} label={t('growth.analytics.visits', 'Referral визиты')} value={metrics.visits} />
            <Metric icon={<Users className="h-4 w-4" />} label={t('growth.analytics.signups', 'Регистрации')} value={metrics.signups} />
            <Metric icon={<Copy className="h-4 w-4" />} label={t('growth.analytics.clones', 'Клоны')} value={metrics.clones} />
          </div>
        )}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2 text-xs">
          <span>{t('growth.analytics.kFactor', 'K-фактор')}</span>
          <span className="font-bold text-primary">{kFactor.kFactor.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="truncate text-[11px]">{label}</span></div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
