import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Index from '@/pages/Index';
import { changeLanguageLoaded } from '@/i18n/config';

export type HomeLocale = 'ru' | 'en' | 'kk' | 'uz';

/**
 * Renders the homepage for the locale routes (/ru, /en, /kk, /uz).
 * Switches i18n language to match the URL segment so the page renders
 * in the requested locale — boosts indexability per language.
 */
export default function LocaleIndex({ lang }: { lang: HomeLocale }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== lang) {
      void changeLanguageLoaded(lang);
    }
  }, [lang, i18n]);

  return <Index />;
}
