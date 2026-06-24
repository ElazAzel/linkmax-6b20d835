// ============= LEGACY: Backward Compatibility =============
export type SupportedLanguage = 'ru' | 'en' | 'kk';

export type MultilingualString = {
  [key in SupportedLanguage]?: string;
};

export const LANGUAGES: { code: SupportedLanguage; name: string; flag: string }[] = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
];

// ============= NEW: Flexible i18n System =============
/**
 * Universal locale code - any ISO 639-1 or custom code
 * Examples: 'ru', 'en', 'kk', 'tr', 'de', 'fr', 'zh', 'ar', 'uz', etc.
 */
export type LocaleCode = string;

/**
 * Universal i18n text type - maps any locale to its translation
 * Replaces the rigid MultilingualString { ru?, en?, kk? } pattern
 * Example: { ru: 'Привет', en: 'Hello', tr: 'Merhaba', de: 'Hallo' }
 */
export type I18nText = Record<LocaleCode, string | undefined>;

/**
 * Available language definitions for UI (can be extended)
 * This replaces the hard-coded LANGUAGES array
 */
export const LANGUAGE_DEFINITIONS: Record<LocaleCode, { name: string; flag: string }> = {
  ru: { name: 'Русский', flag: '🇷🇺' },
  en: { name: 'English', flag: '🇬🇧' },
  kk: { name: 'Қазақша', flag: '🇰🇿' },
  // Easy to extend with more languages:
  // tr: { name: 'Türkçe', flag: '🇹🇷' },
  // de: { name: 'Deutsch', flag: '🇩🇪' },
  // uz: { name: "O'zbekcha", flag: '🇺🇿' },
};

/**
 * NEW: Get i18n text with smart fallback chain
 * Unified function for both I18nText and legacy MultilingualString
 *
 * Fallback order:
 * 1. Requested language
 * 2. Default language (English is mandatory)
 * 3. Custom fallbacks array
 * 4. First non-empty translation
 * 5. Empty string
 *
 * @param value - string | I18nText | MultilingualString | undefined
 * @param lang - target language code
 * @param fallbacks - fallback languages in order (default: ['en'] - English as primary fallback)
 * @returns translated string or empty string (never undefined)
 */
export function getI18nText(
  value: string | I18nText | MultilingualString | undefined | null,
  lang: string,
  fallbacks: string[] | string = ['en']
): string {
  if (!value) return '';
  if (typeof value === 'string') return value;

  // Handle both new API (array) and legacy API (single fallback string)
  const fallbackArray = Array.isArray(fallbacks) ? fallbacks : [fallbacks];
  
  // Build the chain: requested lang -> fallbacks -> first non-empty
  const chain = [lang, ...fallbackArray];
  
  for (const locale of chain) {
    const translation = value[locale as keyof typeof value];
    if (translation && typeof translation === 'string' && translation.trim()) return translation;
  }

  // Last resort: first non-empty translation
  const any = Object.values(value).find(v => typeof v === 'string' && v && v.trim());
  return any ?? '';
}

// createMultilingualString is defined below with deprecation notice

/**
 * Check if value is multilingual (I18nText or legacy MultilingualString)
 * Checks if value is object with at least one string property
 */
export function isI18nText(value: unknown): value is I18nText | MultilingualString {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value as Record<string, unknown>).some(v => typeof v === 'string' && v)
  );
}

/**
 * LEGACY: Check if value is multilingual
 * @deprecated Use isI18nText() instead
 */
export function isMultilingualString(value: unknown): value is MultilingualString {
  return !!value && typeof value === 'object' && ('ru' in (value as Record<string, unknown>) || 'en' in (value as Record<string, unknown>) || 'kk' in (value as Record<string, unknown>));
}

/**
 * Ensure value is I18nText format (or legacy MultilingualString)
 * If it's a plain string, convert it to { [defaultLang]: value }
 */
export function ensureI18nText(
  value: string | I18nText | MultilingualString | undefined | null,
  defaultLang: string = 'ru'
): I18nText {
  if (!value) return {};
  if (typeof value === 'string') return { [defaultLang]: value };
  return value as I18nText;
}

/**
 * Convert string | I18nText to I18nText
 * Used when migrating old fields to multilingual
 * If already I18nText, returns as-is
 * If string, wraps in { [defaultLang]: value }
 */
export function toI18nText(
  value: string | I18nText | MultilingualString | undefined | null,
  defaultLang: string = 'ru'
): I18nText {
  return ensureI18nText(value, defaultLang);
}

/**
 * Create empty i18n text object
 * @param locales - languages to initialize (default: ['en'] - English is mandatory)
 */
export function createEmptyI18nText(locales: string[] = ['en']): I18nText {
  const result: I18nText = {};
  for (const locale of locales) {
    result[locale] = '';
  }
  return result;
}

/**
 * LEGACY: Create empty multilingual string
 * @deprecated Use createEmptyI18nText() or ensureI18nText()
 */
export function createMultilingualString(initialValue = ''): MultilingualString {
  return {
    ru: initialValue,
    en: '',
    kk: '',
  };
}

/**
 * LEGACY: Convert old string to multilingual format
 * @deprecated Use toI18nText() or ensureI18nText()
 */
export function migrateToMultilingual(value: string | MultilingualString | undefined): MultilingualString {
  if (!value) return createMultilingualString();
  if (isMultilingualString(value)) return value;
  // Put the original value in all language fields so it shows regardless of selected language
  return { ru: value, en: value, kk: value };
}

/**
 * Parse a database field that might be JSON (MultilingualString) or plain string
 * Used when fetching data from Supabase where title/description could be stored as JSON
 */
export function parseMultilingualField(
  value: string | null | undefined,
  language: SupportedLanguage,
  fallbackLanguage: SupportedLanguage = 'ru'
): string {
  if (!value) return '';
  
  // Try to parse as JSON if it looks like JSON
  if (value.startsWith('{') && value.endsWith('}')) {
    try {
      const parsed = JSON.parse(value);
      if (isMultilingualString(parsed)) {
        return getI18nText(parsed, language, fallbackLanguage);
      }
    } catch {
      // Not valid JSON, return as plain string
    }
  }
  
  return value;
}
