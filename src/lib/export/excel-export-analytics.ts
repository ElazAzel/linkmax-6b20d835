/**
 * Excel Export utility for Analytics (Insights)
 */
import ExcelJS from 'exceljs';
import { format } from 'date-fns';

interface AnalyticsExportOptions {
    pageViews: { date: string; views: number }[];
    blockStats: {
        blockId: string;
        blockType: string;
        views: number;
        clicks: number;
        ctr: number;
    }[];
    dateRange: string;
}

/**
 * Export Analytics to XLSX file
 */
export async function exportAnalyticsToExcel({
    pageViews,
    blockStats,
    dateRange,
}: AnalyticsExportOptions): Promise<void> {

    const workbook = new ExcelJS.Workbook();
    const dateStr = format(new Date(), 'yyyy-MM-dd');

    // Sheet 1: Page Views
    const viewsSheet = workbook.addWorksheet('Page Views (Просмотры)');
    const viewsHeaders = ['Дата / Date', 'Просмотры / Views'];

    const vHeaderRow = viewsSheet.addRow(viewsHeaders);
    vHeaderRow.font = { bold: true };
    vHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8E8E8' }
    };

    let totalViews = 0;
    pageViews.forEach(v => {
        viewsSheet.addRow([
            format(new Date(v.date), 'dd.MM.yyyy'),
            v.views
        ]);
        totalViews += v.views;
    });

    viewsSheet.getColumn(1).width = 25;
    viewsSheet.getColumn(2).width = 20;

    // Sheet 2: Block Stats
    const blocksSheet = workbook.addWorksheet('Block CTR (Блоки)');
    const blocksHeaders = ['ID Блока', 'Тип / Type', 'Просмотры / Views', 'Клики / Clicks', 'CTR (%)'];

    const bHeaderRow = blocksSheet.addRow(blocksHeaders);
    bHeaderRow.font = { bold: true };
    bHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8E8E8' }
    };

    let totalBlockViews = 0;
    let totalBlockClicks = 0;

    blockStats.forEach(b => {
        blocksSheet.addRow([
            b.blockId,
            b.blockType,
            b.views,
            b.clicks,
            b.ctr.toFixed(2) + '%'
        ]);
        totalBlockViews += b.views;
        totalBlockClicks += b.clicks;
    });

    blocksSheet.getColumn(1).width = 35;
    blocksSheet.getColumn(2).width = 20;
    blocksSheet.getColumn(3).width = 20;
    blocksSheet.getColumn(4).width = 20;
    blocksSheet.getColumn(5).width = 15;

    // Sheet 3: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    const summaryData = [
        ['Аналитика / Analytics Period', dateRange],
        ['Всего просмотров страницы / Total Page Views', totalViews],
        ['Всего просмотров блоков / Total Block Views', totalBlockViews],
        ['Всего кликов по блокам / Total Block Clicks', totalBlockClicks],
        ['Средний CTR / Average CTR', totalBlockViews > 0 ? ((totalBlockClicks / totalBlockViews) * 100).toFixed(2) + '%' : '0%'],
        ['Дата экспорта / Export date', format(new Date(), 'dd.MM.yyyy HH:mm')],
    ];

    summaryData.forEach(row => {
        const summaryRow = summarySheet.addRow(row);
        if (row === summaryData[0]) {
            summaryRow.font = { bold: true };
        }
    });

    summarySheet.getColumn(1).width = 45;
    summarySheet.getColumn(2).width = 25;

    // Generate filename and download
    const filename = `analytics_export_${dateStr}.xlsx`;

    // Write to buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
