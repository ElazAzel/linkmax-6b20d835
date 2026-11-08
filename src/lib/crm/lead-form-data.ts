/**
 * Readable view of a lead's metadata for the CRM (lead details + list preview).
 *
 * `submit-lead` stores the visitor's answers in `metadata.form_data`, keyed by
 * the form's field labels («Имя», «Сообщение», …), next to internal ids
 * (`page_id`, `block_id`). It also stringifies every top-level value, so a
 * missing UTM tag arrives as the string "null". Older leads keep answers at the
 * top level. Nothing here may ever render "[object Object]".
 */

export type LeadFieldKind = 'name' | 'phone' | 'email' | 'message' | 'other';
/** Technical (English) keys that get a translated label instead of the raw key. */
type LeadFieldLabelId = 'name' | 'phone' | 'email' | 'message' | 'comment';

export interface LeadField {
  /** Path in metadata, e.g. "form_data.Сообщение" — stable React key. */
  key: string;
  label: string;
  value: string;
  kind: LeadFieldKind;
}

interface LeadFieldOptions {
  labels?: Partial<Record<LeadFieldLabelId, string>>;
  yes?: string;
  no?: string;
}

interface LeadAttribution {
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
}

/** Shown elsewhere in the lead card (chat insight, attribution) or internal. */
const HIDDEN_KEYS = new Set([
  'page_id', 'block_id', 'form_data', 'notify_nonce',
  'chat_lead', 'intent', 'last_query', 'conversation',
  'referrer', 'ai_source', 'is_ai_traffic',
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY_VALUES = new Set(['', 'null', 'undefined']);

// Same field names submit-lead uses to fill name/email/phone (supabase/functions/_shared/lead-insert.ts).
const NAME_KEY_RE = /^(name|full[\s_-]?name|имя|фио|аты|ваше имя|your name)$/i;
const EMAIL_KEY_RE = /^(e-?mail|почта|электронная почта|email address)$/i;
const PHONE_KEY_RE = /^(phone|tel|telephone|mobile|телефон|номер|номер телефона|whatsapp)$/i;
const MESSAGE_KEY_RE = /^(message|msg|comment|comments|question|text|wish|сообщение|ваше сообщение|комментарий|вопрос|ваш вопрос|пожелания|пожелание|текст|хабарлама|пікір|сұрақ|xabar|izoh|savol)$/i;

const LABEL_IDS: Record<string, LeadFieldLabelId> = {
  name: 'name', full_name: 'name', fullname: 'name',
  phone: 'phone', tel: 'phone', telephone: 'phone', mobile: 'phone',
  email: 'email', 'e-mail': 'email',
  message: 'message', msg: 'message',
  comment: 'comment', comments: 'comment',
};

type Metadata = Record<string, unknown>;

function asRecord(value: unknown): Metadata | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Metadata) : null;
}

function primitiveText(value: unknown, options: LeadFieldOptions): string | null {
  if (typeof value === 'string') {
    const text = value.trim();
    return EMPTY_VALUES.has(text.toLowerCase()) ? null : text;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;
  if (typeof value === 'boolean') return value ? options.yes ?? 'yes' : options.no ?? 'no';
  return null;
}

/** Primitive → text, array → "a, b", object → its primitive values joined. */
function valueText(value: unknown, options: LeadFieldOptions): string | null {
  const primitive = primitiveText(value, options);
  if (primitive !== null) return primitive;
  const items = Array.isArray(value) ? value : Object.values(asRecord(value) ?? {});
  const parts = items
    .map((item) => primitiveText(item, options) ?? (item && typeof item === 'object' ? valueText(item, options) : null))
    .filter((part): part is string => !!part);
  return parts.length > 0 ? parts.join(', ') : null;
}

function isHiddenKey(key: string, value: unknown): boolean {
  if (HIDDEN_KEYS.has(key) || key.startsWith('utm_') || key.startsWith('_')) return true;
  if (/(^id$|_id$|[a-z]Id$)/.test(key)) return true;
  return typeof value === 'string' && UUID_RE.test(value.trim());
}

function fieldKind(key: string): LeadFieldKind {
  const name = key.trim();
  if (NAME_KEY_RE.test(name)) return 'name';
  if (PHONE_KEY_RE.test(name)) return 'phone';
  if (EMAIL_KEY_RE.test(name)) return 'email';
  if (MESSAGE_KEY_RE.test(name)) return 'message';
  return 'other';
}

/** "preferred_time" → "Preferred time"; "Ваше имя" stays as typed. */
export function humanizeLeadKey(key: string): string {
  const text = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-zа-яё])([A-ZА-ЯЁ])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : key;
}

function fieldLabel(key: string, options: LeadFieldOptions): string {
  const labelId = LABEL_IDS[key.trim().toLowerCase()];
  return (labelId && options.labels?.[labelId]) || humanizeLeadKey(key);
}

function collect(source: Metadata, prefix: string, options: LeadFieldOptions, out: LeadField[]) {
  for (const [key, value] of Object.entries(source)) {
    if (isHiddenKey(key, value)) continue;
    const nested = asRecord(value);
    if (nested) {
      // One level of nesting: "Адрес · Город".
      for (const [childKey, childValue] of Object.entries(nested)) {
        if (isHiddenKey(childKey, childValue)) continue;
        const text = valueText(childValue, options);
        if (text === null) continue;
        out.push({
          key: `${prefix}${key}.${childKey}`,
          label: `${fieldLabel(key, options)} · ${fieldLabel(childKey, options)}`,
          value: text,
          kind: fieldKind(childKey),
        });
      }
      continue;
    }
    const text = valueText(value, options);
    if (text === null) continue;
    out.push({ key: `${prefix}${key}`, label: fieldLabel(key, options), value: text, kind: fieldKind(key) });
  }
}

/**
 * The visitor's answers (form_data first, in form order), then any other
 * non-internal metadata (older leads). UTM tags and ids are left out.
 */
export function getLeadFields(metadata: unknown, options: LeadFieldOptions = {}): LeadField[] {
  const record = asRecord(metadata);
  if (!record) return [];
  const fields: LeadField[] = [];
  const formData = asRecord(record.form_data);
  if (formData) collect(formData, 'form_data.', options, fields);
  const topLevel: LeadField[] = [];
  collect(record, '', options, topLevel);
  const seen = new Set(fields.map((field) => `${field.label}\u0000${field.value}`));
  for (const field of topLevel) {
    if (!seen.has(`${field.label}\u0000${field.value}`)) fields.push(field);
  }
  return fields;
}

const PREVIEW_MAX = 140;

/** One line for the leads list: the message, else the first non-contact answer. */
export function getLeadPreview(metadata: unknown): string | null {
  const fields = getLeadFields(metadata);
  const field = fields.find((item) => item.kind === 'message') ?? fields.find((item) => item.kind === 'other');
  const lastQuery = asRecord(metadata)?.last_query;
  const text = field?.value ?? (typeof lastQuery === 'string' ? primitiveText(lastQuery, {}) : null);
  const line = text?.split(/\r?\n/).map((part) => part.trim()).find(Boolean);
  if (!line) return null;
  return line.length > PREVIEW_MAX ? `${line.slice(0, PREVIEW_MAX - 1).trimEnd()}…` : line;
}

/** UTM tags and referrer without the "null" placeholders; "direct" is not a referrer. */
export function getLeadAttribution(metadata: unknown): LeadAttribution {
  const record = asRecord(metadata) ?? {};
  const text = (key: string) => primitiveText(record[key], {}) ?? undefined;
  const referrer = text('referrer');
  return {
    source: text('utm_source'),
    medium: text('utm_medium'),
    campaign: text('utm_campaign'),
    referrer: referrer && referrer.toLowerCase() !== 'direct' ? referrer : undefined,
  };
}
