export type SupportedLanguage = 'ru' | 'en' | 'kk';

export type MultilingualString = {
  [key in SupportedLanguage]?: string;
};

export const LANGUAGES: { code: SupportedLanguage; name: string; flag: string }[] = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
];

/**
 * Get translated string for current language with fallback
 */
export function getTranslatedString(
  value: string | MultilingualString | undefined,
  language: SupportedLanguage,
  fallbackLanguage: SupportedLanguage = 'ru'
): string {
  if (!value) return '';
  
  // If it's a plain string, return it
  if (typeof value === 'string') return value;
  
  // If it's a multilingual object, get the translation with proper fallback chain
  const translation = value[language];
  if (translation && translation.trim() !== '') return translation;
  
  // Fallback chain: requested language -> fallback language -> ru -> en -> kk -> first non-empty value
  const fallbackValue = value[fallbackLanguage];
  if (fallbackValue && fallbackValue.trim() !== '') return fallbackValue;
  
  if (value.ru && value.ru.trim() !== '') return value.ru;
  if (value.en && value.en.trim() !== '') return value.en;
  if (value.kk && value.kk.trim() !== '') return value.kk;
  
  // Return first non-empty value
  const nonEmpty = Object.values(value).find(v => v && v.trim() !== '');
  return nonEmpty || '';
}

/**
 * Create empty multilingual string
 */
export function createMultilingualString(initialValue = ''): MultilingualString {
  return {
    ru: initialValue,
    en: '',
    kk: '',
  };
}

/**
 * Check if value is multilingual
 */
export function isMultilingualString(value: any): value is MultilingualString {
  return value && typeof value === 'object' && ('ru' in value || 'en' in value || 'kk' in value);
}

/**
 * Convert old string to multilingual format, preserving original in all fields initially
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
        return getTranslatedString(parsed, language, fallbackLanguage);
      }
    } catch {
      // Not valid JSON, return as plain string
    }
  }
  
  return value;
}
