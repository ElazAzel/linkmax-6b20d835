import { useTranslation } from 'react-i18next';
import CalendarCheck from 'lucide-react/dist/esm/icons/calendar-check';
import CircleDollarSign from 'lucide-react/dist/esm/icons/circle-dollar-sign';
import Clock3 from 'lucide-react/dist/esm/icons/clock-3';

import { Card } from '@/components/ui/card';
import type { RevenueOutcomeSummary } from '@/services/revenue-outcomes';

interface OutcomeStripProps {
  summary: RevenueOutcomeSummary;
}

function displayMoney(value: string, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(value));
}

export function OutcomeStrip({ summary }: OutcomeStripProps) {
  const { t, i18n } = useTranslation();

  if (!summary.readiness.hasKit && summary.outcome.bookingCount === 0) {
    return (
      <Card
        className="rounded-3xl border-primary/15 bg-gradient-to-br from-primary/10 to-violet-500/5 p-5"
        data-testid="revenue-outcome-strip"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          {t('outcomeHome.outcome.eyebrow', 'Результат')}
        </p>
        <h2 className="mt-2 text-xl font-black">
          {t('outcomeHome.empty.title', 'Начните принимать записи со своей страницы')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('outcomeHome.empty.description', 'Добавьте услуги, расписание и понятные условия предоплаты.')}
        </p>
      </Card>
    );
  }

  const metrics = [
    {
      id: 'net',
      icon: CircleDollarSign,
      label: t('outcomeHome.outcome.netCollected', 'Получено после возвратов'),
      value: `${displayMoney(summary.outcome.netCollectedAmount, i18n.language)} ₸`,
    },
    {
      id: 'completed',
      icon: CalendarCheck,
      label: t('outcomeHome.outcome.paidCompleted', 'Оплачено и завершено'),
      value: String(summary.outcome.paidCompletedCount),
    },
    {
      id: 'pending',
      icon: Clock3,
      label: t('outcomeHome.outcome.pendingPayments', 'Ожидают предоплату'),
      value: String(summary.outcome.pendingPaymentCount),
    },
  ];

  return (
    <Card className="rounded-3xl border-border/10 p-5 md:p-6" data-testid="revenue-outcome-strip">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            {t('outcomeHome.outcome.eyebrow', 'Результат')}
          </p>
          <h2 className="mt-1 text-xl font-black">
            {t('outcomeHome.outcome.title', 'Что принесла страница')}
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {t('outcomeHome.outcome.period', '{{from}}–{{to}}', {
            from: summary.period.from,
            to: summary.period.to,
          })}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {metrics.map(({ id, icon: Icon, label, value }) => (
          <div key={id} className="rounded-2xl bg-muted/60 p-4">
            <Icon className="mb-3 h-5 w-5 text-primary" aria-hidden="true" />
            <div className="text-2xl font-black tabular-nums">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {t('outcomeHome.outcome.provisional', 'Последние 7 дней могут измениться после завершения записей и возвратов.')}
      </p>
    </Card>
  );
}
