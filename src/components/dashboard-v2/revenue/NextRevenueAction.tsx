import { useTranslation } from 'react-i18next';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { RevenueNextAction, RevenueNextActionId } from '@/domain/revenue/next-best-action';

interface NextRevenueActionProps {
  action: RevenueNextAction;
  onNavigate: (href: string) => void;
}

const fallbackCopy: Record<RevenueNextActionId, { label: string; description: string }> = {
  start_revenue_kit: {
    label: 'Настроить запись',
    description: 'Добавьте услуги, расписание и правила предоплаты одним коротким сценарием.',
  },
  add_first_service: { label: 'Добавить услугу', description: 'Клиенту нужна хотя бы одна доступная услуга.' },
  set_availability: { label: 'Открыть расписание', description: 'Укажите будущие часы, в которые клиент может записаться.' },
  configure_deposit: { label: 'Уточнить предоплату', description: 'Добавьте понятную инструкцию по оплате.' },
  publish_page: { label: 'Опубликовать страницу', description: 'Страница готова принимать первых посетителей.' },
  copy_bio_link: { label: 'Поделиться ссылкой', description: 'Приведите первый внешний визит на опубликованную страницу.' },
  confirm_pending_deposit: { label: 'Проверить предоплату', description: 'Есть записи, которые ждут вашего подтверждения.' },
  review_past_appointments: { label: 'Завершить прошедшие записи', description: 'Отметьте результат прошедших визитов.' },
  send_upcoming_confirmation: { label: 'Подтвердить ближайшие записи', description: 'Уточните присутствие клиентов на ближайшие 24 часа.' },
  improve_booking_conversion: { label: 'Проверить путь до записи', description: 'Есть достаточный интерес к услугам, но пока нет записей.' },
  open_outcome_insights: { label: 'Открыть результаты', description: 'Операционные задачи разобраны — изучите источники и воронку.' },
};

export function NextRevenueAction({ action, onNavigate }: NextRevenueActionProps) {
  const { t } = useTranslation();
  const fallback = fallbackCopy[action.id];

  return (
    <Card
      className="rounded-3xl border-primary/15 bg-primary/[0.04] p-5"
      data-testid="revenue-next-action"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              {t('outcomeHome.next.eyebrow', 'Следующий шаг')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(`outcomeHome.actions.${action.id}.description`, fallback.description)}
            </p>
          </div>
        </div>
        <Button className="h-11 shrink-0 rounded-xl" onClick={() => onNavigate(action.href)}>
          {t(`outcomeHome.actions.${action.id}.label`, fallback.label)}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
}
