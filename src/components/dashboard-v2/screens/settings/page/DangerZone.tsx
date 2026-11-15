import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import { Button } from '@/components/ui/button';

interface DangerZoneProps {
  /** Undefined when the page cannot be deleted (it is the only one). */
  onDeletePage?: () => void;
}

export const DangerZone = memo(function DangerZone({ onDeletePage }: DangerZoneProps) {
  const { t } = useTranslation();
  return (
    <section
      className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4"
      aria-labelledby="page-danger-zone-title"
      data-testid="page-settings-danger-zone"
    >
      <h3 id="page-danger-zone-title" className="text-sm font-bold uppercase tracking-[0.06em] text-destructive">
        {t('dashboard.pageSettings.dangerZone', 'Удаление страницы')}
      </h3>
      <p className="text-sm text-muted-foreground">
        {onDeletePage
          ? t('dashboard.pageSettings.deletePageHint', 'Страница, её блоки и адрес будут удалены без возможности восстановления.')
          : t('dashboard.pageSettings.deleteOnlyPageHint', 'Это ваша единственная страница, поэтому удалить её нельзя. Чтобы начать заново, примените другой шаблон.')}
      </p>
      {onDeletePage && (
        <Button variant="destructive" className="rounded-xl" onClick={onDeletePage} data-testid="page-settings-delete">
          <Trash2 className="mr-2 h-4 w-4" />
          {t('dashboard.pageSettings.deletePage', 'Удалить страницу')}
        </Button>
      )}
    </section>
  );
});
