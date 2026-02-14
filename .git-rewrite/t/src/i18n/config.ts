import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ru from './locales/ru.json';
import en from './locales/en.json';
import kk from './locales/kk.json';

// Custom language detector based on browser language and geolocation
const customLanguageDetector = {
  name: 'customDetector',
  lookup() {
    // Check if user manually selected language (stored in localStorage)
    const stored = localStorage.getItem('i18nextLng');
    if (stored) return stored;

    // Auto-detect from browser language
    const browserLang = navigator.language || navigator.languages?.[0] || '';
    const langCode = browserLang.substring(0, 2).toLowerCase();
    
    // Russian speakers
    if (langCode === 'ru') return 'ru';
    
    // Kazakh speakers
    if (langCode === 'kk') return 'kk';
    
    // English speakers
    if (langCode === 'en') return 'en';
    
    // CIS region languages default to Russian
    // Ukrainian, Belarusian, Uzbek, Kyrgyz, Tajik, Azerbaijani, Armenian, Georgian, Moldovan
    const cisLanguages = ['uk', 'be', 'uz', 'ky', 'tg', 'az', 'hy', 'ka', 'mo', 'ro'];
    if (cisLanguages.includes(langCode)) return 'ru';
    
    // Rest of the world defaults to English
    return 'en';
  },
  cacheUserLanguage(lng: string) {
    localStorage.setItem('i18nextLng', lng);
  }
};

const languageDetectorPlugin = new LanguageDetector();
languageDetectorPlugin.addDetector(customLanguageDetector);

i18n
  .use(languageDetectorPlugin)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
      kk: { translation: kk },
    },
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'customDetector'],
      caches: ['localStorage'],
    },
  });

export default i18n;
