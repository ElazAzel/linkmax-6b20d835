/**
 * SearchReadinessCard — shows search readiness score + actionable checklist
 */
import { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/utils';
import { computeQualityScore, getSearchReadinessStatus } from '@/lib/seo/quality-score';
import Search from 'lucide-react/dist/esm/icons/search';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Circle from 'lucide-react/dist/esm/icons/circle';
import type { PageData } from '@/types/page';

interface SearchReadinessCardProps {
  pageData: PageData;
}

export const SearchReadinessCard = memo(function SearchReadinessCard({ pageData }: SearchReadinessCardProps) {
  const { score, checks } = useMemo(() => computeQualityScore(pageData), [pageData]);
  const { label, color } = useMemo(() => getSearchReadinessStatus(score), [score]);

  const failedChecks = checks.filter(c => !c.passed);
  const passedCount = checks.filter(c => c.passed).length;

  return (
    <Card className="p-5 space-y-4 glass-card border-white/10 shadow-glass">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center',
            color === 'emerald' && 'bg-emerald-500/15',
            color === 'amber' && 'bg-amber-500/15',
            color === 'red' && 'bg-red-500/15',
          )}>
            <Search className={cn(
              'h-5 w-5',
              color === 'emerald' && 'text-emerald-600',
              color === 'amber' && 'text-amber-600',
              color === 'red' && 'text-red-500',
            )} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Видимость в поиске</h3>
            <p className={cn(
              'text-xs font-medium',
              color === 'emerald' && 'text-emerald-600',
              color === 'amber' && 'text-amber-600',
              color === 'red' && 'text-red-500',
            )}>
              {label}
            </p>
          </div>
        </div>
        <span className="text-lg font-black tabular-nums">{score}<span className="text-xs text-muted-foreground font-medium">/100</span></span>
      </div>

      <Progress value={score} className="h-2" />

      {failedChecks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            Заполнено {passedCount} из {checks.length}
          </p>
          <ul className="space-y-1.5">
            {failedChecks.slice(0, 4).map(check => (
              <li key={check.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Circle className="h-3.5 w-3.5 shrink-0 opacity-40" />
                <span>{check.label}</span>
                <span className="text-[10px] opacity-50">+{check.points}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {failedChecks.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">Все поля заполнены — страница видна в поиске</span>
        </div>
      )}
    </Card>
  );
});
