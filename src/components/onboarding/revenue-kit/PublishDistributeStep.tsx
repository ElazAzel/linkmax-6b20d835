import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import type { RevenueKitDraft } from '@/domain/revenue-kits/beauty-v1';

interface PublishDistributeStepProps {
  draft: RevenueKitDraft;
  isApplying: boolean;
  onPublish: () => void;
  onOpenAdvancedEditor?: () => void;
}

export function PublishDistributeStep({
  draft,
  isApplying,
  onPublish,
  onOpenAdvancedEditor,
}: PublishDistributeStepProps) {
  const { t } = useTranslation();

  return (
    <section className="space-y-5 text-center" aria-labelledby="revenue-kit-publish-title">
      <div>
        <h2 id="revenue-kit-publish-title" className="text-2xl font-semibold">
          {t('revenueKit.publish.title', 'Страница готова к первым записям')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('revenueKit.publish.description', '{{count}} услуг, расписание и запись будут опубликованы вместе.', {
            count: draft.services.filter((service) => service.active).length,
          })}
        </p>
      </div>
      <Button className="w-full" size="lg" onClick={onPublish} disabled={isApplying}>
        {isApplying
          ? t('revenueKit.publish.applying', 'Публикуем…')
          : t('revenueKit.publish.action', 'Опубликовать страницу')}
      </Button>
      {onOpenAdvancedEditor && (
        <Button variant="ghost" onClick={onOpenAdvancedEditor}>
          {t('revenueKit.publish.advanced', 'Открыть расширенный редактор')}
        </Button>
      )}
    </section>
  );
}
