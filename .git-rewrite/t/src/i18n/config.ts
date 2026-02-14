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

// Migrate 'kz' to 'kk' if stored in localStorage
const migrateKzToKk = () => {
  const stored = localStorage.getItem('i18nextLng');
  if (stored === 'kz') {
    localStorage.setItem('i18nextLng', 'kk');
    if (import.meta.env.DEV) {
      console.warn('[i18n] Migrated language from "kz" to "kk"');
    }
  }
};

// Run migration before i18n init
migrateKzToKk();

// All supported UI languages
const SUPPORTED_LANGUAGES = ['ru', 'en', 'kk', 'de', 'uk', 'uz', 'be', 'es', 'fr', 'it', 'pt', 'zh', 'tr', 'ja', 'ko', 'ar'];

// Normalize language code to supported codes
const normalizeLanguage = (lng: string): string => {
  if (!lng) return 'ru';

  // Extract base language code (e.g., 'ru-RU' -> 'ru')
  const langCode = lng.substring(0, 2).toLowerCase();

  // Map 'kz' to 'kk' (Kazakh ISO code)
  if (langCode === 'kz') return 'kk';

  // If it's a supported language, return it
  if (SUPPORTED_LANGUAGES.includes(langCode)) return langCode;

  // Default to English for unsupported languages
  return 'en';
};

// Custom language detector
const customLanguageDetector = {
  name: 'customDetector',
  lookup() {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang') || params.get('lng');
    if (urlLang) {
      return normalizeLanguage(urlLang);
    }

    // Check if user manually selected language (stored in localStorage)
    let stored = localStorage.getItem('i18nextLng');

    // Migrate 'kz' to 'kk' on read
    if (stored === 'kz') {
      stored = 'kk';
      localStorage.setItem('i18nextLng', 'kk');
    }

    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      return stored;
    }

    // Auto-detect from browser language
    const browserLang = navigator.language || navigator.languages?.[0] || '';
    return normalizeLanguage(browserLang);
  },
  cacheUserLanguage(lng: string) {
    // Normalize before caching
    const normalizedLng = normalizeLanguage(lng);
    localStorage.setItem('i18nextLng', normalizedLng);
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
      ru,
      en,
      kk,
      de,
      uk,
      uz,
      be,
      es,
      fr,
      it,
      pt,
      zh,
      tr,
      ja,
      ko,
      ar,
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
    detection: {
      order: ['localStorage', 'customDetector', 'navigator'],
      caches: ['localStorage'],
    },
    // Handling missing keys
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: import.meta.env.DEV
      ? (lngs, ns, key, fallbackValue) => {
        console.warn(`[i18n] Missing key: "${key}" for languages: [${lngs.join(', ')}], namespace: "${ns}"`);
      }
      : undefined,
    // Return key if missing (instead of empty string)
    returnEmptyString: false,
    returnNull: false,
  });

// Development diagnostics
if (import.meta.env.DEV) {
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
  if (normalized !== lng && SUPPORTED_LANGUAGES.includes(normalized)) {
    i18n.changeLanguage(normalized);
    return;
  }

  if (import.meta.env.DEV) {
    console.log('[i18n] Language changed to:', lng);
  }

  // Update HTML lang attribute
  document.documentElement.lang = lng;
});

// Set initial HTML lang
document.documentElement.lang = i18n.language || 'ru';

export default i18n;
