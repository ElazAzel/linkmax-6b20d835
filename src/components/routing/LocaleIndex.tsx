import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Index from '@/pages/Index';

const SUPPORTED = ['ru', 'en', 'kk', 'uz'] as const;
type Lang = (typeof SUPPORTED)[number];

/**
 * Renders the homepage for /:lang routes (e.g. /ru, /en, /kk, /uz).
 * Switches i18n language to match the URL segment so the page renders
 * in the requested locale — boosts indexability per language.
 */
export default function LocaleIndex() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();

  const isSupported = SUPPORTED.includes(lang as Lang);

  useEffect(() => {
    if (isSupported && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, isSupported, i18n]);

  if (!isSupported) {
    return <Navigate to="/" replace />;
  }

  return <Index />;
}
