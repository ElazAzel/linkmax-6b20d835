import { useTranslation } from 'react-i18next';
import CircleDollarSign from 'lucide-react/dist/esm/icons/circle-dollar-sign';

import { Card } from '@/components/ui/card';
import type { RevenueOutcomeSummary } from '@/services/revenue-outcomes';

interface RevenueBySourceProps {
  sources: RevenueOutcomeSummary['bySource'];
}

export function RevenueBySource({ sources }: RevenueBySourceProps) {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden rounded-3xl border-border/10" data-testid="revenue-by-source">
      <div className="flex items-start gap-3 border-b border-border/60 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
          <CircleDollarSign className="h-5 w-5 text-emerald-600" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-black">{t('revenueInsights.sources.title', 'Выручка по источникам')}</h2>
          <p className="text-xs text-muted-foreground">
            {t('revenueInsights.sources.description', 'Неизвестная атрибуция остаётся unknown и не распределяется искусственно.')}
          </p>
        </div>
      </div>
      {sources.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">
          {t('revenueInsights.sources.empty', 'Записей с атрибуцией за период пока нет.')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">{t('revenueInsights.sources.source', 'Источник')}</th>
                <th className="px-3 py-3 text-right font-semibold">{t('revenueInsights.sources.views', 'Услуга')}</th>
                <th className="px-3 py-3 text-right font-semibold">{t('revenueInsights.sources.started', 'Старт')}</th>
                <th className="px-3 py-3 text-right font-semibold">{t('revenueInsights.sources.bookings', 'Записи')}</th>
                <th className="px-3 py-3 text-right font-semibold">{t('revenueInsights.sources.paid', 'Оплачено')}</th>
                <th className="px-3 py-3 text-right font-semibold">{t('revenueInsights.sources.completed', 'Завершено')}</th>
                <th className="px-5 py-3 text-right font-semibold">{t('revenueInsights.sources.net', 'После возвратов')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sources.map((source) => (
                <tr key={`${source.source}:${source.currency}`}>
                  <td className="px-5 py-4 font-bold">{source.source}</td>
                  <td className="px-3 py-4 text-right tabular-nums">{source.serviceViewed}</td>
                  <td className="px-3 py-4 text-right tabular-nums">{source.bookingStarted}</td>
                  <td className="px-3 py-4 text-right tabular-nums">{source.bookingCreated}</td>
                  <td className="px-3 py-4 text-right tabular-nums">{source.bookingPaid}</td>
                  <td className="px-3 py-4 text-right tabular-nums">{source.bookingCompleted}</td>
                  <td className="px-5 py-4 text-right font-black tabular-nums">
                    {source.netCollectedAmount} {source.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
