/**
 * CRM Lite (Micro-Business OS Step 4)
 *
 * Simple 5-stage pipeline mapped onto the existing `leads.status` enum
 * ('new' | 'contacted' | 'qualified' | 'converted' | 'lost') with default
 * human-friendly Russian labels:
 *   Новые → Связались → Записан → Оплатил → Завершено
 *
 * Page owners can rename stages per user/page without requiring a new DB table.
 * Tasks are stored as `lead_interactions` (`type = 'note'`) using a lightweight
 * structured prefix (`[TASK:open]` / `[TASK:done]`) so they work seamlessly
 * with existing RLS and `lead_interactions` schema.
 */
import type { LeadStatus, LeadInteraction } from '@/hooks/crm/useLeads';

export const CRM_LITE_STAGE_ORDER: readonly LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
] as const;

export type CrmStageLabels = Record<LeadStatus, string>;

const DEFAULT_CRM_STAGE_LABELS: Record<'ru' | 'en' | 'kk' | 'uz', CrmStageLabels> = {
  ru: {
    new: 'Новые',
    contacted: 'Связались',
    qualified: 'Записан',
    converted: 'Оплатил',
    lost: 'Завершено',
  },
  en: {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Booked',
    converted: 'Paid',
    lost: 'Completed',
  },
  kk: {
    new: 'Жаңа',
    contacted: 'Хабарластық',
    qualified: 'Жазылды',
    converted: 'Төледі',
    lost: 'Аяқталды',
  },
  uz: {
    new: 'Yangi',
    contacted: 'Bogʻlanildi',
    qualified: 'Yozildi',
    converted: 'Toʻladi',
    lost: 'Yakunlandi',
  },
};

const STAGE_STORAGE_KEY = 'lm_crm_lite_stages_v1';
const STAGE_CHANGE_EVENT = 'lm-crm-lite-stages-change';

function normalizeLocale(lang?: string): 'ru' | 'en' | 'kk' | 'uz' {
  const code = (lang || 'ru').toLowerCase().split('-')[0];
  if (code === 'en' || code === 'kk' || code === 'uz') return code;
  return 'ru';
}

export function getDefaultStageLabel(status: LeadStatus, lang?: string): string {
  const locale = normalizeLocale(lang);
  return DEFAULT_CRM_STAGE_LABELS[locale][status] || DEFAULT_CRM_STAGE_LABELS.ru[status];
}

export function getCustomStageLabels(): Partial<CrmStageLabels> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STAGE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Partial<CrmStageLabels> = {};
    for (const status of CRM_LITE_STAGE_ORDER) {
      const val = parsed[status];
      if (typeof val === 'string' && val.trim().length > 0) {
        out[status] = val.trim().slice(0, 40);
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function setCustomStageLabels(labels: Partial<CrmStageLabels>): void {
  if (typeof window === 'undefined') return;
  try {
    const clean: Partial<CrmStageLabels> = {};
    for (const status of CRM_LITE_STAGE_ORDER) {
      const val = labels[status];
      if (typeof val === 'string' && val.trim().length > 0) {
        clean[status] = val.trim().slice(0, 40);
      }
    }
    window.localStorage.setItem(STAGE_STORAGE_KEY, JSON.stringify(clean));
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new Event(STAGE_CHANGE_EVENT));
}

export function resetCustomStageLabels(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STAGE_STORAGE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(STAGE_CHANGE_EVENT));
}

export function resolveStageLabel(
  status: LeadStatus,
  customLabels: Partial<CrmStageLabels>,
  lang?: string,
): string {
  const custom = customLabels[status];
  if (custom && custom.trim()) return custom.trim();
  return getDefaultStageLabel(status, lang);
}

export function subscribeStageLabels(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const onStorage = (e: StorageEvent) => {
    if (e.key === STAGE_STORAGE_KEY) listener();
  };
  window.addEventListener(STAGE_CHANGE_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(STAGE_CHANGE_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}

/**
 * Task encoding inside `lead_interactions.content`
 */
const TASK_PREFIX_RE = /^\[TASK:(open|done)(?:\|due=([^\]]+))?\]\s*(.*)$/s;

interface ParsedLeadTask {
  id: string;
  done: boolean;
  dueDate?: string;
  text: string;
  createdAt: string;
}

export function encodeTaskInteraction(text: string, done = false, dueDate?: string): string {
  const cleanText = text.trim();
  const duePart = dueDate && dueDate.trim() ? `|due=${dueDate.trim()}` : '';
  return `[TASK:${done ? 'done' : 'open'}${duePart}] ${cleanText}`;
}

export function parseTaskInteraction(interaction: Pick<LeadInteraction, 'id' | 'content' | 'created_at'>): ParsedLeadTask | null {
  const match = TASK_PREFIX_RE.exec(interaction.content || '');
  if (!match) return null;
  return {
    id: interaction.id,
    done: match[1] === 'done',
    dueDate: match[2] || undefined,
    text: match[3].trim(),
    createdAt: interaction.created_at,
  };
}

export function isTaskInteraction(interaction: Pick<LeadInteraction, 'content'>): boolean {
  return TASK_PREFIX_RE.test(interaction.content || '');
}
