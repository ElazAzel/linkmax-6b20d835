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
import Download from 'lucide-react/dist/esm/icons/download';
import Table from 'lucide-react/dist/esm/icons/table';
import { toast } from 'sonner';
import type { AnalyticsSummary } from '@/hooks/analytics/usePageAnalytics';
import { exportAnalyticsToExcel } from '@/lib/export/excel-export-analytics';

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

  const exportToExcel = async () => {
    if (!analytics) return;
    setExporting(true);

    try {
      const pageViews = analytics.dailyData.map(d => ({
        date: d.date,
        views: d.views,
      }));

      await exportAnalyticsToExcel({
        pageViews,
        blockStats: analytics.topBlocks,
        dateRange: period,
      });

      toast.success(t('analytics.export.success', 'Данные успешно экспортированы'));
    } catch (error) {
      console.error(error);
      toast.error(t('analytics.export.error', 'Ошибка экспорта данных'));
    } finally {
      setExporting(false);
    }
  };

  if (!analytics) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={exporting}
      onClick={exportToExcel}
      className="gap-2"
    >
      <Table className="h-4 w-4" />
      <span className="hidden sm:inline">{t('analytics.export.excel', 'Export Excel')}</span>
    </Button>
  );
});
