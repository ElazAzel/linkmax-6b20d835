/**
 * PDF Export utility for Zone Invoices
 * Based on pdf-export.ts pattern with jsPDF + autoTable
 * Supports Cyrillic via transliteration (same approach as pdf-export.ts)
 */
import { format } from 'date-fns';
import type { ZoneInvoice, ZoneInvoiceItem } from '@/types/zones';

export interface InvoicePDFOptions {
    invoice: ZoneInvoice;
    items: ZoneInvoiceItem[];
    zoneName: string;
    zoneLogo?: string | null;
}

// Transliterate Cyrillic to Latin for jsPDF (no built-in Cyrillic font support)
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
    // Kazakh extras
    'Ә': 'A', 'ә': 'a', 'Ғ': 'G', 'ғ': 'g', 'Қ': 'Q', 'қ': 'q',
    'Ң': 'N', 'ң': 'n', 'Ө': 'O', 'ө': 'o', 'Ұ': 'U', 'ұ': 'u',
    'Ү': 'U', 'ү': 'u', 'Һ': 'H', 'һ': 'h', 'І': 'I', 'і': 'i',
    '₸': 'T', '₽': 'R',
};

function transliterate(text: string): string {
    return text
        .split('')
        .map(char => CYR_MAP[char] ?? char)
        .join('');
}

function safe(text: string | null | undefined): string {
    if (!text) return '';
    const hasCyrillic = /[\u0400-\u04FF\u0500-\u052F]/.test(text);
    return hasCyrillic ? transliterate(text) : text;
}

export async function exportInvoiceToPDF({
    invoice,
    items,
    zoneName,
}: InvoicePDFOptions): Promise<void> {
    // Dynamic imports to avoid loading 150KB+ on initial page load
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // ─── Header ───
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(safe(`Schyot / Invoice #${invoice.invoice_number || ''}`), 14, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(safe(zoneName), 14, y);

    // Date on the right
    const dateStr = invoice.created_at
        ? format(new Date(invoice.created_at), 'dd.MM.yyyy')
        : format(new Date(), 'dd.MM.yyyy');
    doc.text(dateStr, pageWidth - 14, y, { align: 'right' });
    y += 10;

    // ─── Status badge ───
    const statusMap: Record<string, { label: string; color: [number, number, number] }> = {
        created: { label: 'Sozdan', color: [59, 130, 246] },
        paid: { label: 'Oplachen', color: [16, 185, 129] },
        failed: { label: 'Oshibka', color: [239, 68, 68] },
        expired: { label: 'Istëk', color: [156, 163, 175] },
    };
    const status = statusMap[invoice.status] || statusMap.created;
    doc.setFontSize(9);
    doc.setTextColor(...status.color);
    doc.text(`Status: ${status.label}`, 14, y);
    y += 8;

    // ─── Separator ───
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    // ─── Contact info ───
    if (invoice.contact) {
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text(safe(`Kontakt: ${invoice.contact.name || ''}`), 14, y);
        y += 5;
        if (invoice.contact.email) {
            doc.text(`Email: ${invoice.contact.email}`, 14, y);
            y += 5;
        }
        if (invoice.contact.phone) {
            doc.text(safe(`Tel: ${invoice.contact.phone}`), 14, y);
            y += 5;
        }
        y += 5;
    }

    // ─── Items table ───
    const tableHeaders = ['#', safe('Naimenovanie'), safe('Kol-vo'), safe('Tsena'), safe('Summa')];
    const tableRows = items.map((item, i) => [
        String(i + 1),
        safe(item.name || ''),
        String(item.quantity ?? 1),
        `${(item.unit_price ?? 0).toLocaleString()} ${safe(invoice.currency || 'KZT')}`,
        `${((item.quantity ?? 1) * (item.unit_price ?? 0)).toLocaleString()} ${safe(invoice.currency || 'KZT')}`,
    ]);

    autoTable(doc, {
        head: [tableHeaders],
        body: tableRows,
        startY: y,
        theme: 'grid',
        headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
        },
        bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
    });

    // Get final Y after table
    y = (doc as any).lastAutoTable.finalY + 10;

    // ─── Total ───
    const total = items.reduce((sum, item) => sum + (item.quantity ?? 1) * (item.unit_price ?? 0), 0);
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(
        safe(`Itogo: ${total.toLocaleString()} ${invoice.currency || 'KZT'}`),
        pageWidth - 14,
        y,
        { align: 'right' },
    );
    y += 8;

    // Note: ZoneInvoice does not have due_date field; skip rendering
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
    const number = invoice.invoice_number || invoice.id.slice(0, 8);
    doc.save(`invoice_${number}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
