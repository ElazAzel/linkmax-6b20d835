/**
 * Excel/CSV Export utility for Wallet Transactions (Finance).
 * Sprint 3 — CRM Depth.
 * ExcelJS is dynamically imported to avoid loading 200KB+ on initial page load.
 */
import { format } from 'date-fns';
import type { WalletTransaction } from '@/services/fintech';

interface ExportOptions {
  transactions: WalletTransaction[];
  currency?: string;
}

const TYPE_LABELS: Record<string, string> = {
  payment: 'Продажа / Payment',
  deposit: 'Пополнение / Deposit',
  withdrawal: 'Вывод / Withdrawal',
  fee: 'Комиссия / Fee',
  refund: 'Возврат / Refund',
  adjustment: 'Корректировка / Adjustment',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Завершена / Completed',
  pending: 'В ожидании / Pending',
  failed: 'Ошибка / Failed',
  cancelled: 'Отменена / Cancelled',
};

export async function exportWalletTransactionsToExcel({
  transactions,
  currency = 'KZT',
}: ExportOptions): Promise<void> {
  if (!transactions || transactions.length === 0) {
    throw new Error('No transactions to export');
  }

  const headers = [
    'ID',
    'Дата / Date',
    'Тип / Type',
    'Статус / Status',
    `Сумма брутто (${currency})`,
    `Комиссия (${currency})`,
    `Сумма нетто (${currency})`,
    'Валюта / Currency',
    'Описание / Description',
    'Связанный объект / Related entity',
  ];

  const rows = transactions.map((tx) => [
    tx.id,
    format(new Date(tx.created_at), 'dd.MM.yyyy HH:mm'),
    TYPE_LABELS[tx.type] || tx.type,
    STATUS_LABELS[tx.status] || tx.status,
    Number(tx.gross_amount ?? 0),
    Number(tx.fee_amount ?? 0),
    Number(tx.net_amount ?? 0),
    tx.currency || currency,
    tx.description || '',
    tx.related_entity_type
      ? `${tx.related_entity_type}:${tx.related_entity_id ?? ''}`
      : '',
  ]);

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Transactions');

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8E8E8' },
  };

  rows.forEach((row) => sheet.addRow(row));

  headers.forEach((header, i) => {
    const maxLength = Math.max(
      header.length,
      ...rows.map((r) => String(r[i] ?? '').length),
    );
    sheet.getColumn(i + 1).width = Math.min(maxLength + 2, 50);
  });

  // Summary
  const summary = workbook.addWorksheet('Summary');
  const income = transactions
    .filter((t) => t.type === 'payment' || t.type === 'deposit')
    .reduce((acc, t) => acc + Number(t.net_amount ?? 0), 0);
  const outflow = transactions
    .filter((t) => t.type === 'withdrawal' || t.type === 'refund' || t.type === 'fee')
    .reduce((acc, t) => acc + Number(t.gross_amount ?? 0), 0);
  const fees = transactions.reduce((acc, t) => acc + Number(t.fee_amount ?? 0), 0);

  const summaryData: Array<[string, string | number]> = [
    ['Всего операций / Total', transactions.length],
    [`Доход / Income (${currency})`, income],
    [`Расход / Outflow (${currency})`, outflow],
    [`Комиссии / Fees (${currency})`, fees],
    ['Дата экспорта / Export date', format(new Date(), 'dd.MM.yyyy HH:mm')],
  ];
  summaryData.forEach((row, idx) => {
    const r = summary.addRow(row);
    if (idx === 0) r.font = { bold: true };
  });
  summary.getColumn(1).width = 32;
  summary.getColumn(2).width = 22;

  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const filename = `wallet_transactions_${dateStr}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
