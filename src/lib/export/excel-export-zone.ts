/**
 * Excel Export utility for Zone Contacts and Deals
 * Based on excel-export-leads.ts pattern with ExcelJS
 */
import { format } from 'date-fns';
import type { ZoneContact, ZoneDeal } from '@/types/zones';

// ─── Contacts Export ───

interface ContactExportOptions {
    contacts: ZoneContact[];
    zoneName?: string;
}

export async function exportContactsToExcel({
    contacts,
    zoneName = 'Zone',
}: ContactExportOptions): Promise<void> {
    if (contacts.length === 0) throw new Error('No contacts to export');

    const headers = [
        'Имя / Name',
        'Email',
        'Телефон / Phone',
        'Компания / Company',
        'Должность / Position',
        'Telegram',
        'Теги / Tags',
        'Источник / Source',
        'Заметки / Notes',
        'Дата создания / Created At',
    ];

    // Extract dynamic custom field keys across all contacts
    const customFieldKeys = new Set<string>();
    contacts.forEach(c => {
        if (c.custom_fields) {
            Object.keys(c.custom_fields).forEach(key => customFieldKeys.add(key));
        }
    });
    const customFieldsArray = Array.from(customFieldKeys);
    
    // Append custom field headers
    customFieldsArray.forEach(key => headers.push(`CF: ${key}`));

    const rows = contacts.map(c => {
        const row = [
            c.name,
            c.email || '',
            c.phone || '',
            c.company || '',
            c.position || '',
            c.telegram_username || '',
            (c.tags || []).join(', '),
            c.source || '',
            c.notes || '',
            c.created_at ? format(new Date(c.created_at), 'dd.MM.yyyy HH:mm') : '',
        ];

        // Append custom field values
        customFieldsArray.forEach(key => {
            row.push(c.custom_fields ? String(c.custom_fields[key] || '') : '');
        });

        return row;
    });

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contacts');

    // Header row
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8E8E8' },
    };

    // Data rows
    rows.forEach(row => worksheet.addRow(row));

    // Auto-size columns
    headers.forEach((header, i) => {
        const maxLength = Math.max(
            header.length,
            ...rows.map(row => String(row[i] || '').length),
        );
        worksheet.getColumn(i + 1).width = Math.min(maxLength + 2, 50);
    });

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    const summaryData = [
        ['Зона / Zone', zoneName],
        ['Всего контактов / Total', contacts.length],
        ['С email / With email', contacts.filter(c => c.email).length],
        ['С телефоном / With phone', contacts.filter(c => c.phone).length],
        ['С Telegram', contacts.filter(c => c.telegram_username).length],
        ['Дата экспорта / Export date', format(new Date(), 'dd.MM.yyyy HH:mm')],
    ];
    summaryData.forEach((row, i) => {
        const r = summarySheet.addRow(row);
        if (i === 0) r.font = { bold: true };
    });
    summarySheet.getColumn(1).width = 30;
    summarySheet.getColumn(2).width = 25;

    // Download
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const filename = `contacts_${zoneName.replace(/\s+/g, '_')}_${dateStr}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    downloadBlob(buffer, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

// ─── Deals Export ───

interface DealExportOptions {
    deals: ZoneDeal[];
    zoneName?: string;
}

export async function exportDealsToExcel({
    deals,
    zoneName = 'Zone',
}: DealExportOptions): Promise<void> {
    if (deals.length === 0) throw new Error('No deals to export');

    const headers = [
        'Название / Title',
        'Контакт / Contact',
        'Стадия / Stage',
        'Статус / Status',
        'Сумма / Value',
        'Валюта / Currency',
        'Дата создания / Created At',
    ];

    // Extract dynamic custom field keys across all deals
    const customFieldKeys = new Set<string>();
    deals.forEach(d => {
        if (d.custom_fields) {
            Object.keys(d.custom_fields).forEach(key => customFieldKeys.add(key));
        }
    });
    const customFieldsArray = Array.from(customFieldKeys);
    
    // Append custom field headers
    customFieldsArray.forEach(key => headers.push(`CF: ${key}`));

    const rows = deals.map(d => {
        const row = [
            d.title,
            d.contact?.name || '',
            d.stage?.name || '',
            translateDealStatus(d.status),
            d.value_amount ?? '',
            d.currency || 'KZT',
            d.created_at ? format(new Date(d.created_at), 'dd.MM.yyyy HH:mm') : '',
        ];

        // Append custom field values
        customFieldsArray.forEach(key => {
            row.push(d.custom_fields ? String(d.custom_fields[key] || '') : '');
        });

        return row;
    });

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Deals');

    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8E8E8' },
    };

    rows.forEach(row => worksheet.addRow(row));

    headers.forEach((header, i) => {
        const maxLength = Math.max(header.length, ...rows.map(row => String(row[i] || '').length));
        worksheet.getColumn(i + 1).width = Math.min(maxLength + 2, 50);
    });

    // Summary
    const openDeals = deals.filter(d => d.status === 'open');
    const totalPipeline = openDeals.reduce((sum, d) => sum + (d.value_amount || 0), 0);
    const wonDeals = deals.filter(d => d.status === 'won');
    const totalWon = wonDeals.reduce((sum, d) => sum + (d.value_amount || 0), 0);

    const summarySheet = workbook.addWorksheet('Summary');
    const summaryData = [
        ['Зона / Zone', zoneName],
        ['Всего сделок / Total', deals.length],
        ['Открытые / Open', openDeals.length],
        ['Выигранные / Won', wonDeals.length],
        ['Проигранные / Lost', deals.filter(d => d.status === 'lost').length],
        ['Pipeline (₸)', totalPipeline],
        ['Выиграно (₸) / Won (₸)', totalWon],
        ['Дата экспорта / Export date', format(new Date(), 'dd.MM.yyyy HH:mm')],
    ];
    summaryData.forEach((row, i) => {
        const r = summarySheet.addRow(row);
        if (i === 0) r.font = { bold: true };
    });
    summarySheet.getColumn(1).width = 30;
    summarySheet.getColumn(2).width = 25;

    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const filename = `deals_${zoneName.replace(/\s+/g, '_')}_${dateStr}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    downloadBlob(buffer, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

// ─── Helpers ───

function downloadBlob(buffer: BlobPart, filename: string, mimeType: string) {
    const blob = new Blob([buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function translateStage(stage: string): string {
    const map: Record<string, string> = {
        new: 'Новая / New',
        qualification: 'Квалификация / Qualification',
        proposal: 'Предложение / Proposal',
        negotiation: 'Переговоры / Negotiation',
        closing: 'Закрытие / Closing',
    };
    return map[stage] || stage;
}

function translateDealStatus(status: string): string {
    const map: Record<string, string> = {
        open: 'Открыта / Open',
        won: 'Выиграна / Won',
        lost: 'Проиграна / Lost',
    };
    return map[status] || status;
}
