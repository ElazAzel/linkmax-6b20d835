/**
 * AdminSearchDiagnosticsTab — Support/admin view for page search status
 * Shows quality scores, indexability, exclusion reasons, IndexNow status
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import Search from 'lucide-react/dist/esm/icons/search';
import Globe from 'lucide-react/dist/esm/icons/globe';
import FileX from 'lucide-react/dist/esm/icons/file-x';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { cn } from '@/lib/utils/utils';

interface DiagnosticPage {
  id: string;
  slug: string;
  title: string | null;
  is_published: boolean;
  quality_score: number | null;
  quality_breakdown: Record<string, { passed: boolean; points: number }> | null;
  index_exclusion_reasons: string[] | null;
  last_indexnow_at: string | null;
  service_slugs: Record<string, string> | null;
  city: string | null;
  profession: string | null;
  niche: string | null;
  view_count: number | null;
  updated_at: string | null;
}

const EXCLUSION_LABELS: Record<string, string> = {
  missing_name: 'Нет имени',
  missing_avatar: 'Нет аватара',
  missing_bio: 'Нет описания',
  missing_niche: 'Нет категории',
  missing_city: 'Нет города',
  no_services: 'Нет услуг',
  no_socials: 'Нет соцсетей',
  no_contact: 'Нет контакта',
  low_quality_score: 'Низкий score',
  unpublished: 'Не опубликовано',
};

async function fetchDiagnosticPages(): Promise<DiagnosticPage[]> {
  const { data, error } = await supabase
    .from('pages')
    .select('id, slug, title, is_published, quality_score, quality_breakdown, index_exclusion_reasons, last_indexnow_at, service_slugs, city, profession, niche, view_count, updated_at')
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data || []) as DiagnosticPage[];
}

export function AdminSearchDiagnosticsTab() {
  const { data: pages, isLoading } = useQuery({
    queryKey: ['admin', 'search-diagnostics'],
    queryFn: fetchDiagnosticPages,
  });
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!pages) return [];
    if (!search) return pages;
    const q = search.toLowerCase();
    return pages.filter(p =>
      p.slug?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.profession?.toLowerCase().includes(q)
    );
  }, [pages, search]);

  // Stats
  const stats = useMemo(() => {
    if (!pages) return { total: 0, published: 0, indexable: 0, avgScore: 0, withIndexNow: 0 };
    const published = pages.filter(p => p.is_published);
    const indexable = published.filter(p => (p.quality_score || 0) >= 40);
    const avgScore = published.length > 0
      ? Math.round(published.reduce((s, p) => s + (p.quality_score || 0), 0) / published.length)
      : 0;
    const withIndexNow = pages.filter(p => p.last_indexnow_at).length;
    return { total: pages.length, published: published.length, indexable: indexable.length, avgScore, withIndexNow };
  }, [pages]);

  if (isLoading) {
    return <div className="space-y-4 p-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Всего страниц</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.published}</div>
          <div className="text-xs text-muted-foreground">Опубликовано</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.indexable}</div>
          <div className="text-xs text-muted-foreground">Индексируемых</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{stats.avgScore}</div>
          <div className="text-xs text-muted-foreground">Ср. score</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.withIndexNow}</div>
          <div className="text-xs text-muted-foreground">IndexNow</div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по slug, title, city, profession..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Exclusions</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>IndexNow</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(page => {
              const score = page.quality_score || 0;
              const isIndexable = page.is_published && score >= 40;
              const exclusions = page.index_exclusion_reasons || [];
              const serviceCount = page.service_slugs ? Object.keys(page.service_slugs).length : 0;

              return (
                <TableRow key={page.id}>
                  <TableCell>
                    <div>
                      <a
                        href={`/${page.slug}`}
                        target="_blank"
                        rel="noopener"
                        className="font-mono text-sm text-primary hover:underline"
                      >
                        {page.slug}
                      </a>
                      {page.title && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{page.title}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={score} className="h-1.5 w-16" />
                      <span className={cn(
                        'text-sm font-bold tabular-nums',
                        score >= 40 ? 'text-emerald-600' : score >= 20 ? 'text-amber-600' : 'text-red-500'
                      )}>{score}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isIndexable ? (
                      <Badge variant="outline" className="gap-1 text-[10px] border-emerald-500/30 text-emerald-600">
                        <Globe className="h-3 w-3" />
                        Indexable
                      </Badge>
                    ) : page.is_published ? (
                      <Badge variant="outline" className="gap-1 text-[10px] border-amber-500/30 text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        NoIndex
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-[10px] border-muted-foreground/30">
                        <FileX className="h-3 w-3" />
                        Draft
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {exclusions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {exclusions.slice(0, 3).map(r => (
                          <Badge key={r} variant="secondary" className="text-[9px] px-1.5 py-0">
                            {EXCLUSION_LABELS[r] || r}
                          </Badge>
                        ))}
                        {exclusions.length > 3 && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">+{exclusions.length - 3}</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-emerald-600">✓</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      {page.profession && <div>{page.profession}</div>}
                      {page.city && <div className="text-muted-foreground">{page.city}</div>}
                      {page.niche && <div className="text-muted-foreground">{page.niche}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {serviceCount > 0 ? (
                      <span className="text-sm font-medium">{serviceCount}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {page.last_indexnow_at ? (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(page.last_indexnow_at).toLocaleDateString('ru')}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
