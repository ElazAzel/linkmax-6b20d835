/**
 * SearchReadinessCard — shows search readiness score + actionable checklist + server diagnostics
 * 
 * State model:
 * 1. Instant: client-side preview (computeQualityScore) — shown immediately as user edits
 * 2. Confirmed: server diagnostics (get_page_search_diagnostics) — fetched after save/publish
 * 
 * Preview is labeled "предпросмотр", confirmed is labeled "проверено"
 */
import { memo, useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/utils';
import { computeQualityScore, getSearchReadinessStatus, type QualityBreakdown } from '@/lib/seo/quality-score';
import { fetchPageSearchDiagnostics, type SearchDiagnostics, type ChildSummary } from '@/lib/seo/indexnow-client';
import { motion } from 'framer-motion';
import Search from 'lucide-react/dist/esm/icons/search';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Circle from 'lucide-react/dist/esm/icons/circle';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Globe from 'lucide-react/dist/esm/icons/globe';
import FileX from 'lucide-react/dist/esm/icons/file-x';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import type { PageData } from '@/types/page';

interface SearchReadinessCardProps {
  pageData: PageData;
}

export const SearchReadinessCard = memo(function SearchReadinessCard({ pageData }: SearchReadinessCardProps) {
  const { t } = useTranslation();
  // 1. Client-side preview (instant, on every keystroke)
  const preview = useMemo(() => computeQualityScore(pageData), [pageData]);
  
  // 2. Server diagnostics (fetched after save, authoritative)
  const pageId = pageData.id;
  const { data: serverDiag, isLoading: diagLoading, dataUpdatedAt } = useQuery({
    queryKey: ['search-diagnostics', pageId],
    queryFn: () => fetchPageSearchDiagnostics(pageId),
    enabled: !!pageId,
    staleTime: 30_000, // 30s — refetch naturally after saves
    refetchOnWindowFocus: false,
  });

  // Determine which source to display
  const hasServerData = !!serverDiag && !('error' in serverDiag);
  const serverScore = hasServerData ? serverDiag.quality_score : null;
  const isServerStale = hasServerData && Math.abs((serverScore ?? 0) - preview.score) > 5;
  
  // Use server score when available and fresh, preview otherwise
  const displayScore = hasServerData && !isServerStale ? serverScore! : preview.score;
  const { label, color } = useMemo(() => getSearchReadinessStatus(displayScore), [displayScore]);

  // Server-authoritative statuses
  const isPublished = hasServerData ? serverDiag.is_published : !!pageData.isPublished;
  const isIndexable = hasServerData ? serverDiag.is_indexable : preview.isIndexable;
  const inSitemap = hasServerData ? serverDiag.included_in_sitemap : preview.isIndexable;
  const childCount = hasServerData ? serverDiag.child_page_count : preview.serviceCount;
  const childSummary: ChildSummary | null = hasServerData ? serverDiag.child_summary : null;
  const lastIndexNow = hasServerData ? serverDiag.last_indexnow_at : null;

  const failedChecks = preview.checks.filter(c => !c.passed);
  const passedCount = preview.checks.filter(c => c.passed).length;
  const [expanded, setExpanded] = useState(false);

  // Source indicator
  const sourceLabel = hasServerData && !isServerStale
    ? 'Проверено сервером'
    : isServerStale
      ? 'Изменения ещё не пересчитаны'
      : diagLoading
        ? 'Проверка...'
        : 'Предпросмотр';

  return (
    <Card className="p-6 space-y-5 glass border-white/10 shadow-glass rounded-[2rem] overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-30 pointer-events-none" />
      
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-4">
          <div className={cn(
            'h-12 w-12 rounded-[1.25rem] flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 duration-500',
            color === 'emerald' && 'bg-emerald-500/10',
            color === 'amber' && 'bg-amber-500/10',
            color === 'red' && 'bg-red-500/10',
          )}>
            <Search className={cn(
              'h-6 w-6',
              color === 'emerald' && 'text-emerald-500',
              color === 'amber' && 'text-amber-500',
              color === 'red' && 'text-red-500',
            )} />
          </div>
          <div>
            <h3 className="font-black text-sm tracking-tight">{t('seo.readiness.title', 'Видимость в поиске')}</h3>
            <p className={cn(
              'text-xs font-black uppercase tracking-[0.15em] opacity-80',
              color === 'emerald' && 'text-emerald-500',
              color === 'amber' && 'text-amber-500',
              color === 'red' && 'text-red-500',
            )}>
              {label}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-0.5">
            <span className="text-2xl font-black tracking-tighter tabular-nums">{displayScore}</span>
            <span className="text-xs text-muted-foreground font-black opacity-40">/100</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            {diagLoading && <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin" />}
            <span className={cn(
              'text-xs font-bold uppercase tracking-widest',
              hasServerData && !isServerStale ? 'text-emerald-500/70' : 'text-muted-foreground/50'
            )}>
              {sourceLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="relative h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
        <motion.div 
          className={cn(
            'h-full rounded-full shadow-lg transition-all duration-1000',
            color === 'emerald' && 'bg-emerald-500 shadow-emerald-500/20',
            color === 'amber' && 'bg-amber-500 shadow-amber-500/20',
            color === 'red' && 'bg-red-500 shadow-red-500/20',
          )}
          initial={{ width: 0 }}
          animate={{ width: `${displayScore}%` }}
        />
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-1.5">
        {isIndexable ? (
          <Badge variant="outline" className="text-xs gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
            <Globe className="h-3 w-3" />
            В поисковых системах
          </Badge>
        ) : isPublished ? (
          <Badge variant="outline" className="text-xs gap-1 border-amber-500/30 text-amber-600 bg-amber-500/5">
            <FileX className="h-3 w-3" />
            Не в поиске
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs gap-1 border-muted-foreground/30 text-muted-foreground">
            <FileX className="h-3 w-3" />
            Черновик
          </Badge>
        )}
        {inSitemap && (
          <Badge variant="outline" className="text-xs gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
            <MapPin className="h-3 w-3" />
            В sitemap
          </Badge>
        )}
        {childCount > 0 && isIndexable && (
          <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary bg-primary/5">
            {childSummary
              ? `${childSummary.eligible} из ${childSummary.total - childSummary.removed} услуг в поиске`
              : `${childCount} ${childCount === 1 ? 'услуга' : 'услуг'}`
            }
          </Badge>
        )}
        {childSummary && childSummary.excluded_thin > 0 && (
          <Badge variant="outline" className="text-xs gap-1 border-amber-500/30 text-amber-600 bg-amber-500/5">
            {childSummary.excluded_thin} услуг без описания
          </Badge>
        )}
        {lastIndexNow && (
          <Badge variant="outline" className="text-xs gap-1 border-muted-foreground/20 text-muted-foreground">
            IndexNow: {new Date(lastIndexNow).toLocaleDateString('ru')}
          </Badge>
        )}
      </div>

      {/* Failed checks (always from client preview for instant feedback) */}
      {failedChecks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            Заполнено {passedCount} из {preview.checks.length}
          </p>
          <ul className="space-y-1.5">
            {failedChecks.slice(0, expanded ? failedChecks.length : 3).map(check => (
              <li key={check.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Circle className="h-3.5 w-3.5 shrink-0 opacity-40" />
                <span>{check.label}</span>
                <span className="text-xs opacity-50">+{check.points}</span>
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
