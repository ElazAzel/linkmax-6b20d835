// Polyfill requestIdleCallback for Safari
const _ric = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 1);

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { storage } from '@/lib/storage';

// Only eagerly import the 3 primary locales (ru, en, kk) — rest are lazy-loaded on demand
import ru from './locales/ru.json';
import en from './locales/en.json';
import kk from './locales/kk.json';

// Merge all top-level keys into translation namespace
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
  }
};

migrateKzToKk();

// All supported UI languages
export const SUPPORTED_LANGUAGES = ['ru', 'en', 'kk', 'de', 'uk', 'uz', 'be', 'es', 'fr', 'it', 'pt', 'zh', 'tr', 'ja', 'ko', 'ar'] as const;

export type LocaleCode = typeof SUPPORTED_LANGUAGES[number] | (string & {});

// Languages that are lazy-loaded (not in initial bundle)
const LAZY_LANGUAGES = ['de', 'uk', 'uz', 'be', 'es', 'fr', 'it', 'pt', 'zh', 'tr', 'ja', 'ko', 'ar'] as const;

// Dynamic import map for lazy locales
const lazyLocaleImporters: Record<string, () => Promise<Record<string, unknown>>> = {
  de: () => import('./locales/de.json').then(m => m.default as unknown as Record<string, unknown>),
  uk: () => import('./locales/uk.json').then(m => m.default as unknown as Record<string, unknown>),
  uz: () => import('./locales/uz.json').then(m => m.default as unknown as Record<string, unknown>),
  be: () => import('./locales/be.json').then(m => m.default as unknown as Record<string, unknown>),
  es: () => import('./locales/es.json').then(m => m.default as unknown as Record<string, unknown>),
  fr: () => import('./locales/fr.json').then(m => m.default as unknown as Record<string, unknown>),
  it: () => import('./locales/it.json').then(m => m.default as unknown as Record<string, unknown>),
  pt: () => import('./locales/pt.json').then(m => m.default as unknown as Record<string, unknown>),
  zh: () => import('./locales/zh.json').then(m => m.default as unknown as Record<string, unknown>),
  tr: () => import('./locales/tr.json').then(m => m.default as unknown as Record<string, unknown>),
  ja: () => import('./locales/ja.json').then(m => m.default as unknown as Record<string, unknown>),
  ko: () => import('./locales/ko.json').then(m => m.default as unknown as Record<string, unknown>),
  ar: () => import('./locales/ar.json').then(m => m.default as unknown as Record<string, unknown>),
};

// Track which lazy locales have been loaded
const loadedLazyLocales = new Set<string>();

/**
 * Load a lazy locale on demand and add it to i18n
 */
async function loadLazyLocale(lang: string): Promise<void> {
  if (loadedLazyLocales.has(lang)) return;
  const importer = lazyLocaleImporters[lang];
  if (!importer) return;

  try {
    const data = await importer();
    const merged = mergeNamespaces(data);
    i18n.addResourceBundle(lang, 'translation', merged.translation, true, true);
    loadedLazyLocales.add(lang);
  } catch (e) {
    console.warn(`[i18n] Failed to load locale: ${lang}`, e);
  }
}

// Normalize language code to supported codes
const normalizeLanguage = (lng: string): string => {
  if (!lng) return 'ru';
  const langCode = lng.substring(0, 2).toLowerCase();
  if (langCode === 'kz') return 'kk';
  if (SUPPORTED_LANGUAGES.includes(langCode as any)) return langCode as LocaleCode;
  return 'en';
};

// Custom language detector
const customLanguageDetector = {
  name: 'customDetector',
  lookup() {
    if (typeof window === 'undefined') return 'ru';
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang') || params.get('lng');
    if (urlLang) {
      const normalizedUrlLang = normalizeLanguage(urlLang);
      storage.setRaw('i18nextLng', normalizedUrlLang);
      return normalizedUrlLang;
    }

    let stored = storage.getRaw('i18nextLng');
    if (stored === 'kz') {
      stored = 'kk';
      storage.setRaw('i18nextLng', 'kk');
    }
    if (stored && SUPPORTED_LANGUAGES.includes(stored as any)) {
      return stored as LocaleCode;
    }

    const browserLang = navigator.language || (navigator as any).languages?.[0] || '';
    return normalizeLanguage(browserLang);
  },
  cacheUserLanguage(lng: string) {
    if (typeof window === 'undefined') return;
    const normalizedLng = normalizeLanguage(lng);
    storage.setRaw('i18nextLng', normalizedLng);
  }
};

const languageDetectorPlugin = new LanguageDetector();
languageDetectorPlugin.addDetector(customLanguageDetector);

// Initialize i18n with only the 3 primary locales
i18n
  .use(languageDetectorPlugin)
  .use(initReactI18next)
  .init({
    resources: {
      ru: mergeNamespaces(ru),
      en: mergeNamespaces(en),
      kk: mergeNamespaces(kk),
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
      escapeValue: false,
    },
    ns: ['translation'],
    defaultNS: 'translation',
    detection: {
      order: ['customDetector'],
      caches: ['localStorage'],
    },
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: process.env.NODE_ENV === 'development'
      ? (lngs, ns, key, fallbackValue) => {
        console.warn(`[i18n] Missing key: "${key}" for languages: [${lngs.join(', ')}], namespace: "${ns}"`);
      }
      : undefined,
    returnEmptyString: false,
    returnNull: false,
  });

// If the detected language is a lazy locale, load it immediately
const detectedLang = i18n.language;
if (LAZY_LANGUAGES.includes(detectedLang as any)) {
  loadLazyLocale(detectedLang);
}

// Development diagnostics (lazy-loaded)
if (process.env.NODE_ENV === 'development') {
  import('@/lib/utils/logger').then(({ logger }) => {
    logger.debug('Initialized with language: ' + i18n.language, { context: 'i18n' });
    logger.debug('Eagerly loaded: ru, en, kk. Lazy locales: ' + LAZY_LANGUAGES.join(', '), { context: 'i18n' });
  });
  // Defer validation to not block startup
  _ric(() => {
    import('./validation').then(({ validateTranslations }) => {
      validateTranslations();
    });
  });
}

// Listen for language changes — lazy-load locale if needed
i18n.on('languageChanged', (lng) => {
  const normalized = normalizeLanguage(lng);
  if (normalized !== lng && SUPPORTED_LANGUAGES.includes(normalized as any)) {
    i18n.changeLanguage(normalized as LocaleCode);
    return;
  }

  // Load lazy locale if switching to a non-primary language
  if (LAZY_LANGUAGES.includes(normalized as any)) {
    loadLazyLocale(normalized);
  }

  if (process.env.NODE_ENV === 'development') {
    import('@/lib/utils/logger').then(({ logger }) => {
      logger.debug('Language changed to: ' + lng, { context: 'i18n' });
    });
  }

  document.documentElement.lang = lng;
});

// Set initial HTML lang
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language || 'ru';
}

export default i18n;
