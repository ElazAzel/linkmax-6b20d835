import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import type { LocaleCode, I18nText } from '@/lib/i18n-helpers';
import type { TranslatedBlock } from "@/types/language-context";
import { isI18nText, isMultilingualString } from '@/lib/i18n-helpers';

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
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  const langCode = browserLang.split('-')[0].toLowerCase();

  // Check if it's a known language
  if (LANGUAGE_NAMES[langCode]) return langCode;

  // Fallback to English
  return 'en';
}

// Normalize language code (handles legacy 'kz' -> 'kk' migration)
const normalizeLanguageCode = (lng: string): LocaleCode => {
  if (!lng) return 'ru';
  const code = lng.substring(0, 2).toLowerCase();
  if (code === 'kz') return 'kk';
  return code;
};

export { LanguageContext };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n, t } = useTranslation();

  // Detect browser language on mount
  const [browserLanguage] = useState<LocaleCode>(() => detectBrowserLanguage());

  const [currentLanguage, setCurrentLanguageState] = useState<LocaleCode>(() => {
    const stored = localStorage.getItem('i18nextLng');
    if (stored === 'kz') {
      localStorage.setItem('i18nextLng', 'kk');
    }
    return normalizeLanguageCode(stored || browserLanguage);
  });

  const [isTranslating, setIsTranslating] = useState(false);

  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(() => {
    const stored = localStorage.getItem('autoTranslateEnabled');
    return stored !== 'false'; // Default to true
  });

  // Target languages for translation (stored in localStorage)
  const [targetTranslationLanguages, setTargetTranslationLanguagesState] = useState<LocaleCode[]>(() => {
    const stored = localStorage.getItem('targetTranslationLanguages');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure English is always included
        if (!parsed.includes('en')) {
          return ['en', ...parsed];
        }
        return parsed;
      } catch {
        // Default: browser language + English + Russian
        const defaults = ['en'];
        if (browserLanguage !== 'en') defaults.push(browserLanguage);
        if (!defaults.includes('ru')) defaults.push('ru');
        return defaults;
      }
    }
    // Default: English + browser language + Russian
    const defaults = ['en'];
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
    const normalizedLang = lang === "kz" ? 'kk' : lang;
    setCurrentLanguageState(normalizedLang);
    i18n.changeLanguage(normalizedLang);
    localStorage.setItem('i18nextLng', normalizedLang);
  }, [i18n]);

  // Save auto-translate preference
  useEffect(() => {
    localStorage.setItem('autoTranslateEnabled', String(autoTranslateEnabled));
  }, [autoTranslateEnabled]);

  // Save target languages
  const setTargetTranslationLanguages = useCallback((languages: LocaleCode[]) => {
    // Ensure English is always included
    const ensured = languages.includes('en') ? languages : ['en', ...languages];
    setTargetTranslationLanguagesState(ensured);
    localStorage.setItem('targetTranslationLanguages', JSON.stringify(ensured));
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

  // Recursively translate all multilingual fields in an object to multiple languages
  const translateObject = async (
    obj: any,
    targetLanguages: LocaleCode[]
  ): Promise<any> => {
    if (!obj || typeof obj !== 'object') return obj;

    // If it's a multilingual object (I18nText or legacy MultilingualString)
    if (isI18nText(obj) || isMultilingualString(obj)) {
      // Find source language with content
      const keys = Object.keys(obj);
      const sourceLang = keys.find(k => obj[k] && String(obj[k]).trim()) as LocaleCode | undefined;
      if (!sourceLang) return obj;

      // Filter out languages that already have content
      const languagesNeedingTranslation = targetLanguages.filter(
        lang => lang !== sourceLang && (!obj[lang] || !String(obj[lang]).trim())
      );

      if (languagesNeedingTranslation.length === 0) return obj;

      const sourceText = String(obj[sourceLang]);
      const translations = await translateText(sourceText, sourceLang, languagesNeedingTranslation);

      if (translations) {
        return { ...obj, ...translations };
      }
      return obj;
    }

    // If it's an array
    if (Array.isArray(obj)) {
      const results = await Promise.all(
        obj.map(item => translateObject(item, targetLanguages))
      );
      return results;
    }

    // If it's a regular object, recursively translate
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      result[key] = await translateObject(obj[key] as any, targetLanguages);
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

  // Translate blocks to multiple languages
  const translateBlocksToMultipleLanguagesInternal = async (
    blocks: TranslatedBlock[],
    targetLanguages: LocaleCode[]
  ): Promise<TranslatedBlock[]> => {
    if (!blocks?.length || targetLanguages.length === 0) return blocks;

    setIsTranslating(true);

    try {
      const fieldsToCheck = ['title', 'description', 'text', 'bio', 'name', 'label', 'caption', 'buttonText', 'question', 'answer'];
      let needsTranslation = false;

      // Check if any field needs translation
      for (const block of blocks) {
        const content = block.content as any;
        if (!content) continue;

        for (const field of fieldsToCheck) {
          const fieldValue = content[field];
          if (fieldValue && (isI18nText(fieldValue) || isMultilingualString(fieldValue))) {
            for (const targetLang of targetLanguages) {
              if (!fieldValue[targetLang]?.trim()) {
                // Check if there's source content
                const hasSource = Object.values(fieldValue).some(v => typeof v === 'string' && v.trim());
                if (hasSource) {
                  needsTranslation = true;
                  break;
                }
              }
            }
          }
          if (needsTranslation) break;
        }

        // Check nested items
        if (!needsTranslation && content.items && Array.isArray(content.items)) {
          for (const item of content.items as any[]) {
            for (const field of fieldsToCheck) {
              const fieldValue = item[field];
              if (fieldValue && (isI18nText(fieldValue) || isMultilingualString(fieldValue))) {
                for (const targetLang of targetLanguages) {
                  if (!fieldValue[targetLang]?.trim()) {
                    const hasSource = Object.values(fieldValue).some(v => typeof v === 'string' && v.trim());
                    if (hasSource) {
                      needsTranslation = true;
                      break;
                    }
                  }
                }
              }
              if (needsTranslation) break;
            }
            if (needsTranslation) break;
          }
        }

        if (needsTranslation) break;
      }

      if (!needsTranslation) {
        setIsTranslating(false);
        return blocks;
      }

      // Translate all blocks
      const translatedBlocks = await Promise.all(
        blocks.map(async (block) => {
          if (!block.content) return block;

          const translatedContent = await translateObject(block.content, targetLanguages);
          return { ...block, content: translatedContent };
        })
      );

      const langNames = targetLanguages.map(l => LANGUAGE_NAMES[l] || l).join(', ');
      toast.success(t('language.autoTranslatedTo', 'Переведено на: {{languages}}', { languages: langNames }));
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
