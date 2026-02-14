import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import type { SupportedLanguage, MultilingualString } from '@/lib/i18n-helpers';
import { isMultilingualString } from '@/lib/i18n-helpers';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setCurrentLanguage: (lang: SupportedLanguage) => void;
  isTranslating: boolean;
  translateBlocksToLanguage: (blocks: any[], targetLang: SupportedLanguage) => Promise<any[]>;
  autoTranslateEnabled: boolean;
  setAutoTranslateEnabled: (enabled: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Normalize language code (handles 'kz' -> 'kk' migration)
const normalizeLanguageCode = (lng: string): SupportedLanguage => {
  if (!lng) return 'ru';
  const code = lng.substring(0, 2).toLowerCase();
  if (code === 'kz') return 'kk';
  if (code === 'kk') return 'kk';
  if (code === 'en') return 'en';
  return 'ru';
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(() => {
    // Migrate 'kz' to 'kk' on init
    const stored = localStorage.getItem('i18nextLng');
    if (stored === 'kz') {
      localStorage.setItem('i18nextLng', 'kk');
    }
    return normalizeLanguageCode(i18n.language || stored || 'ru');
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(() => {
    const stored = localStorage.getItem('autoTranslateEnabled');
    return stored !== 'false'; // Default to true
  });

  // Sync with i18n
  useEffect(() => {
    const lang = normalizeLanguageCode(i18n.language);
    if (['ru', 'en', 'kk'].includes(lang)) {
      setCurrentLanguageState(lang);
    }
  }, [i18n.language]);

  const setCurrentLanguage = useCallback((lang: SupportedLanguage) => {
    // Normalize in case 'kz' is passed
    const normalizedLang = lang === 'kz' as any ? 'kk' : lang;
    setCurrentLanguageState(normalizedLang);
    i18n.changeLanguage(normalizedLang);
    localStorage.setItem('i18nextLng', normalizedLang);
  }, [i18n]);

  // Save auto-translate preference
  useEffect(() => {
    localStorage.setItem('autoTranslateEnabled', String(autoTranslateEnabled));
  }, [autoTranslateEnabled]);

  // Translate a single text to target language
  const translateText = async (
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ): Promise<string | null> => {
    if (!text?.trim()) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: {
          text,
          sourceLanguage,
          targetLanguages: [targetLanguage],
        },
      });

      if (error) throw error;
      return data.translations?.[targetLanguage] || null;
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  };

  // Recursively translate all multilingual fields in an object
  const translateObject = async (
    obj: any,
    targetLang: SupportedLanguage
  ): Promise<any> => {
    if (!obj || typeof obj !== 'object') return obj;

    // If it's a MultilingualString
    if (isMultilingualString(obj)) {
      // If target language already has content, return as is
      if (obj[targetLang]?.trim()) {
        return obj;
      }

      // Find source language with content
      const sourceLangs: SupportedLanguage[] = ['ru', 'en', 'kk'];
      const sourceLang = sourceLangs.find(lang => obj[lang]?.trim());
      
      if (!sourceLang) return obj;

      const translated = await translateText(obj[sourceLang]!, sourceLang, targetLang);
      if (translated) {
        return { ...obj, [targetLang]: translated };
      }
      return obj;
    }

    // If it's an array
    if (Array.isArray(obj)) {
      const results = await Promise.all(
        obj.map(item => translateObject(item, targetLang))
      );
      return results;
    }

    // If it's a regular object, recursively translate
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = await translateObject(obj[key], targetLang);
    }
    return result;
  };

  // Translate all blocks to target language
  const translateBlocksToLanguage = useCallback(async (
    blocks: any[],
    targetLang: SupportedLanguage
  ): Promise<any[]> => {
    if (!blocks?.length || !autoTranslateEnabled) return blocks;

    setIsTranslating(true);
    
    try {
      // Find fields that need translation
      const fieldsToCheck = ['title', 'description', 'text', 'bio', 'name', 'label', 'caption', 'buttonText', 'question', 'answer'];
      let needsTranslation = false;

      // Check if any field needs translation
      for (const block of blocks) {
        const content = block.content;
        if (!content) continue;

        for (const field of fieldsToCheck) {
          if (content[field] && isMultilingualString(content[field])) {
            const ml = content[field] as MultilingualString;
            if (!ml[targetLang]?.trim() && (ml.ru?.trim() || ml.en?.trim() || ml.kk?.trim())) {
              needsTranslation = true;
              break;
            }
          }
        }
        
        // Check nested items (for FAQ, pricing, etc.)
        if (content.items && Array.isArray(content.items)) {
          for (const item of content.items) {
            for (const field of fieldsToCheck) {
              if (item[field] && isMultilingualString(item[field])) {
                const ml = item[field] as MultilingualString;
                if (!ml[targetLang]?.trim() && (ml.ru?.trim() || ml.en?.trim() || ml.kk?.trim())) {
                  needsTranslation = true;
                  break;
                }
              }
            }
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
          
          const translatedContent = await translateObject(block.content, targetLang);
          return { ...block, content: translatedContent };
        })
      );

      toast.success(t('language.autoTranslated', 'Контент автоматически переведён'));
      return translatedBlocks;
    } catch (error) {
      console.error('Auto-translation error:', error);
      toast.error(t('language.translationError', 'Ошибка автоперевода'));
      return blocks;
    } finally {
      setIsTranslating(false);
    }
  }, [autoTranslateEnabled, t]);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setCurrentLanguage,
        isTranslating,
        translateBlocksToLanguage,
        autoTranslateEnabled,
        setAutoTranslateEnabled,
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
