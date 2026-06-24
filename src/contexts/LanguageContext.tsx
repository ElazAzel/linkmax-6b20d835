import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { LocaleCode } from '@/i18n/config';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { isI18nText, isMultilingualString } from '@/lib/i18n-helpers';
import { storage } from '@/lib/storage';
import { TranslatedBlock } from '@/types/language-context';

// Extended language names for translation
const LANGUAGE_NAMES: Record<string, string> = {
  ru: 'Russian', en: 'English', kk: 'Kazakh',
  uk: 'Ukrainian', be: 'Belarusian', uz: 'Uzbek',
  az: 'Azerbaijani', ky: 'Kyrgyz', tg: 'Tajik',
  hy: 'Armenian', ka: 'Georgian', tr: 'Turkish',
  de: 'German', fr: 'French', es: 'Spanish',
  it: 'Italian', pt: 'Portuguese', pl: 'Polish',
  nl: 'Dutch', cs: 'Czech', sv: 'Swedish',
  da: 'Danish', fi: 'Finnish', no: 'Norwegian',
  el: 'Greek', ro: 'Romanian', bg: 'Bulgarian',
  hr: 'Croatian', sr: 'Serbian', sk: 'Slovak',
  sl: 'Slovenian', et: 'Estonian', lv: 'Latvian',
  lt: 'Lithuanian', zh: 'Chinese', ja: 'Japanese',
  ko: 'Korean', hi: 'Hindi', th: 'Thai',
  vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay',
  ar: 'Arabic', he: 'Hebrew',
};

interface LanguageContextType {
  currentLanguage: LocaleCode;
  setCurrentLanguage: (lang: LocaleCode) => void;
  isTranslating: boolean;
  translateBlocksToLanguage: (blocks: TranslatedBlock[], targetLang: LocaleCode) => Promise<TranslatedBlock[]>;
  translateBlocksToMultipleLanguages: (blocks: TranslatedBlock[], targetLanguages: LocaleCode[]) => Promise<TranslatedBlock[]>;
  autoTranslateEnabled: boolean;
  setAutoTranslateEnabled: (enabled: boolean) => void;
  /** Detected browser language */
  browserLanguage: LocaleCode;
  /** Selected target languages for translation (English is always included) */
  targetTranslationLanguages: LocaleCode[];
  setTargetTranslationLanguages: (languages: LocaleCode[]) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Detect browser language
function detectBrowserLanguage(): LocaleCode {
  if (typeof window === 'undefined') return 'en';
  const browserLang = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage || 'en';
  const langCode = browserLang.split('-')[0].toLowerCase();

  // Check if it's a known language
  if (LANGUAGE_NAMES[langCode]) return langCode as LocaleCode;

  // Fallback to English
  return 'en';
}

// Normalize language code (handles legacy 'kz' -> 'kk' migration)
const normalizeLanguageCode = (lng: string): LocaleCode => {
  if (!lng) return 'ru';
  const code = lng.substring(0, 2).toLowerCase();
  if (code === 'kz') return 'kk';
  return code as LocaleCode;
};

export { LanguageContext };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n, t } = useTranslation();

  // Detect browser language on mount
  const [browserLanguage] = useState<LocaleCode>(() => detectBrowserLanguage());

  const [currentLanguage, setCurrentLanguageState] = useState<LocaleCode>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = storage.getRaw('i18nextLng');
    if (stored === 'kz') {
      storage.setRaw('i18nextLng', 'kk');
    }
    return normalizeLanguageCode(stored || browserLanguage);
  });

  const [isTranslating, setIsTranslating] = useState(false);

  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = storage.get<boolean>('autoTranslateEnabled');
    return stored !== false; // Default to true if null or true
  });

  // Target languages for translation (stored in storage)
  const [targetTranslationLanguages, setTargetTranslationLanguagesState] = useState<LocaleCode[]>(() => {
    if (typeof window === 'undefined') return ['en', 'ru'];
    const stored = storage.get<LocaleCode[]>('targetTranslationLanguages');
    if (stored) {
      // Ensure English is always included
      if (!stored.includes('en')) {
        return ['en', ...stored];
      }
      return stored;
    }
    // Default: English + browser language + Russian
    const defaults: LocaleCode[] = ['en'];
    if (browserLanguage !== 'en') defaults.push(browserLanguage);
    if (!defaults.includes('ru')) defaults.push('ru');
    return defaults;
  });

  // Sync with i18n
  useEffect(() => {
    const lang = normalizeLanguageCode(i18n.language);
    setCurrentLanguageState(lang);
  }, [i18n.language]);

  const setCurrentLanguage = useCallback((lang: LocaleCode) => {
    const normalizedLang = (lang as string) === "kz" ? ('kk' as LocaleCode) : lang;
    setCurrentLanguageState(normalizedLang);
    i18n.changeLanguage(normalizedLang);
    storage.setRaw('i18nextLng', normalizedLang);
  }, [i18n]);

  // Save auto-translate preference
  useEffect(() => {
    storage.set('autoTranslateEnabled', autoTranslateEnabled);
  }, [autoTranslateEnabled]);

  // Save target languages
  const setTargetTranslationLanguages = useCallback((languages: LocaleCode[]) => {
    // Ensure English is always included
    const ensured = languages.includes('en') ? languages : ['en', ...languages];
    setTargetTranslationLanguagesState(ensured as LocaleCode[]);
    storage.set('targetTranslationLanguages', ensured);
  }, []);

  // Translate a single text to multiple languages
  const translateText = async (
    text: string,
    sourceLanguage: LocaleCode,
    targetLanguages: LocaleCode[]
  ): Promise<Record<string, string> | null> => {
    if (!text?.trim() || targetLanguages.length === 0) return null;

    try {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: {
          text,
          sourceLanguage,
          targetLanguages,
        },
      });

      if (error) throw error;
      return data.translations || null;
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  };

  // Whitelist of field names that contain user-facing text and should be translated
  // even when stored as plain strings (legacy data not yet migrated to I18nText).
  const TRANSLATABLE_FIELD_NAMES = new Set([
    'title', 'description', 'text', 'bio', 'name', 'label', 'caption',
    'buttonText', 'buttonLabel', 'cta', 'ctaLabel', 'ctaText',
    'subtitle', 'heading', 'subheading', 'placeholder', 'helperText',
    'question', 'answer', 'quote', 'author', 'role', 'company',
    'message', 'greeting', 'tagline', 'displayName', 'alt',
    'address', 'location', 'venue', 'note', 'hint',
  ]);

  // Heuristic: avoid translating strings that look like URLs, emails, identifiers, code, or pure numbers
  const isLikelyTranslatable = (s: string): boolean => {
    const v = s.trim();
    if (v.length < 2) return false;
    if (/^https?:\/\//i.test(v)) return false;
    if (/^[\w.-]+@[\w.-]+\.\w+$/.test(v)) return false;
    if (/^[\d\s+()-]+$/.test(v)) return false; // phone-like / numeric
    if (/^#[0-9a-f]{3,8}$/i.test(v)) return false; // hex color
    if (/^[a-z0-9_-]+$/i.test(v) && !/\s/.test(v) && v.length < 30) return false; // slug/id
    return /[a-zA-Zа-яА-ЯёЁ\u0370-\u1FFF\u4E00-\u9FFF]/.test(v); // contains letters
  };

  // Recursively translate all multilingual fields in an object to multiple languages
  const translateObject = async (
    obj: unknown,
    targetLanguages: LocaleCode[],
    fieldName?: string,
    defaultSourceLang: LocaleCode = 'ru'
  ): Promise<unknown> => {
    if (obj === null || obj === undefined) return obj;

    // Plain string in a known translatable field → wrap and translate
    if (typeof obj === 'string') {
      if (!fieldName || !TRANSLATABLE_FIELD_NAMES.has(fieldName)) return obj;
      if (!isLikelyTranslatable(obj)) return obj;

      const languagesNeedingTranslation = targetLanguages.filter(lang => lang !== defaultSourceLang);
      if (languagesNeedingTranslation.length === 0) {
        return { [defaultSourceLang]: obj };
      }
      const translations = await translateText(obj, defaultSourceLang, languagesNeedingTranslation);
      if (translations) {
        return { [defaultSourceLang]: obj, ...translations };
      }
      return obj;
    }

    if (typeof obj !== 'object') return obj;

    // If it's a multilingual object (I18nText or legacy MultilingualString)
    const objRecord = obj as Record<string, unknown>;
    if (isI18nText(obj) || isMultilingualString(obj)) {
      // Find source language with content (prefer ru → en → first non-empty)
      const preferredOrder = ['ru', 'en', 'kk', ...Object.keys(objRecord)];
      const sourceLang = preferredOrder.find(k => objRecord[k] && String(objRecord[k]).trim()) as LocaleCode | undefined;
      if (!sourceLang) return obj;

      // Filter out languages that already have content
      const languagesNeedingTranslation = targetLanguages.filter(
        lang => lang !== sourceLang && (!objRecord[lang] || !String(objRecord[lang]).trim())
      );

      if (languagesNeedingTranslation.length === 0) return obj;

      const sourceText = String(objRecord[sourceLang]);
      const translations = await translateText(sourceText, sourceLang, languagesNeedingTranslation);

      if (translations) {
        return { ...obj, ...translations };
      }
      return obj;
    }

    // If it's an array
    if (Array.isArray(obj)) {
      const results = await Promise.all(
        obj.map(item => translateObject(item, targetLanguages, fieldName, defaultSourceLang))
      );
      return results;
    }

    // If it's a regular object, recursively translate
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(objRecord)) {
      result[key] = await translateObject(objRecord[key], targetLanguages, key, defaultSourceLang);
    }
    return result;
  };

  // Translate blocks to a single language (backward compatibility)
  const translateBlocksToLanguage = useCallback(async (
    blocks: TranslatedBlock[],
    targetLang: LocaleCode
  ): Promise<TranslatedBlock[]> => {
    return translateBlocksToMultipleLanguagesInternal(blocks, [targetLang]);
  }, []);

  // Detect best source language across all blocks (most-used non-empty lang in i18n fields, fallback 'ru')
  const detectSourceLanguage = (blocks: TranslatedBlock[]): LocaleCode => {
    const counts: Record<string, number> = {};
    const visit = (v: unknown) => {
      if (!v) return;
      if (typeof v === 'object' && !Array.isArray(v) && (isI18nText(v) || isMultilingualString(v))) {
        const vRecord = v as Record<string, unknown>;
        for (const k of Object.keys(vRecord)) {
          const val = vRecord[k];
          if (val && String(val).trim()) counts[k] = (counts[k] || 0) + 1;
        }
        return;
      }
      if (Array.isArray(v)) v.forEach(visit);
      else if (typeof v === 'object') Object.values(v as Record<string, unknown>).forEach(visit);
    };
    blocks.forEach(b => visit(b.content));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return ((sorted[0]?.[0]) || 'ru') as LocaleCode;
  };

  // Translate blocks to multiple languages
  const translateBlocksToMultipleLanguagesInternal = async (
    blocks: TranslatedBlock[],
    targetLanguages: LocaleCode[]
  ): Promise<TranslatedBlock[]> => {
    if (!blocks?.length || targetLanguages.length === 0) return blocks;

    setIsTranslating(true);

    try {
      const sourceLang = detectSourceLanguage(blocks);
      // Skip if all targets are the source language
      const realTargets = targetLanguages.filter(l => l !== sourceLang);
      if (realTargets.length === 0) {
        setIsTranslating(false);
        return blocks;
      }

      // Translate all blocks (translateObject internally skips fields that don't need work)
      const translatedBlocks = await Promise.all(
        blocks.map(async (block) => {
          if (!block.content) return block;
          const translatedContent = await translateObject(block.content, targetLanguages, undefined, sourceLang);
          return { ...block, content: translatedContent };
        })
      );

      return translatedBlocks;
    } catch (error) {
      console.error('Auto-translation error:', error);
      toast.error(t('language.translationError', 'Ошибка автоперевода'));
      return blocks;
    } finally {
      setIsTranslating(false);
    }
  };


  const translateBlocksToMultipleLanguages = useCallback(
    translateBlocksToMultipleLanguagesInternal,
    [t]
  );

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setCurrentLanguage,
        isTranslating,
        translateBlocksToLanguage,
        translateBlocksToMultipleLanguages,
        autoTranslateEnabled,
        setAutoTranslateEnabled,
        browserLanguage,
        targetTranslationLanguages,
        setTargetTranslationLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useOptionalLanguage() {
  return useContext(LanguageContext);
}
