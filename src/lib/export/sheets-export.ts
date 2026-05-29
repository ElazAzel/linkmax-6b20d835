/**
 * Excel/CSV Export utilities for Zone data
 */
// import ExcelJS from 'exceljs'; // Removed static import for bundle optimization
import type { ZoneContact, ZoneDeal, ZoneDealStage } from '@/types/zones';

interface ExportOptions {
  filename: string;
  sheetName?: string;
}

// Export Contacts to Excel
export async function exportContactsToExcel(
  contacts: ZoneContact[],
  options: ExportOptions = { filename: 'contacts' }
): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(options.sheetName || 'Contacts');

  // Define columns
  sheet.columns = [
    { header: 'Имя', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Телефон', key: 'phone', width: 20 },
    { header: 'Компания', key: 'company', width: 25 },
    { header: 'Должность', key: 'position', width: 20 },
    { header: 'Telegram', key: 'telegram', width: 20 },
    { header: 'Теги', key: 'tags', width: 30 },
    { header: 'Создан', key: 'created_at', width: 20 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add data rows
  contacts.forEach((contact) => {
    sheet.addRow({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      position: contact.position || '',
      telegram: contact.telegram_username || '',
      tags: (contact.tags || []).join(', '),
      created_at: contact.created_at ? new Date(contact.created_at).toLocaleDateString('ru-RU') : '',
    });
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, `${options.filename}.xlsx`);
}

// Export Deals to Excel with funnel summary
export async function exportDealsToExcel(
  deals: ZoneDeal[],
  stages: ZoneDealStage[],
  options: ExportOptions = { filename: 'deals' }
): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  
  // Main deals sheet
  const dealsSheet = workbook.addWorksheet(options.sheetName || 'Deals');
  
  dealsSheet.columns = [
    { header: 'Название', key: 'title', width: 30 },
    { header: 'Сумма', key: 'value_amount', width: 15 },
    { header: 'Валюта', key: 'currency', width: 10 },
    { header: 'Стадия', key: 'stage', width: 20 },
    { header: 'Статус', key: 'status', width: 12 },
    { header: 'Контакт', key: 'contact', width: 25 },
    { header: 'Источник', key: 'source', width: 15 },
    { header: 'След. шаг', key: 'next_step', width: 25 },
    { header: 'Создан', key: 'created_at', width: 15 },
    { header: 'Причина проигрыша', key: 'lost_reason', width: 30 },
  ];

  // Style header
  const headerRow = dealsSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' },
  };

  // Add deals data
  deals.forEach((deal) => {
    const stage = stages.find((s) => s.id === deal.stage_id);
    dealsSheet.addRow({
      title: deal.title,
      value_amount: deal.value_amount,
      currency: deal.currency,
      stage: stage?.name || '—',
      status: deal.status === 'won' ? 'Выигран' : deal.status === 'lost' ? 'Проигран' : 'Открыт',
      contact: deal.contact?.name || '—',
      source: deal.source || '—',
      next_step: deal.next_step || '—',
      created_at: deal.created_at ? new Date(deal.created_at).toLocaleDateString('ru-RU') : '',
      lost_reason: deal.lost_reason || '',
    });
  });

  // Add funnel summary sheet
  const funnelSheet = workbook.addWorksheet('Воронка');
  
  funnelSheet.columns = [
    { header: 'Стадия', key: 'stage', width: 25 },
    { header: 'Кол-во сделок', key: 'count', width: 15 },
    { header: 'Сумма', key: 'amount', width: 20 },
  ];

  const funnelHeader = funnelSheet.getRow(1);
  funnelHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  funnelHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF6366F1' },
  };

  // Calculate funnel metrics
  const openDeals = deals.filter((d) => d.status === 'open');
  stages.forEach((stage) => {
    const stageDeals = openDeals.filter((d) => d.stage_id === stage.id);
    const stageAmount = stageDeals.reduce((sum, d) => sum + (d.value_amount || 0), 0);
    funnelSheet.addRow({
      stage: stage.name,
      count: stageDeals.length,
      amount: stageAmount.toLocaleString('ru-RU'),
    });
  });

  // Add totals
  const wonDeals = deals.filter((d) => d.status === 'won');
  const lostDeals = deals.filter((d) => d.status === 'lost');
  
  funnelSheet.addRow({});
  funnelSheet.addRow({
    stage: 'Выиграно',
    count: wonDeals.length,
    amount: wonDeals.reduce((sum, d) => sum + (d.value_amount || 0), 0).toLocaleString('ru-RU'),
  });
  funnelSheet.addRow({
    stage: 'Проиграно',
    count: lostDeals.length,
    amount: lostDeals.reduce((sum, d) => sum + (d.value_amount || 0), 0).toLocaleString('ru-RU'),
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, `${options.filename}.xlsx`);
}

// Export to CSV (simpler format)
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
): void {
  const headers = columns.map((c) => c.header).join(',');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const value = row[c.key];
        const stringValue = value == null ? '' : String(value);
        // Escape quotes and wrap in quotes if contains comma
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',')
  );

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Helper to download buffer as file
function downloadBuffer(buffer: any, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
