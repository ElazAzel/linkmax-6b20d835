/**
 * AnalyticsExport - Export analytics data to CSV/PDF
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Table } from 'lucide-react';
import { format } from 'date-fns';
import type { AnalyticsSummary } from '@/hooks/usePageAnalytics';

interface AnalyticsExportProps {
  analytics: AnalyticsSummary | null;
  pageTitle?: string;
  period: string;
}

export const AnalyticsExport = memo(function AnalyticsExport({
  analytics,
  pageTitle = 'Page',
  period,
}: AnalyticsExportProps) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    if (!analytics) return;
    setExporting(true);

    try {
      const rows = [
        ['Метрика', 'Значение'],
        ['Просмотры', analytics.totalViews.toString()],
        ['Клики', analytics.totalClicks.toString()],
        ['Шеры', analytics.totalShares.toString()],
        ['Уникальные посетители', analytics.uniqueVisitors.toString()],
        ['Среднее просмотров в день', analytics.avgViewsPerDay.toString()],
        ['Изменение просмотров (%)', analytics.viewsChange.toFixed(1)],
        ['Изменение кликов (%)', analytics.clicksChange.toFixed(1)],
        [''],
        ['Устройства'],
        ['Мобильные', analytics.deviceBreakdown.mobile.toString()],
        ['Десктоп', analytics.deviceBreakdown.desktop.toString()],
        ['Планшеты', analytics.deviceBreakdown.tablet.toString()],
        [''],
        ['Источники трафика'],
        ...analytics.trafficSources.map(s => [s.source, `${s.count} (${s.percentage.toFixed(1)}%)`]),
        [''],
        ['Топ блоки'],
        ...analytics.topBlocks.map(b => [b.blockTitle, `${b.clicks} кликов, CTR: ${b.ctr.toFixed(1)}%`]),
      ];

      const csvContent = rows.map(row => row.join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `analytics_${pageTitle}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const exportDailyData = () => {
    if (!analytics?.dailyData) return;
    setExporting(true);

    try {
      const rows = [
        ['Дата', 'Просмотры', 'Клики', 'Шеры'],
        ...analytics.dailyData.map(d => [d.date, d.views.toString(), d.clicks.toString(), d.shares.toString()]),
      ];

      const csvContent = rows.map(row => row.join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `analytics_daily_${pageTitle}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  if (!analytics) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {t('analytics.export.button', 'Экспорт')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="h-4 w-4 mr-2" />
          {t('analytics.export.summary', 'Сводка (CSV)')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportDailyData}>
          <Table className="h-4 w-4 mr-2" />
          {t('analytics.export.daily', 'По дням (CSV)')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
