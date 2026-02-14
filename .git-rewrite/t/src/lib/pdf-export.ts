/**
 * PDF Export utility for event registrations with analytics charts
 * Uses jsPDF for generating PDF files with tables and charts
 * Supports Cyrillic (Russian, Kazakh) and Latin characters
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ru, kk, enUS } from 'date-fns/locale';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
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

interface EventAnalytics {
  total: number;
  confirmed: number;
  pending: number;
  rejected: number;
  checkedIn: number;
  dailyRegistrations: Array<{ date: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
  answerStats?: Array<{
    fieldId: string;
    fieldLabel: string;
    type: 'choice' | 'text' | 'number';
    options?: Array<{ label: string; count: number; percentage: number }>;
  }>;
}

interface PDFExportOptions {
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  registrations: Registration[];
  analytics: EventAnalytics;
  formFields?: EventFormField[];
  language: SupportedLanguage;
  includeAnalytics?: boolean;
  includeRegistrationsList?: boolean;
}

// Colors for charts
const CHART_COLORS = [
  [59, 130, 246],   // Blue
  [16, 185, 129],   // Green
  [245, 158, 11],   // Amber
  [239, 68, 68],    // Red
  [139, 92, 246],   // Purple
  [236, 72, 153],   // Pink
  [6, 182, 212],    // Cyan
  [249, 115, 22],   // Orange
];

/**
 * Transliterate Cyrillic text to Latin for PDF compatibility
 * jsPDF's built-in fonts don't support Cyrillic, so we transliterate
 */
function transliterate(text: string): string {
  const cyrillicToLatin: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    // Kazakh specific
    'ә': 'a', 'і': 'i', 'ң': 'n', 'ғ': 'g', 'ү': 'u', 'ұ': 'u', 'қ': 'q', 'ө': 'o', 'һ': 'h',
    'Ә': 'A', 'І': 'I', 'Ң': 'N', 'Ғ': 'G', 'Ү': 'U', 'Ұ': 'U', 'Қ': 'Q', 'Ө': 'O', 'Һ': 'H',
  };

  return text.split('').map(char => cyrillicToLatin[char] || char).join('');
}

/**
 * Safe text for PDF - transliterates if contains Cyrillic
 */
function safeText(text: string): string {
  // Check if text contains Cyrillic characters
  if (/[а-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ]/.test(text)) {
    return transliterate(text);
  }
  return text;
}

/**
 * Export event data to PDF with analytics charts
 */
export async function exportEventToPDF({
  eventTitle,
  eventDate,
  eventLocation,
  registrations,
  analytics,
  formFields = [],
  language,
  includeAnalytics = true,
  includeRegistrationsList = true,
}: PDFExportOptions): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Get locale for date formatting
  const dateLocale = language === 'ru' ? ru : language === 'kk' ? kk : enUS;

  // Use helvetica (built-in font that supports Latin characters)
  doc.setFont('helvetica');

  // Header
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text(safeText(eventTitle), margin, yPos);
  yPos += 10;

  // Event info
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  if (eventDate) {
    doc.text(`${safeText(getLabel('date', language))}: ${safeText(eventDate)}`, margin, yPos);
    yPos += 5;
  }
  if (eventLocation) {
    doc.text(`${safeText(getLabel('location', language))}: ${safeText(eventLocation)}`, margin, yPos);
    yPos += 5;
  }
  doc.text(`${safeText(getLabel('exportDate', language))}: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: dateLocale })}`, margin, yPos);
  yPos += 15;

  // Summary stats
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text(safeText(getLabel('summary', language)), margin, yPos);
  yPos += 10;

  // Stats cards
  const statsCardWidth = (pageWidth - margin * 2 - 15) / 4;
  drawStatCard(doc, margin, yPos, statsCardWidth, analytics.total, safeText(getLabel('total', language)), [59, 130, 246]);
  drawStatCard(doc, margin + statsCardWidth + 5, yPos, statsCardWidth, analytics.confirmed, safeText(getLabel('confirmed', language)), [16, 185, 129]);
  drawStatCard(doc, margin + (statsCardWidth + 5) * 2, yPos, statsCardWidth, analytics.pending, safeText(getLabel('pending', language)), [245, 158, 11]);
  drawStatCard(doc, margin + (statsCardWidth + 5) * 3, yPos, statsCardWidth, analytics.checkedIn, safeText(getLabel('checkedIn', language)), [139, 92, 246]);
  yPos += 30;

  if (includeAnalytics && analytics.statusBreakdown.length > 0) {
    // Status distribution section
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(safeText(getLabel('statusDistribution', language)), margin, yPos);
    yPos += 8;

    // Draw horizontal bar chart for status distribution
    const barHeight = 16;
    const maxBarWidth = pageWidth - margin * 2 - 80;
    const maxCount = Math.max(...analytics.statusBreakdown.map(s => s.count), 1);

    analytics.statusBreakdown.forEach((stat, i) => {
      const barWidth = Math.max((stat.count / maxCount) * maxBarWidth, 5);
      const color = CHART_COLORS[i % CHART_COLORS.length];
      
      // Status label
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const statusLabel = safeText(translateStatus(stat.status, language));
      doc.text(statusLabel, margin, yPos + barHeight / 2);
      
      // Bar
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(margin + 50, yPos, barWidth, barHeight - 4, 2, 2, 'F');
      
      // Count and percentage
      doc.setFontSize(8);
      doc.text(`${stat.count} (${stat.percentage.toFixed(1)}%)`, margin + 55 + barWidth, yPos + barHeight / 2 - 1);
      
      yPos += barHeight;
    });
    yPos += 10;
  }

  // Form field analytics (like Google Forms)
  if (includeAnalytics && analytics.answerStats && analytics.answerStats.length > 0) {
    for (const fieldStat of analytics.answerStats) {
      // Check if we need a new page
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text(safeText(fieldStat.fieldLabel), margin, yPos);
      yPos += 8;

      if (fieldStat.type === 'choice' && fieldStat.options) {
        // Bar chart for choice fields
        const barHeight = 14;
        const maxBarWidth = pageWidth - margin * 2 - 80;
        const maxCount = Math.max(...fieldStat.options.map(o => o.count), 1);

        fieldStat.options.forEach((option, i) => {
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = margin;
          }

          const barWidth = Math.max((option.count / maxCount) * maxBarWidth, 3);
          const color = CHART_COLORS[i % CHART_COLORS.length];

          // Option label (truncate if too long)
          doc.setFontSize(8);
          doc.setTextColor(60, 60, 60);
          const labelText = option.label.length > 25 ? option.label.slice(0, 22) + '...' : option.label;
          doc.text(safeText(labelText), margin, yPos + barHeight / 2 - 1);

          // Bar
          doc.setFillColor(color[0], color[1], color[2]);
          doc.roundedRect(margin + 55, yPos, barWidth, barHeight - 4, 2, 2, 'F');

          // Count
          doc.text(`${option.count} (${option.percentage.toFixed(0)}%)`, margin + 60 + barWidth, yPos + barHeight / 2 - 1);

          yPos += barHeight;
        });
        yPos += 8;
      }
    }
  }

  // Registrations list
  if (includeRegistrationsList && registrations.length > 0) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(safeText(getLabel('registrationsList', language)), margin, yPos);
    yPos += 8;

    // Build table headers
    const headers = [
      safeText(getLabel('name', language)),
      'Email',
      safeText(getLabel('phone', language)),
      safeText(getLabel('status', language)),
      safeText(getLabel('ticket', language)),
      safeText(getLabel('date', language)),
    ];

    // Build table rows
    const rows = registrations.map(reg => {
      const ticket = reg.event_tickets?.[0];
      return [
        safeText(reg.attendee_name),
        reg.attendee_email,
        reg.attendee_phone || '-',
        safeText(translateStatus(reg.status, language)),
        ticket?.ticket_code || '-',
        format(new Date(reg.created_at), 'dd.MM.yyyy HH:mm', { locale: dateLocale }),
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: rows,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: margin, right: margin },
    });
  }

  // Save the PDF
  const safeTitle = transliterate(eventTitle).replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 30) || 'event';
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  doc.save(`${safeTitle}_report_${dateStr}.pdf`);
}

/**
 * Draw a stat card
 */
function drawStatCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  value: number,
  label: string,
  color: number[]
): void {
  // Background
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, width, 20, 3, 3, 'F');

  // Value
  doc.setFontSize(14);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(value.toString(), x + width / 2, y + 10, { align: 'center' });

  // Label
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(label, x + width / 2, y + 17, { align: 'center' });
}

/**
 * Calculate analytics from registrations
 */
export function calculateEventAnalytics(
  registrations: Registration[],
  formFields: EventFormField[] = [],
  language: SupportedLanguage
): EventAnalytics {
  const total = registrations.length;
  const confirmed = registrations.filter(r => r.status === 'confirmed').length;
  const pending = registrations.filter(r => r.status === 'pending').length;
  const rejected = registrations.filter(r => r.status === 'rejected' || r.status === 'cancelled').length;
  const checkedIn = registrations.filter(r => r.event_tickets?.[0]?.status === 'used').length;

  // Status breakdown
  const statusCounts = new Map<string, number>();
  registrations.forEach(r => {
    statusCounts.set(r.status, (statusCounts.get(r.status) || 0) + 1);
  });
  const statusBreakdown = Array.from(statusCounts.entries()).map(([status, count]) => ({
    status,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));

  // Daily registrations
  const dailyCounts = new Map<string, number>();
  registrations.forEach(r => {
    const date = format(new Date(r.created_at), 'dd.MM');
    dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
  });
  const dailyRegistrations = Array.from(dailyCounts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Form field answer statistics (like Google Forms)
  const answerStats: EventAnalytics['answerStats'] = [];
  
  const choiceFields = formFields.filter(f => 
    ['radio', 'checkbox', 'select', 'dropdown', 'single_choice', 'multiple_choice'].includes(f.type) && f.options?.length
  );

  choiceFields.forEach(field => {
    const fieldLabel = getI18nText(field.label_i18n, language) || field.id;
    const optionCounts = new Map<string, number>();
    
    // Initialize all options with 0
    field.options?.forEach(opt => {
      optionCounts.set(opt.id, 0);
    });

    // Count answers
    registrations.forEach(reg => {
      const answer = reg.answers_json?.[field.id];
      if (Array.isArray(answer)) {
        answer.forEach(a => optionCounts.set(a as string, (optionCounts.get(a as string) || 0) + 1));
      } else if (answer) {
        optionCounts.set(answer as string, (optionCounts.get(answer as string) || 0) + 1);
      }
    });

    const totalAnswers = registrations.filter(r => r.answers_json?.[field.id]).length;
    const options = field.options?.map(opt => {
      const count = optionCounts.get(opt.id) || 0;
      return {
        label: getI18nText(opt.label_i18n, language) || opt.id,
        count,
        percentage: totalAnswers > 0 ? (count / totalAnswers) * 100 : 0,
      };
    }).sort((a, b) => b.count - a.count);

    answerStats.push({
      fieldId: field.id,
      fieldLabel,
      type: 'choice',
      options,
    });
  });

  return {
    total,
    confirmed,
    pending,
    rejected,
    checkedIn,
    dailyRegistrations,
    statusBreakdown,
    answerStats,
  };
}

function translateStatus(status: string, lang: SupportedLanguage): string {
  const translations: Record<string, Record<SupportedLanguage, string>> = {
    pending: { ru: 'Ожидает', en: 'Pending', kk: 'Күтуде' },
    confirmed: { ru: 'Подтверждён', en: 'Confirmed', kk: 'Расталды' },
    rejected: { ru: 'Отклонён', en: 'Rejected', kk: 'Қабылданбады' },
    cancelled: { ru: 'Отменён', en: 'Cancelled', kk: 'Болдырылмады' },
  };
  return translations[status]?.[lang] || status;
}

function getLabel(key: string, lang: SupportedLanguage): string {
  const labels: Record<string, Record<SupportedLanguage, string>> = {
    exportDate: { ru: 'Дата экспорта', en: 'Export date', kk: 'Экспорт күні' },
    summary: { ru: 'Сводка', en: 'Summary', kk: 'Жиынтық' },
    total: { ru: 'Всего', en: 'Total', kk: 'Барлығы' },
    confirmed: { ru: 'Подтв.', en: 'Confirmed', kk: 'Расталды' },
    pending: { ru: 'Ожидает', en: 'Pending', kk: 'Күтуде' },
    checkedIn: { ru: 'Check-in', en: 'Check-in', kk: 'Check-in' },
    statusDistribution: { ru: 'Распределение по статусам', en: 'Status Distribution', kk: 'Мәртебе бойынша бөлу' },
    registrationsList: { ru: 'Список регистраций', en: 'Registrations List', kk: 'Тіркеулер тізімі' },
    name: { ru: 'Имя', en: 'Name', kk: 'Аты' },
    phone: { ru: 'Телефон', en: 'Phone', kk: 'Телефон' },
    status: { ru: 'Статус', en: 'Status', kk: 'Мәртебе' },
    ticket: { ru: 'Билет', en: 'Ticket', kk: 'Билет' },
    date: { ru: 'Дата', en: 'Date', kk: 'Күні' },
    location: { ru: 'Место', en: 'Location', kk: 'Орны' },
    report: { ru: 'отчет', en: 'report', kk: 'есеп' },
  };
  return labels[key]?.[lang] || key;
}
