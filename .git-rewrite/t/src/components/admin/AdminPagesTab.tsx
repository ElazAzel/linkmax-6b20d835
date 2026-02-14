import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminPages } from '@/hooks/useAdminPages';
import { format } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';
import { Search, RefreshCw, Eye, ExternalLink } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function AdminPagesTab() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { data: pages, isLoading, isFetching } = useAdminPages();
  const [searchQuery, setSearchQuery] = useState('');

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'kk': return kk;
      default: return enUS;
    }
  };

  const filteredPages = useMemo(() => {
    if (!pages) return [];
    return pages.filter(p =>
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pages, searchQuery]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1 max-w-md" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('admin.searchPages') || 'Поиск страниц...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {t('admin.refresh') || 'Обновить'}
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.page') || 'Страница'}</TableHead>
                <TableHead>{t('admin.owner') || 'Владелец'}</TableHead>
                <TableHead>{t('admin.status') || 'Статус'}</TableHead>
                <TableHead>{t('admin.views') || 'Просмотры'}</TableHead>
                <TableHead>{t('admin.created') || 'Создано'}</TableHead>
                <TableHead>{t('admin.actions') || 'Действия'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map(page => (
                <TableRow key={page.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{page.title || 'Без названия'}</p>
                      <p className="text-sm text-muted-foreground">/{page.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    @{page.username}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={page.is_published ? 'default' : 'secondary'}>
                        {page.is_published ? t('admin.published') || 'Опубликовано' : t('admin.draft') || 'Черновик'}
                      </Badge>
                      {page.is_in_gallery && (
                        <Badge variant="outline" className="border-amber-500 text-amber-600">
                          {t('admin.inGallery') || 'В галерее'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{page.view_count || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(page.created_at), 'dd.MM.yyyy', { locale: getDateLocale() })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(`/${page.slug}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {t('admin.open') || 'Открыть'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t('admin.noPagesFound') || 'Страницы не найдены'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
