/**
 * Excel Export utility for Leads (CRM)
 */
// ExcelJS is dynamically imported to avoid loading 200KB+ on initial page load
import { format } from 'date-fns';
import type { Lead } from '@/hooks/crm/useLeads';

interface LeadExportOptions {
    leads: Lead[];
}

/**
 * Export Leads to XLSX file
 */
export async function exportLeadsToExcel({
    leads,
}: LeadExportOptions): Promise<void> {
    if (leads.length === 0) {
        throw new Error('No leads to export');
    }

    // Build headers
    const headers = [
        'ID',
        'Имя / Name',
        'Email',
        'Телефон / Phone',
        'Источник / Source',
        'Статус / Status',
        'Заметки / Notes',
        'Дата создания / Created At',
    ];

    // Build rows
    const rows = leads.map((lead) => {
        return [
            lead.id,
            lead.name,
            lead.email || '',
            lead.phone || '',
            translateSource(lead.source),
            translateStatus(lead.status),
            lead.notes || '',
            format(new Date(lead.created_at), 'dd.MM.yyyy HH:mm'),
        ];
    });

    // Dynamically import exceljs only when export is triggered
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');

    // Add headers with styling
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8E8E8' }
    };

    // Add data rows
    rows.forEach(row => {
        worksheet.addRow(row);
    });

    // Auto-size columns
    headers.forEach((header, i) => {
        const maxLength = Math.max(
            header.length,
            ...rows.map(row => String(row[i] || '').length)
        );
        const colWidth = Math.min(maxLength + 2, 50);
        worksheet.getColumn(i + 1).width = colWidth;
    });

    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    const summaryData = [
        ['Всего лидов / Total', leads.length],
        ['Новые / New', leads.filter(l => l.status === 'new').length],
        ['В работе / Contacted', leads.filter(l => l.status === 'contacted').length],
        ['Квалифицированы / Qualified', leads.filter(l => l.status === 'qualified').length],
        ['Сделки / Converted', leads.filter(l => l.status === 'converted').length],
        ['Потеряны / Lost', leads.filter(l => l.status === 'lost').length],
        ['Дата экспорта / Export date', format(new Date(), 'dd.MM.yyyy HH:mm')],
    ];

    summaryData.forEach(row => {
        const summaryRow = summarySheet.addRow(row);
        if (row === summaryData[0]) {
            summaryRow.font = { bold: true };
        }
    });

    summarySheet.getColumn(1).width = 30;
    summarySheet.getColumn(2).width = 20;

    // Generate filename and download
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const filename = `leads_export_${dateStr}.xlsx`;

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

function translateStatus(status: string): string {
    const map: Record<string, string> = {
        new: 'Новый / New',
        contacted: 'В работе / Contacted',
        qualified: 'Квалифицирован / Qualified',
        converted: 'Сделка / Converted',
        lost: 'Потерян / Lost',
    };
    return map[status] || status;
}

function translateSource(source: string): string {
    const map: Record<string, string> = {
        form: 'Форма / Form',
        messenger: 'Мессенджер / Messenger',
        manual: 'Вручную / Manual',
        page_view: 'Просмотр страницы / Page View',
        other: 'Другое / Other',
    };
    return map[source] || source;
}
