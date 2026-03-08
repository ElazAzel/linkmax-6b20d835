/**
 * Document Generator - Renders templates with variables and generates PDFs
 */
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ZoneContact, ZoneDeal, ZoneDocumentTemplate } from '@/types/zones';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// =============== Variable Definitions ===============

export interface DocumentVariables {
  // Contact variables
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_company?: string;
  contact_position?: string;
  contact_address?: string;
  
  // Deal variables
  deal_title?: string;
  deal_amount?: string;
  deal_currency?: string;
  deal_stage?: string;
  deal_source?: string;
  
  // Document variables
  document_number?: string;
  document_date?: string;
  current_date?: string;
  
  // Custom variables
  [key: string]: string | undefined;
}

export const AVAILABLE_VARIABLES = [
  { key: 'contact_name', label: 'Имя контакта', example: 'Иван Петров' },
  { key: 'contact_email', label: 'Email контакта', example: 'ivan@example.com' },
  { key: 'contact_phone', label: 'Телефон контакта', example: '+7 777 123-45-67' },
  { key: 'contact_company', label: 'Компания контакта', example: 'ООО Компания' },
  { key: 'contact_position', label: 'Должность', example: 'Директор' },
  { key: 'contact_address', label: 'Адрес', example: 'г. Алматы, ул. Абая 1' },
  { key: 'deal_title', label: 'Название сделки', example: 'Разработка сайта' },
  { key: 'deal_amount', label: 'Сумма сделки', example: '500 000' },
  { key: 'deal_currency', label: 'Валюта', example: 'KZT' },
  { key: 'deal_stage', label: 'Стадия сделки', example: 'В работе' },
  { key: 'deal_source', label: 'Источник сделки', example: 'Сайт' },
  { key: 'document_number', label: 'Номер документа', example: 'DOC-2026-001' },
  { key: 'document_date', label: 'Дата документа', example: '8 марта 2026' },
  { key: 'current_date', label: 'Текущая дата', example: '8 марта 2026' },
] as const;

// =============== Variable Extraction ===============

export function extractVariablesFromContact(contact: ZoneContact | null | undefined): Partial<DocumentVariables> {
  if (!contact) return {};
  
  return {
    contact_name: contact.name || '',
    contact_email: contact.email || '',
    contact_phone: contact.phone || '',
    contact_company: contact.company || '',
    contact_position: contact.position || '',
    contact_address: contact.address || '',
  };
}

export function extractVariablesFromDeal(deal: ZoneDeal | null | undefined): Partial<DocumentVariables> {
  if (!deal) return {};
  
  const amount = deal.value_amount 
    ? new Intl.NumberFormat('ru-RU').format(deal.value_amount) 
    : '';
  
  return {
    deal_title: deal.title || '',
    deal_amount: amount,
    deal_currency: deal.currency || 'KZT',
    deal_source: deal.source || '',
  };
}

export function buildDocumentVariables(
  contact?: ZoneContact | null,
  deal?: ZoneDeal | null,
  documentNumber?: string | null
): DocumentVariables {
  const now = new Date();
  const formattedDate = format(now, 'd MMMM yyyy', { locale: ru });
  
  return {
    ...extractVariablesFromContact(contact),
    ...extractVariablesFromDeal(deal),
    document_number: documentNumber || generateDocumentNumber(),
    document_date: formattedDate,
    current_date: formattedDate,
  };
}

// =============== Template Rendering ===============

/**
 * Replace template variables with actual values
 * Supports {{ variable }} and {{variable}} syntax
 */
export function renderTemplate(template: string, variables: DocumentVariables): string {
  let rendered = template;
  
  // Replace all {{variable}} patterns
  rendered = rendered.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? value : match;
  });
  
  return rendered;
}

/**
 * Find unreplaced variables in rendered content
 */
export function findUnreplacedVariables(content: string): string[] {
  const matches = content.match(/\{\{\s*(\w+)\s*\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/[{}\s]/g, '')))];
}

// =============== Document Number Generation ===============

export function generateDocumentNumber(prefix = 'DOC'): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

// =============== PDF Generation ===============

export interface PDFOptions {
  title?: string;
  filename?: string;
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margins?: { top: number; right: number; bottom: number; left: number };
}

/**
 * Generate PDF from HTML content
 */
export async function generatePDFFromHTML(
  htmlContent: string,
  options: PDFOptions = {}
): Promise<Blob> {
  const {
    title = 'Document',
    pageSize = 'a4',
    orientation = 'portrait',
    margins = { top: 20, right: 20, bottom: 20, left: 20 }
  } = options;
  
  // Create temporary container for rendering
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 210mm;
    padding: 15mm;
    background: white;
    color: black;
    font-family: 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.5;
  `;
  
  // Apply document styles
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    h1 { font-size: 18pt; font-weight: bold; margin-bottom: 12pt; }
    h2 { font-size: 14pt; font-weight: bold; margin-bottom: 10pt; }
    p { margin-bottom: 8pt; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
    th, td { border: 1px solid #333; padding: 6pt; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; }
    .signature-line { margin-top: 30pt; border-top: 1px solid #333; width: 200px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .underline { text-decoration: underline; }
  `;
  container.appendChild(styleElement);
  document.body.appendChild(container);
  
  try {
    // Render to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth - margins.left - margins.right;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = margins.top;
    
    // Add first page
    pdf.addImage(imgData, 'JPEG', margins.left, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - margins.top - margins.bottom);
    
    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margins.top;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margins.left, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - margins.top - margins.bottom);
    }
    
    // Set document properties
    pdf.setProperties({
      title,
      creator: 'LinkMAX Business Zone',
      subject: 'Generated Document'
    });
    
    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generate and download PDF
 */
export async function downloadPDF(
  htmlContent: string,
  filename: string,
  options?: PDFOptions
): Promise<void> {
  const blob = await generatePDFFromHTML(htmlContent, { ...options, title: filename });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =============== Preview Generation ===============

/**
 * Generate HTML preview with syntax highlighting for variables
 */
export function generatePreviewHTML(
  template: string,
  variables: DocumentVariables,
  highlightUnreplaced = true
): string {
  let preview = renderTemplate(template, variables);
  
  if (highlightUnreplaced) {
    // Highlight unreplaced variables
    preview = preview.replace(
      /\{\{\s*(\w+)\s*\}\}/g,
      '<span style="background-color: #fef3c7; color: #92400e; padding: 2px 4px; border-radius: 3px;">{{$1}}</span>'
    );
  }
  
  return preview;
}
