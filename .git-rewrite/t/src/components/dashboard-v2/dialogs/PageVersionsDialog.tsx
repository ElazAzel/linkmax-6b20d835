/**
 * PageVersionsDialog - Browse and restore previous page versions
 */
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { History, RotateCcw, Loader2, Clock } from 'lucide-react';
import type { PageVersion } from '@/hooks/usePageVersions';

interface PageVersionsDialogProps {
  open: boolean;
  onClose: () => void;
  versions: PageVersion[];
  loading: boolean;
  onRestore: (version: PageVersion) => void;
  pageId?: string;
  onFetch?: (pageId: string) => void;
}

const getLocale = (lang: string) => {
  switch (lang) {
    case 'ru': return ru;
    case 'kk': return kk;
    default: return enUS;
  }
};

export const PageVersionsDialog = memo(function PageVersionsDialog({
  open,
  onClose,
  versions,
  loading,
  onRestore,
  pageId,
  onFetch,
}: PageVersionsDialogProps) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (open && pageId && onFetch) {
      onFetch(pageId);
    }
  }, [open, pageId, onFetch]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'dd MMM yyyy, HH:mm', { locale: getLocale(i18n.language) });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {t('versions.title', 'История версий')}
          </DialogTitle>
          <DialogDescription>
            {t('versions.description', 'Последние 5 сохранённых версий страницы')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t('versions.empty', 'История пуста')}</p>
              <p className="text-sm mt-1">
                {t('versions.emptyHint', 'Версии создаются при публикации страницы')}
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-1">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {t('versions.version', 'Версия')} {versions.length - index}
                        </span>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            {t('versions.current', 'Текущая')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(version.publishedAt)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {version.blocks.length} {t('versions.blocks', 'блоков')}
                      </p>
                    </div>
                    
                    {index > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5"
                        onClick={() => onRestore(version)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {t('versions.restore', 'Восстановить')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.close', 'Закрыть')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
