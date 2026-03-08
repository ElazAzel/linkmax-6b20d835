/**
 * PDF Export utility for Zone Analytics
 * Uses jsPDF + autoTable with Cyrillic transliteration
 */
import { format } from 'date-fns';
import type { TeamMember, ConversionTrendPoint } from '@/hooks/zones/useZoneAnalytics';

export interface AnalyticsPDFOptions {
    zoneName: string;
    period: string;
    metrics: {
        deals: {
            total: number;
            open: number;
            won: number;
            lost: number;
            totalOpenValue: number;
            totalWonValue: number;
            winRate: number;
            funnel: { stageName: string; count: number; value: number }[];
        };
        tasks: {
            total: number;
            completed: number;
            pending: number;
            overdue: number;
        };
        invoices: {
            total: number;
            paid: number;
            pending: number;
            totalPaidAmount: number;
            totalPendingAmount: number;
        };
    };
    teamMetrics: TeamMember[];
    conversionTrend: ConversionTrendPoint[];
}

// Cyrillic to Latin transliteration
const CYR_MAP: Record<string, string> = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'Ә': 'A', 'ә': 'a', 'Ғ': 'G', 'ғ': 'g', 'Қ': 'Q', 'қ': 'q',
    'Ң': 'N', 'ң': 'n', 'Ө': 'O', 'ө': 'o', 'Ұ': 'U', 'ұ': 'u',
    'Ү': 'U', 'ү': 'u', 'Һ': 'H', 'һ': 'h', 'І': 'I', 'і': 'i',
};

function transliterate(text: string): string {
    return text.split('').map(char => CYR_MAP[char] ?? char).join('');
}

function safe(text: string | null | undefined): string {
    if (!text) return '';
    const hasCyrillic = /[\u0400-\u04FF\u0500-\u052F]/.test(text);
    return hasCyrillic ? transliterate(text) : text;
}

export async function exportAnalyticsToPDF(options: AnalyticsPDFOptions): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // ─── Header ───
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(safe('Analytics Report'), 14, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(safe(options.zoneName), 14, y);
    doc.text(`Period: ${options.period}`, pageWidth - 14, y, { align: 'right' });
    y += 8;

    doc.setFontSize(9);
    doc.text(`Generated: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, y);
    y += 10;

    // ─── Separator ───
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    // ─── KPI Summary ───
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Key Performance Indicators', 14, y);
    y += 6;

    const kpiRows = [
        ['Open Deals', String(options.metrics.deals.open), options.metrics.deals.totalOpenValue.toLocaleString() + ' KZT'],
        ['Won Deals', String(options.metrics.deals.won), options.metrics.deals.totalWonValue.toLocaleString() + ' KZT'],
        ['Lost Deals', String(options.metrics.deals.lost), '-'],
        ['Win Rate', Math.round(options.metrics.deals.winRate) + '%', '-'],
        ['Tasks Completed', `${options.metrics.tasks.completed}/${options.metrics.tasks.total}`, '-'],
        ['Tasks Overdue', String(options.metrics.tasks.overdue), '-'],
        ['Paid Invoices', String(options.metrics.invoices.paid), options.metrics.invoices.totalPaidAmount.toLocaleString() + ' KZT'],
        ['Pending Invoices', String(options.metrics.invoices.pending), options.metrics.invoices.totalPendingAmount.toLocaleString() + ' KZT'],
    ];

    autoTable(doc, {
        head: [['Metric', 'Count', 'Value']],
        body: kpiRows,
        startY: y,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 12;

    // ─── Funnel ───
    if (options.metrics.deals.funnel.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text('Sales Funnel', 14, y);
        y += 6;

        const funnelRows = options.metrics.deals.funnel.map(f => [
            safe(f.stageName),
            String(f.count),
            f.value.toLocaleString() + ' KZT',
        ]);

        autoTable(doc, {
            head: [['Stage', 'Deals', 'Value']],
            body: funnelRows,
            startY: y,
            theme: 'grid',
            headStyles: { fillColor: [139, 92, 246], textColor: 255, fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            margin: { left: 14, right: 14 },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
    }

    // ─── Team Performance ───
    if (options.teamMetrics.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text('Team Performance', 14, y);
        y += 6;

        const teamRows = options.teamMetrics.map(m => [
            safe(m.name),
            String(m.total),
            String(m.completed),
            m.completionRate + '%',
            m.avgDaysToClose + ' days',
        ]);

        autoTable(doc, {
            head: [['Member', 'Tasks', 'Done', 'Rate', 'Avg. Close']],
            body: teamRows,
            startY: y,
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            margin: { left: 14, right: 14 },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
    }

    // ─── Conversion Trend ───
    if (options.conversionTrend.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text('Deal Conversion Trend', 14, y);
        y += 6;

        const trendRows = options.conversionTrend.map(t => [
            t.period,
            String(t.won),
            String(t.lost),
            t.won + t.lost > 0 ? Math.round((t.won / (t.won + t.lost)) * 100) + '%' : '-',
        ]);

        autoTable(doc, {
            head: [['Week', 'Won', 'Lost', 'Win %']],
            body: trendRows,
            startY: y,
            theme: 'grid',
            headStyles: { fillColor: [245, 158, 11], textColor: 255, fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            margin: { left: 14, right: 14 },
        });
    }

    // ─── Footer ───
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
        `Generated by lnkmx.my | ${format(new Date(), 'dd.MM.yyyy HH:mm')}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' },
    );

    // Save
    doc.save(`analytics_${options.period}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
