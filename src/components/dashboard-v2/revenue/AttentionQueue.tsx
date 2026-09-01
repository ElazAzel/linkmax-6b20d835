import { useTranslation } from 'react-i18next';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import CalendarClock from 'lucide-react/dist/esm/icons/calendar-clock';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { RevenueOperationItem, RevenueOutcomeSummary } from '@/services/revenue-outcomes';

interface AttentionQueueProps {
  operations: RevenueOutcomeSummary['operations'];
  onNavigate: (href: string) => void;
}

const DATE_SEPARATOR = ' · ';

function QueueGroup({
  title,
  items,
  href,
  onNavigate,
}: {
  title: string;
  items: RevenueOperationItem[];
  href: string;
  onNavigate: (href: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <Button
      variant="ghost"
      className="h-auto w-full justify-between rounded-2xl bg-muted/50 px-4 py-3 text-left"
      onClick={() => onNavigate(href)}
    >
      <span className="min-w-0">
        <span className="block font-bold">{title}</span>
        <span className="block truncate text-xs font-normal text-muted-foreground">
          {items[0].serviceName}{DATE_SEPARATOR}{items[0].localStart.replace('T', ' ')}
        </span>
      </span>
      <Badge variant="secondary" className="ml-3 tabular-nums">{items.length}</Badge>
    </Button>
  );
}

export function AttentionQueue({ operations, onNavigate }: AttentionQueueProps) {
  const { t } = useTranslation();
  const total = operations.pendingPayments.length
    + operations.pastAppointments.length
    + operations.upcomingUnacknowledged.length;

  return (
    <Card className="rounded-3xl border-border/10 p-5" data-testid="revenue-attention-queue">
      <div className="mb-4 flex items-center gap-3">
        {total > 0
          ? <AlertCircle className="h-5 w-5 text-amber-600" aria-hidden="true" />
          : <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />}
        <div>
          <h3 className="font-black">{t('outcomeHome.attention.title', 'Требует внимания')}</h3>
          <p className="text-xs text-muted-foreground">
            {total > 0
              ? t('outcomeHome.attention.count', '{{count}} задач по записям', { count: total })
              : t('outcomeHome.attention.empty', 'Срочных действий по записям нет')}
          </p>
        </div>
      </div>
      {total > 0 && (
        <div className="space-y-2">
          <QueueGroup
            title={t('outcomeHome.attention.pending', 'Ожидают предоплату')}
            items={operations.pendingPayments}
            href="/dashboard/activity?filter=pending_payment"
            onNavigate={onNavigate}
          />
          <QueueGroup
            title={t('outcomeHome.attention.past', 'Прошедшие без результата')}
            items={operations.pastAppointments}
            href="/dashboard/activity?filter=past_confirmed"
            onNavigate={onNavigate}
          />
          <QueueGroup
            title={t('outcomeHome.attention.upcoming', 'Нужно подтверждение клиента')}
            items={operations.upcomingUnacknowledged}
            href="/dashboard/activity?filter=confirmation_due"
            onNavigate={onNavigate}
          />
        </div>
      )}
      {total === 0 && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/5 px-4 py-3 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          {t('outcomeHome.attention.healthy', 'Можно сосредоточиться на новых записях.')}
        </div>
      )}
    </Card>
  );
}
