/**
 * Locales LinkMAX can render. Kept here (not imported from the app i18n
 * config) because the MCP function is bundled on its own; a test checks the
 * two lists stay equal.
 */
export const MCP_LANGUAGES = ['ru', 'en', 'kk', 'de', 'uk', 'uz', 'be', 'es', 'fr', 'it', 'pt', 'zh', 'tr', 'ja', 'ko', 'ar'] as const;
export type McpLanguage = typeof MCP_LANGUAGES[number];

const LANGUAGE_SET = new Set<string>(MCP_LANGUAGES);

export function isMcpLanguage(value: string): value is McpLanguage {
  return LANGUAGE_SET.has(value);
}

/** A multilingual text value: an object whose keys are locale codes and values strings. */
export function isLocalizedText(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entries = Object.entries(value as Record<string, unknown>);
  return entries.length > 0 && entries.every(([key, v]) => isMcpLanguage(key) && (typeof v === 'string' || v == null));
}

/** Text in one language, falling back the way the public page does. */
export function textIn(value: unknown, lang: string, fallback: string[] = ['ru', 'en']): string {
  if (typeof value === 'string') return value;
  if (!isLocalizedText(value)) return '';
  for (const code of [lang, ...fallback]) {
    const text = value[code];
    if (typeof text === 'string' && text.trim()) return text;
  }
  return Object.values(value).find((v) => typeof v === 'string' && v.trim()) ?? '';
}
