type TranslationObject = Record<string, unknown>;
type LanguageCode = 'ru' | 'en' | 'kk' | 'de' | 'uk' | 'uz' | 'be' | 'es' | 'fr' | 'it' | 'pt' | 'zh' | 'tr' | 'ja' | 'ko' | 'ar';

// Lazy import all locales — only used in dev mode
const localeImporters: Record<LanguageCode, () => Promise<TranslationObject>> = {
  ru: () => import('./locales/ru.json').then(m => m.default as unknown as TranslationObject),
  en: () => import('./locales/en.json').then(m => m.default as unknown as TranslationObject),
  kk: () => import('./locales/kk.json').then(m => m.default as unknown as TranslationObject),
  de: () => import('./locales/de.json').then(m => m.default as unknown as TranslationObject),
  uk: () => import('./locales/uk.json').then(m => m.default as unknown as TranslationObject),
  uz: () => import('./locales/uz.json').then(m => m.default as unknown as TranslationObject),
  be: () => import('./locales/be.json').then(m => m.default as unknown as TranslationObject),
  es: () => import('./locales/es.json').then(m => m.default as unknown as TranslationObject),
  fr: () => import('./locales/fr.json').then(m => m.default as unknown as TranslationObject),
  it: () => import('./locales/it.json').then(m => m.default as unknown as TranslationObject),
  pt: () => import('./locales/pt.json').then(m => m.default as unknown as TranslationObject),
  zh: () => import('./locales/zh.json').then(m => m.default as unknown as TranslationObject),
  tr: () => import('./locales/tr.json').then(m => m.default as unknown as TranslationObject),
  ja: () => import('./locales/ja.json').then(m => m.default as unknown as TranslationObject),
  ko: () => import('./locales/ko.json').then(m => m.default as unknown as TranslationObject),
  ar: () => import('./locales/ar.json').then(m => m.default as unknown as TranslationObject),
};

/**
 * Recursively extracts all keys from a nested object
 */
function getAllKeys(obj: TranslationObject, prefix = ''): string[] {
  const keys: string[] = [];

  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getAllKeys(value as TranslationObject, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Gets a value from nested object by dot-separated key
 */
function getNestedValue(obj: TranslationObject, key: string): unknown {
  return key.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as TranslationObject)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Sets a value in nested object by dot-separated key
 */
function setNestedValue(obj: TranslationObject, key: string, value: string): void {
  const parts = key.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as TranslationObject;
  }

  current[parts[parts.length - 1]] = value;
}

/**
 * Generates a placeholder value for a missing key
 */
function generatePlaceholder(key: string, lang: LanguageCode, referenceValue?: string): string {
  if (referenceValue && typeof referenceValue === 'string') {
    return `[${lang.toUpperCase()}] ${referenceValue}`;
  }
  const lastPart = key.split('.').pop() || key;
  const readable = lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim();
  return `[${lang.toUpperCase()}] ${readable}`;
}

const ALL_LANGUAGES: LanguageCode[] = ['ru', 'en', 'kk', 'de', 'uk', 'uz', 'be', 'es', 'fr', 'it', 'pt', 'zh', 'tr', 'ja', 'ko', 'ar'];

async function loadAllTranslations(): Promise<Record<LanguageCode, TranslationObject>> {
  const entries = await Promise.all(
    ALL_LANGUAGES.map(async (lang) => {
      const data = await localeImporters[lang]();
      return [lang, data] as [LanguageCode, TranslationObject];
    })
  );
  return Object.fromEntries(entries) as Record<LanguageCode, TranslationObject>;
}

/**
 * Finds missing keys in each language
 */
export async function getMissingTranslations(): Promise<Record<LanguageCode, string[]>> {
  const translations = await loadAllTranslations();

  const langKeys: Record<LanguageCode, string[]> = {} as any;
  for (const lang of ALL_LANGUAGES) {
    langKeys[lang] = getAllKeys(translations[lang]);
  }

  const allKeys = new Set<string>();
  Object.values(langKeys).forEach(keys => {
    keys.forEach(key => allKeys.add(key));
  });

  const result: Record<LanguageCode, string[]> = {} as any;
  for (const lang of ALL_LANGUAGES) {
    result[lang] = Array.from(allKeys).filter(key => !langKeys[lang].includes(key));
  }
  return result;
}

/**
 * Generates complete translation objects with placeholders for missing keys
 */
export async function generateMissingKeysWithPlaceholders(): Promise<Record<LanguageCode, TranslationObject>> {
  const translations = await loadAllTranslations();
  const missing = await getMissingTranslations();
  const result: Record<LanguageCode, TranslationObject> = {} as any;

  for (const lang of ALL_LANGUAGES) {
    result[lang] = {};
    for (const key of missing[lang]) {
      let referenceValue: string | undefined;
      for (const refLang of ALL_LANGUAGES) {
        if (refLang !== lang) {
          const val = getNestedValue(translations[refLang], key);
          if (typeof val === 'string') {
            referenceValue = val;
            break;
          }
        }
      }
      const placeholder = generatePlaceholder(key, lang, referenceValue);
      setNestedValue(result[lang], key, placeholder);
    }
  }

  return result;
}

/**
 * Logs missing keys with copy-pasteable JSON
 */
export async function logMissingKeysAsJSON(): Promise<void> {
  if (!import.meta.env.DEV) return;

  const missingWithPlaceholders = await generateMissingKeysWithPlaceholders();
  const languages: LanguageCode[] = ['ru', 'en', 'kk'];

  let hasMissing = false;

  languages.forEach(lang => {
    const keys = Object.keys(missingWithPlaceholders[lang]);
    if (keys.length > 0) {
      hasMissing = true;
      console.group(`📝 [i18n] Missing keys for ${lang.toUpperCase()} - Copy and merge into ${lang}.json:`);
      console.log(JSON.stringify(missingWithPlaceholders[lang], null, 2));
      console.groupEnd();
    }
  });

  if (!hasMissing) {
    console.log('✅ [i18n] No missing keys to generate!');
  }
}

/**
 * Copies missing translations to clipboard (call from browser console)
 */
export async function copyMissingToClipboard(lang: LanguageCode): Promise<void> {
  const missingWithPlaceholders = await generateMissingKeysWithPlaceholders();
  const json = JSON.stringify(missingWithPlaceholders[lang], null, 2);

  try {
    await navigator.clipboard.writeText(json);
    console.log(`✅ Copied missing ${lang.toUpperCase()} keys to clipboard!`);
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    console.log('JSON to copy manually:', json);
  }
}

/**
 * Validates all translation files and logs missing keys
 */
export async function validateTranslations(): Promise<void> {
  if (!import.meta.env.DEV) return;

  const translations = await loadAllTranslations();

  console.group('🌐 [i18n] Translation Validation');

  const langKeys: Record<LanguageCode, string[]> = {} as any;
  for (const lang of ALL_LANGUAGES) {
    langKeys[lang] = getAllKeys(translations[lang]);
  }

  const allKeys = new Set<string>();
  Object.values(langKeys).forEach(keys => {
    keys.forEach(key => allKeys.add(key));
  });

  const totalKeys = allKeys.size;
  console.log(`📊 Total unique keys: ${totalKeys}`);

  let hasIssues = false;

  ALL_LANGUAGES.forEach(lang => {
    const keys = langKeys[lang];
    const missingFromLang = Array.from(allKeys).filter(key => !keys.includes(key));

    if (missingFromLang.length > 0) {
      hasIssues = true;
      console.group(`❌ Missing in ${lang.toUpperCase()} (${missingFromLang.length} keys):`);
      missingFromLang.forEach(key => console.warn(`  • ${key}`));
      console.groupEnd();
    } else {
      console.log(`✅ ${lang.toUpperCase()}: All ${keys.length} keys present`);
    }
  });

  console.group('📋 Coverage by language:');
  ALL_LANGUAGES.forEach(lang => {
    const count = langKeys[lang].length;
    const percentage = ((count / totalKeys) * 100).toFixed(1);
    console.log(`  ${lang.toUpperCase()}: ${count}/${totalKeys} (${percentage}%)`);
  });
  console.groupEnd();

  if (hasIssues) {
    console.log('');
    console.log('💡 To generate placeholders for missing keys, run in console:');
    console.log('   window.__i18n.logMissingKeysAsJSON()');
    console.log('   window.__i18n.copyMissingToClipboard("ru" | "en" | "kk")');
  } else {
    console.log('🎉 All translations are complete!');
  }

  console.groupEnd();

  // Expose utilities globally in dev mode
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__i18n = {
      validateTranslations,
      getMissingTranslations,
      generateMissingKeysWithPlaceholders,
      logMissingKeysAsJSON,
      copyMissingToClipboard,
    };
  }
}
