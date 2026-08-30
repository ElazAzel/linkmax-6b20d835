import { useTranslation } from 'react-i18next';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';

import { Card } from '@/components/ui/card';
import type { RevenueOutcomeSummary } from '@/services/revenue-outcomes';

interface RevenueFunnelProps {
  funnel: RevenueOutcomeSummary['funnel'];
}

export function RevenueFunnel({ funnel }: RevenueFunnelProps) {
  const { t } = useTranslation();
  const steps = [
    { id: 'serviceViewed', label: t('revenueInsights.funnel.serviceViewed', 'Просмотр услуги'), value: funnel.serviceViewed },
    { id: 'bookingStarted', label: t('revenueInsights.funnel.bookingStarted', 'Начало записи'), value: funnel.bookingStarted },
    { id: 'bookingCreated', label: t('revenueInsights.funnel.bookingCreated', 'Запись создана'), value: funnel.bookingCreated },
    { id: 'bookingPaid', label: t('revenueInsights.funnel.bookingPaid', 'Оплачено'), value: funnel.bookingPaid },
    { id: 'bookingCompleted', label: t('revenueInsights.funnel.bookingCompleted', 'Завершено'), value: funnel.bookingCompleted },
  ];
  const maximum = Math.max(...steps.map((step) => step.value), 1);

  return (
    <Card className="rounded-3xl border-border/10 p-5" data-testid="revenue-funnel">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-black">{t('revenueInsights.funnel.title', 'Путь до завершённой записи')}</h2>
          <p className="text-xs text-muted-foreground">
            {t('revenueInsights.funnel.description', 'Наблюдаемые события и факты записей за выбранный период.')}
          </p>
        </div>
      </div>
      <ol className="space-y-3">
        {steps.map((step, index) => {
          const previous = index === 0 ? null : steps[index - 1].value;
          const rate = previous && previous > 0
            ? `${Math.round((step.value / previous) * 100)}%`
            : '—';
          return (
            <li key={step.id} className="grid grid-cols-[minmax(0,1fr)_56px_48px] items-center gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold" data-testid="revenue-funnel-label">{step.label}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${Math.max(3, (step.value / maximum) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-right text-lg font-black tabular-nums">{step.value}</span>
              <span className="text-right text-xs text-muted-foreground">{rate}</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
