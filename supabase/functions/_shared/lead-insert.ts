/**
 * Builds a `leads` row for a public form submission using the columns the
 * live table actually has (user_id, name, email, phone, source, status,
 * metadata). Page, block and raw form data live in `metadata`, the same
 * place the dashboard reads them from (`getLeadPageId`).
 *
 * Pure module: no Deno or network imports, so it is unit-tested with vitest.
 */

const NAME_KEYS = /^(name|full[\s_-]?name|имя|фио|аты|ваше имя|your name)$/i;
const EMAIL_KEYS = /^(e-?mail|почта|электронная почта|email address)$/i;
const PHONE_KEYS = /^(phone|tel|telephone|mobile|телефон|номер|номер телефона|whatsapp)$/i;

export const DEFAULT_LEAD_NAME = 'Заявка с формы';

export function findFormField(formData: Record<string, string>, pattern: RegExp): string | null {
  for (const [key, value] of Object.entries(formData)) {
    if (pattern.test(key.trim()) && value.trim()) return value.trim();
  }
  return null;
}

export interface LeadInsertInput {
  ownerId: string;
  pageId: string;
  blockId: string;
  formData: Record<string, string>;
  metadata: Record<string, string>;
}

export interface LeadInsertRow {
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: 'form';
  status: 'new';
  metadata: Record<string, string | Record<string, string>>;
}

export function buildLeadInsert({ ownerId, pageId, blockId, formData, metadata }: LeadInsertInput): LeadInsertRow {
  return {
    user_id: ownerId,
    name: (findFormField(formData, NAME_KEYS) ?? DEFAULT_LEAD_NAME).slice(0, 200),
    email: findFormField(formData, EMAIL_KEYS),
    phone: findFormField(formData, PHONE_KEYS),
    source: 'form',
    status: 'new',
    metadata: {
      ...metadata,
      page_id: pageId,
      block_id: blockId,
      form_data: formData,
    },
  };
}

export { EMAIL_KEYS as LEAD_EMAIL_KEYS };
