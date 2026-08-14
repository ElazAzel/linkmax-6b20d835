import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { PageData } from '@/types/page';
import { calculateViralReadiness, getViralReadinessLabel } from '@/lib/growth/viral-engine';

interface ViralReadinessCardProps {
  pageData: PageData;
  compact?: boolean;
}

export const ViralReadinessCard = memo(function ViralReadinessCard({ pageData, compact = false }: ViralReadinessCardProps) {
  const { t } = useTranslation();
  const result = useMemo(() => calculateViralReadiness(pageData), [pageData]);
  const label = getViralReadinessLabel(result.score);
  const nextDimension = result.dimensions.find((dimension) => !dimension.present);

  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t('growth.readiness.title', 'Viral Readiness')}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('growth.readiness.subtitle', 'Алгоритм проверяет, готова ли страница приводить следующий создательский круг.')}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-black text-primary">{result.score}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</div>
          </div>
        </div>
        <Progress value={result.score} className="h-2" aria-label={`Viral readiness ${result.score}%`} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {result.dimensions.slice(0, compact ? 4 : result.dimensions.length).map((dimension) => (
            <div key={dimension.key} className="rounded-xl border border-border/60 bg-background/40 p-2">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t(`growth.readiness.dimensions.${dimension.key}`, dimension.key)}
                </span>
                {dimension.present ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> : <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
              </div>
              <div className="mt-1 text-sm font-bold">{dimension.score}/{dimension.weight}</div>
            </div>
          ))}
        </div>
        {nextDimension && (
          <div className="rounded-xl bg-primary/10 px-3 py-2 text-xs">
            <span className="font-semibold">{t('growth.readiness.next', 'Следующий шаг:')}</span>{' '}
            {t(`growth.readiness.actions.${nextDimension.key}`, `Добавьте блок: ${nextDimension.recommendedBlockTypes.join(', ')}`)}
          </div>
        )}
        <div className="text-[11px] text-muted-foreground">
          {t(`growth.readiness.labels.${label}`, label === 'strong' ? 'Сильная петля' : label === 'ready' ? 'Готово к росту' : 'Нужно усилить основу')}
        </div>
      </CardContent>
    </Card>
  );
});
