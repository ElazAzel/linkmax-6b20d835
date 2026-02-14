/**
 * Excel Export utility for event registrations
 * Uses SheetJS (xlsx) for generating XLSX files
 */
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import type { EventFormField } from '@/types/page';

interface Registration {
  id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  answers_json: Record<string, unknown> | null;
  status: string;
  payment_status: string;
  created_at: string;
  event_tickets?: Array<{
    ticket_code: string;
    status: string;
    checked_in_at: string | null;
  }> | null;
}

interface ExportOptions {
  eventTitle: string;
  registrations: Registration[];
  formFields?: EventFormField[];
  language: SupportedLanguage;
  includeAnswers?: boolean;
}

/**
 * Export registrations to XLSX file
 */
export function exportToExcel({
  eventTitle,
  registrations,
  formFields = [],
  language,
  includeAnswers = true,
}: ExportOptions): void {
  if (registrations.length === 0) {
    throw new Error('No registrations to export');
  }

  // Build headers
  const baseHeaders = [
    'Имя / Name',
    'Email',
    'Телефон / Phone',
    'Статус / Status',
    'Оплата / Payment',
    'Билет / Ticket',
    'Check-in',
    'Дата регистрации / Registered',
  ];

  // Add form field headers if includeAnswers
  const fieldHeaders: string[] = [];
  const fieldMap: Map<string, EventFormField> = new Map();

  if (includeAnswers && formFields.length > 0) {
    for (const field of formFields) {
      // Skip layout fields
      if (['section_header', 'description', 'media'].includes(field.type)) continue;
      const label = getTranslatedString(field.label_i18n, language) || field.id;
      fieldHeaders.push(label);
      fieldMap.set(field.id, field);
    }
  }

  const headers = [...baseHeaders, ...fieldHeaders];

  // Build rows
  const rows = registrations.map((reg) => {
    const ticket = reg.event_tickets?.[0];
    const answers = reg.answers_json || {};

    const baseRow = [
      reg.attendee_name,
      reg.attendee_email,
      reg.attendee_phone || '',
      translateStatus(reg.status),
      translatePaymentStatus(reg.payment_status),
      ticket?.ticket_code || '',
      ticket?.checked_in_at ? format(new Date(ticket.checked_in_at), 'dd.MM.yyyy HH:mm') : '',
      format(new Date(reg.created_at), 'dd.MM.yyyy HH:mm'),
    ];

    // Add form field answers
    const fieldRow: string[] = [];
    if (includeAnswers) {
      for (const [fieldId, field] of fieldMap) {
        const answer = answers[fieldId];
        fieldRow.push(formatAnswer(answer, field, language));
      }
    }

    return [...baseRow, ...fieldRow];
  });

  // Create workbook
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Auto-size columns
  const colWidths = headers.map((header, i) => {
    const maxLength = Math.max(
      header.length,
      ...rows.map(row => String(row[i] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  ws['!cols'] = colWidths;

  // Style header row (basic styling)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })];
    if (cell) {
      cell.s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E8E8E8' } },
      };
    }
  }

  // Create workbook and add sheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registrations');

  // Add summary sheet
  const summaryData = [
    ['Событие / Event', eventTitle],
    ['Всего регистраций / Total', registrations.length],
    ['Подтверждено / Confirmed', registrations.filter(r => r.status === 'confirmed').length],
    ['Ожидает / Pending', registrations.filter(r => r.status === 'pending').length],
    ['Отклонено / Rejected', registrations.filter(r => r.status === 'rejected').length],
    ['Check-in', registrations.filter(r => r.event_tickets?.[0]?.status === 'used').length],
    ['Дата экспорта / Export date', format(new Date(), 'dd.MM.yyyy HH:mm')],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Generate filename
  const safeTitle = eventTitle.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_').slice(0, 30);
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const filename = `${safeTitle}_registrations_${dateStr}.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
}

/**
 * Export registrations to CSV (fallback for free users)
 */
export function exportToCSV({
  eventTitle,
  registrations,
  formFields = [],
  language,
  includeAnswers = true,
}: ExportOptions): void {
  if (registrations.length === 0) {
    throw new Error('No registrations to export');
  }

  const baseHeaders = ['Name', 'Email', 'Phone', 'Status', 'Payment', 'Ticket', 'Check-in', 'Registered'];

  const fieldHeaders: string[] = [];
  const fieldMap: Map<string, EventFormField> = new Map();

  if (includeAnswers && formFields.length > 0) {
    for (const field of formFields) {
      if (['section_header', 'description', 'media'].includes(field.type)) continue;
      fieldHeaders.push(getTranslatedString(field.label_i18n, language) || field.id);
      fieldMap.set(field.id, field);
    }
  }

  const headers = [...baseHeaders, ...fieldHeaders];

  const rows = registrations.map((reg) => {
    const ticket = reg.event_tickets?.[0];
    const answers = reg.answers_json || {};

    const baseRow = [
      reg.attendee_name,
      reg.attendee_email,
      reg.attendee_phone || '',
      reg.status,
      reg.payment_status,
      ticket?.ticket_code || '',
      ticket?.checked_in_at ? format(new Date(ticket.checked_in_at), 'yyyy-MM-dd HH:mm') : '',
      format(new Date(reg.created_at), 'yyyy-MM-dd HH:mm'),
    ];

    const fieldRow: string[] = [];
    if (includeAnswers) {
      for (const [fieldId, field] of fieldMap) {
        fieldRow.push(formatAnswer(answers[fieldId], field, language));
      }
    }

    return [...baseRow, ...fieldRow];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);

  const safeTitle = eventTitle.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_').slice(0, 30);
  link.download = `${safeTitle}_registrations_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function translateStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'Ожидает / Pending',
    confirmed: 'Подтверждено / Confirmed',
    rejected: 'Отклонено / Rejected',
    cancelled: 'Отменено / Cancelled',
  };
  return map[status] || status;
}

function translatePaymentStatus(status: string): string {
  const map: Record<string, string> = {
    none: 'Не требуется / N/A',
    pending: 'Ожидает / Pending',
    paid: 'Оплачено / Paid',
    failed: 'Ошибка / Failed',
    refunded: 'Возврат / Refunded',
  };
  return map[status] || status;
}

function formatAnswer(answer: unknown, field: EventFormField, language: SupportedLanguage): string {
  if (answer === undefined || answer === null) return '';

  // Boolean (checkbox)
  if (typeof answer === 'boolean') {
    return answer ? 'Да / Yes' : 'Нет / No';
  }

  // Array (multiple choice)
  if (Array.isArray(answer)) {
    return answer.map(id => {
      const option = field.options?.find(o => o.id === id);
      return option ? getTranslatedString(option.label_i18n, language) : id;
    }).join('; ');
  }

  // Single choice / dropdown - resolve option label
  if (typeof answer === 'string' && field.options?.length) {
    const option = field.options.find(o => o.id === answer);
    if (option) {
      return getTranslatedString(option.label_i18n, language);
    }
  }

  return String(answer);
}
