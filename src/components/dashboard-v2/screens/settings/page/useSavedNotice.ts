import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

/**
 * Saving is asynchronous, so do not claim it has completed at edit time.
 */
export function useSavedNotice(isPublished: boolean) {
  const { t } = useTranslation();
  return useCallback(() => {
    if (isPublished) {
      toast.info(t('dashboard.pageSettings.savingChanges', 'Сохраняем изменения'), {
        description: t('dashboard.pageSettings.savedDraftHint', 'Нажмите «Опубликовать», чтобы изменения появились на странице'),
      });
    } else {
      toast.info(t('dashboard.pageSettings.savingChanges', 'Сохраняем изменения'));
    }
  }, [isPublished, t]);
}
