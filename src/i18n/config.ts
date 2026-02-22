import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ru from './locales/ru.json';
import en from './locales/en.json';
import kk from './locales/kk.json';
import de from './locales/de.json';
import uk from './locales/uk.json';
import uz from './locales/uz.json';
import be from './locales/be.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';
import tr from './locales/tr.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import ar from './locales/ar.json';
import { validateTranslations } from './validation';
import { storage } from '@/lib/storage';

// Merge all top-level keys into translation namespace
// This handles JSON files with structure: { translation: {...}, landingV5: {...}, ... }
const mergeNamespaces = (json: Record<string, unknown>) => {
  const { translation, ...rest } = json as { translation: Record<string, unknown>, [key: string]: unknown };
  return {
    translation: {
      ...translation,
      ...rest
    }
  };
};

// Migrate 'kz' to 'kk' if stored in localStorage
const migrateKzToKk = () => {
  if (typeof window === 'undefined') return;
  const stored = storage.getRaw('i18nextLng');
  if (stored === 'kz') {
    storage.setRaw('i18nextLng', 'kk');
    if (process.env.NODE_ENV === 'development') {
      console.warn('[i18n] Migrated language from "kz" to "kk"');
    }
  }
};

// Run migration before i18n init
migrateKzToKk();

// All supported UI languages
export const SUPPORTED_LANGUAGES = ['ru', 'en', 'kk', 'de', 'uk', 'uz', 'be', 'es', 'fr', 'it', 'pt', 'zh', 'tr', 'ja', 'ko', 'ar'] as const;

export type LocaleCode = typeof SUPPORTED_LANGUAGES[number] | (string & {});

// Normalize language code to supported codes
const normalizeLanguage = (lng: string): string => {
  if (!lng) return 'ru';

  // Extract base language code (e.g., 'ru-RU' -> 'ru')
  const langCode = lng.substring(0, 2).toLowerCase();

  // Map 'kz' to 'kk' (Kazakh ISO code)
  if (langCode === 'kz') return 'kk';

  // If it's a supported language, return it
  if (SUPPORTED_LANGUAGES.includes(langCode as any)) return langCode as LocaleCode;

  // Default to English for unsupported languages
  return 'en';
};

// Custom language detector - prioritizes URL params for language switching
const customLanguageDetector = {
  name: 'customDetector',
  lookup() {
    if (typeof window === 'undefined') return 'ru';
    // 1. URL parameter has highest priority (for language switching)
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang') || params.get('lng');
    if (urlLang) {
      const normalizedUrlLang = normalizeLanguage(urlLang);
      // Save to storage when set via URL
      storage.setRaw('i18nextLng', normalizedUrlLang);
      return normalizedUrlLang;
    }

    // 2. Check storage for user preference
    let stored = storage.getRaw('i18nextLng');

    // Migrate 'kz' to 'kk' on read
    if (stored === 'kz') {
      stored = 'kk';
      storage.setRaw('i18nextLng', 'kk');
    }

    if (stored && SUPPORTED_LANGUAGES.includes(stored as any)) {
      return stored as LocaleCode;
    }

    // 3. Auto-detect from browser language
    const browserLang = navigator.language || (navigator as any).languages?.[0] || '';
    return normalizeLanguage(browserLang);
  },
  cacheUserLanguage(lng: string) {
    if (typeof window === 'undefined') return;
    // Normalize before caching
    const normalizedLng = normalizeLanguage(lng);
    storage.setRaw('i18nextLng', normalizedLng);
  }
};

const languageDetectorPlugin = new LanguageDetector();
languageDetectorPlugin.addDetector(customLanguageDetector);

// Initialize i18n
i18n
  .use(languageDetectorPlugin)
  .use(initReactI18next)
  .init({
    resources: {
      ru: mergeNamespaces(ru),
      en: mergeNamespaces(en),
      kk: mergeNamespaces(kk),
      de: mergeNamespaces(de),
      uk: mergeNamespaces(uk),
      uz: mergeNamespaces(uz),
      be: mergeNamespaces(be),
      es: mergeNamespaces(es),
      fr: mergeNamespaces(fr),
      it: mergeNamespaces(it),
      pt: mergeNamespaces(pt),
      zh: mergeNamespaces(zh),
      tr: mergeNamespaces(tr),
      ja: mergeNamespaces(ja),
      ko: mergeNamespaces(ko),
      ar: mergeNamespaces(ar),
    },
    supportedLngs: ['ru', 'en', 'kk', 'de', 'uk', 'uz', 'be', 'es', 'fr', 'it', 'pt', 'zh', 'tr', 'ja', 'ko', 'ar'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    fallbackLng: {
      'kz': ['kk', 'en'],
      'uk': ['en'],
      'be': ['en'],
      'uz': ['en'],
      'default': ['en']
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
    ns: ['translation'],
    defaultNS: 'translation',
    detection: {
      order: ['customDetector'],
      caches: ['localStorage'],
    },
    // Handling missing keys
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: process.env.NODE_ENV === 'development'
      ? (lngs, ns, key, fallbackValue) => {
        console.warn(`[i18n] Missing key: "${key}" for languages: [${lngs.join(', ')}], namespace: "${ns}"`);
      }
      : undefined,
    // Return key if missing (instead of empty string)
    returnEmptyString: false,
    returnNull: false,
  });

// Development diagnostics
if (process.env.NODE_ENV === 'development') {
  console.log('[i18n] Initialized with language:', i18n.language);
  console.log('[i18n] Supported languages:', SUPPORTED_LANGUAGES);
  console.log('[i18n] Resources loaded:', Object.keys(i18n.options.resources || {}));

  // Validate all translations and show missing keys
  validateTranslations();
}

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  // Normalize on change
  const normalized = normalizeLanguage(lng);
  if (normalized !== lng && SUPPORTED_LANGUAGES.includes(normalized as any)) {
    i18n.changeLanguage(normalized as LocaleCode);
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[i18n] Language changed to:', lng);
  }

  // Update HTML lang attribute
  document.documentElement.lang = lng;
});

// Set initial HTML lang
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language || 'ru';
}

export default i18n;
