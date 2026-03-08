/**
 * SearchReadinessCard — shows search readiness score + actionable checklist + diagnostics
 */
import { memo, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/utils';
import { computeQualityScore, getSearchReadinessStatus, EXCLUSION_LABELS, type ExclusionReason } from '@/lib/seo/quality-score';
import Search from 'lucide-react/dist/esm/icons/search';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Circle from 'lucide-react/dist/esm/icons/circle';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Globe from 'lucide-react/dist/esm/icons/globe';
import FileX from 'lucide-react/dist/esm/icons/file-x';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import type { PageData } from '@/types/page';

interface SearchReadinessCardProps {
  pageData: PageData;
}

export const SearchReadinessCard = memo(function SearchReadinessCard({ pageData }: SearchReadinessCardProps) {
  const breakdown = useMemo(() => computeQualityScore(pageData), [pageData]);
  const { label, color } = useMemo(() => getSearchReadinessStatus(breakdown.score), [breakdown.score]);
  const [expanded, setExpanded] = useState(false);

  const failedChecks = breakdown.checks.filter(c => !c.passed);
  const passedCount = breakdown.checks.filter(c => c.passed).length;

  // Derive sitemap/index status
  const isPublished = !!pageData.isPublished;
  const isIndexable = breakdown.isIndexable;
  const inSitemap = isIndexable; // Same rule: published + score >= 40

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
        <span className="text-lg font-black tabular-nums">{breakdown.score}<span className="text-xs text-muted-foreground font-medium">/100</span></span>
      </div>

      <Progress value={breakdown.score} className="h-2" />

      {/* Status badges */}
      <div className="flex flex-wrap gap-1.5">
        {isIndexable ? (
          <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
            <Globe className="h-3 w-3" />
            В поисковых системах
          </Badge>
        ) : isPublished ? (
          <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 text-amber-600 bg-amber-500/5">
            <FileX className="h-3 w-3" />
            Не в поиске
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] gap-1 border-muted-foreground/30 text-muted-foreground">
            <FileX className="h-3 w-3" />
            Черновик
          </Badge>
        )}
        {inSitemap && (
          <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
            <MapPin className="h-3 w-3" />
            В sitemap
          </Badge>
        )}
        {breakdown.serviceCount > 0 && isIndexable && (
          <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary bg-primary/5">
            {breakdown.serviceCount} {breakdown.serviceCount === 1 ? 'услуга' : 'услуг'}
          </Badge>
        )}
      </div>

      {/* Failed checks */}
      {failedChecks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            Заполнено {passedCount} из {breakdown.checks.length}
          </p>
          <ul className="space-y-1.5">
            {failedChecks.slice(0, expanded ? failedChecks.length : 3).map(check => (
              <li key={check.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Circle className="h-3.5 w-3.5 shrink-0 opacity-40" />
                <span>{check.label}</span>
                <span className="text-[10px] opacity-50">+{check.points}</span>
              </li>
            ))}
          </ul>
          {failedChecks.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            >
              {expanded ? 'Свернуть' : `Ещё ${failedChecks.length - 3}`}
              <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
            </button>
          )}
        </div>
      )}

      {failedChecks.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">Все поля заполнены — страница видна в поиске</span>
        </div>
      )}

      {/* Exclusion summary for non-indexable published pages */}
      {isPublished && !isIndexable && failedChecks.length > 0 && (
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
          Страница опубликована, но пока не включена в поиск и sitemap. Заполните недостающие поля выше, чтобы она стала видна.
        </p>
      )}
    </Card>
  );
});
