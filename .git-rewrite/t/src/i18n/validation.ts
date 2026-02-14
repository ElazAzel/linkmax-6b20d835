import ru from './locales/ru.json';
import en from './locales/en.json';
import kk from './locales/kk.json';

type TranslationObject = Record<string, unknown>;
type LanguageCode = 'ru' | 'en' | 'kk';

const translations: Record<LanguageCode, TranslationObject> = { ru, en, kk };

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
    // Use reference value with language prefix for easy identification
    return `[${lang.toUpperCase()}] ${referenceValue}`;
  }
  // Generate from key name
  const lastPart = key.split('.').pop() || key;
  const readable = lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim();
  return `[${lang.toUpperCase()}] ${readable}`;
}

/**
 * Finds missing keys in each language
 */
export function getMissingTranslations(): Record<LanguageCode, string[]> {
  const langKeys: Record<LanguageCode, string[]> = {
    ru: getAllKeys(ru as TranslationObject),
    en: getAllKeys(en as TranslationObject),
    kk: getAllKeys(kk as TranslationObject),
  };

  const allKeys = new Set<string>();
  Object.values(langKeys).forEach(keys => {
    keys.forEach(key => allKeys.add(key));
  });

  return {
    ru: Array.from(allKeys).filter(key => !langKeys.ru.includes(key)),
    en: Array.from(allKeys).filter(key => !langKeys.en.includes(key)),
    kk: Array.from(allKeys).filter(key => !langKeys.kk.includes(key)),
  };
}

/**
 * Generates complete translation objects with placeholders for missing keys
 */
export function generateMissingKeysWithPlaceholders(): Record<LanguageCode, TranslationObject> {
  const missing = getMissingTranslations();
  const result: Record<LanguageCode, TranslationObject> = {
    ru: {},
    en: {},
    kk: {},
  };

  const languages: LanguageCode[] = ['ru', 'en', 'kk'];
  
  languages.forEach(lang => {
    missing[lang].forEach(key => {
      // Try to find reference value from another language
      let referenceValue: string | undefined;
      for (const refLang of languages) {
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
    });
  });

  return result;
}

/**
 * Logs missing keys with copy-pasteable JSON
 */
export function logMissingKeysAsJSON(): void {
  if (!import.meta.env.DEV) return;

  const missingWithPlaceholders = generateMissingKeysWithPlaceholders();
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
  const missingWithPlaceholders = generateMissingKeysWithPlaceholders();
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
export function validateTranslations(): void {
  if (!import.meta.env.DEV) return;

  console.group('🌐 [i18n] Translation Validation');
  
  const langKeys: Record<LanguageCode, string[]> = {
    ru: getAllKeys(ru as TranslationObject),
    en: getAllKeys(en as TranslationObject),
    kk: getAllKeys(kk as TranslationObject),
  };

  // Get all unique keys from all languages
  const allKeys = new Set<string>();
  Object.values(langKeys).forEach(keys => {
    keys.forEach(key => allKeys.add(key));
  });

  const totalKeys = allKeys.size;
  console.log(`📊 Total unique keys: ${totalKeys}`);

  // Check each language
  const languages: LanguageCode[] = ['ru', 'en', 'kk'];
  let hasIssues = false;

  languages.forEach(lang => {
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

  // Show keys that exist in some languages but not others
  console.group('📋 Coverage by language:');
  languages.forEach(lang => {
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
