/**
 * AdminSearchDiagnosticsTab — Support/admin view for page search status
 * Shows quality scores, indexability, exclusion reasons, IndexNow submission logs
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Search from 'lucide-react/dist/esm/icons/search';
import Globe from 'lucide-react/dist/esm/icons/globe';
import FileX from 'lucide-react/dist/esm/icons/file-x';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Eye from 'lucide-react/dist/esm/icons/eye';
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

interface IndexingSubmission {
  id: string;
  target_url: string;
  child_type: string | null;
  provider: string;
  action_type: string;
  submission_status: string;
  skip_reason: string | null;
  http_status: number | null;
  batch_id: string | null;
  created_at: string;
}

const CHILD_STATE_LABELS: Record<string, { label: string; color: string }> = {
  eligible: { label: 'В поиске', color: 'border-emerald-500/30 text-emerald-600' },
  excluded_thin: { label: 'Нет описания', color: 'border-amber-500/30 text-amber-600' },
  removed: { label: 'Удалена', color: 'border-red-500/30 text-red-500' },
  parent_not_indexable: { label: 'Родитель не индексируется', color: 'border-muted-foreground/30 text-muted-foreground' },
};

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

async function fetchSubmissionsForPage(pageId: string): Promise<IndexingSubmission[]> {
  const { data, error } = await supabase
    .from('indexing_submissions')
    .select('id, target_url, child_type, provider, action_type, submission_status, skip_reason, http_status, batch_id, created_at')
    .eq('page_id', pageId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data || []) as IndexingSubmission[];
}

/** Parse service_slugs JSONB into child entity details */
function parseChildEntities(serviceSlugs: Record<string, string> | null, pageSlug: string, isPageIndexable: boolean) {
  if (!serviceSlugs) return [];
  return Object.entries(serviceSlugs).map(([title, val]) => {
    let slug = val;
    let state = 'eligible';
    if (val.endsWith('::removed')) {
      slug = val.replace('::removed', '');
      state = 'removed';
    } else if (val.endsWith('::thin')) {
      slug = val.replace('::thin', '');
      state = 'excluded_thin';
    } else if (!isPageIndexable) {
      state = 'parent_not_indexable';
    }
    return { title, slug, state, url: `/${pageSlug}/services/${slug}` };
  });
}

function SubmissionLogDialog({ pageId, slug }: { pageId: string; slug: string }) {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['admin', 'indexing-submissions', pageId],
    queryFn: () => fetchSubmissionsForPage(pageId),
    enabled: true,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          <Eye className="h-3 w-3" />
          Логи
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">Indexing logs: /{slug}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-32" />
        ) : !submissions?.length ? (
          <p className="text-sm text-muted-foreground py-4">Нет записей индексации</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">URL</TableHead>
                <TableHead className="text-xs">Provider</TableHead>
                <TableHead className="text-xs">Action</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">HTTP</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-[10px] max-w-[200px] truncate">{s.target_url}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px]">{s.provider}</Badge>
                  </TableCell>
                  <TableCell className="text-[10px]">{s.action_type}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px]',
                        s.submission_status === 'sent' && 'border-emerald-500/30 text-emerald-600',
                        s.submission_status === 'provider_failed' && 'border-red-500/30 text-red-500',
                        s.submission_status === 'failed' && 'border-red-500/30 text-red-500',
                        s.submission_status.startsWith('skipped') && 'border-amber-500/30 text-amber-600',
                      )}
                    >
                      {s.submission_status}
                    </Badge>
                    {s.skip_reason && (
                      <span className="text-[9px] text-muted-foreground ml-1">({s.skip_reason})</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[10px] tabular-nums">{s.http_status || '—'}</TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">
                    {new Date(s.created_at).toLocaleString('ru', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
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
              <TableHead>Logs</TableHead>
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
                  <TableCell>
                    <SubmissionLogDialog pageId={page.id} slug={page.slug} />
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
