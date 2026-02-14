import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { SupportedLanguage, MultilingualString } from '@/lib/i18n-helpers';
import { isMultilingualString } from '@/lib/i18n-helpers';

interface TranslateOptions {
  sourceLanguage: SupportedLanguage;
  targetLanguages: SupportedLanguage[];
}

export function useAutoTranslate() {
  const { t } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);

  const translateText = useCallback(async (
    text: string,
    options: TranslateOptions
  ): Promise<Record<string, string> | null> => {
    if (!text?.trim()) return null;

    try {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: {
          text,
          sourceLanguage: options.sourceLanguage,
          targetLanguages: options.targetLanguages,
        },
      });

      if (error) throw error;
      return data.translations;
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  }, []);

  const translateMultilingualField = useCallback(async (
    value: MultilingualString,
    targetLanguage: SupportedLanguage
  ): Promise<string | null> => {
    // If target language already has content, return it
    if (value[targetLanguage]?.trim()) {
      return value[targetLanguage]!;
    }

    // Find a source language with content
    const sourceLanguages: SupportedLanguage[] = ['ru', 'en', 'kk'];
    const sourceLanguage = sourceLanguages.find(lang => value[lang]?.trim());
    
    if (!sourceLanguage) return null;

    const translations = await translateText(value[sourceLanguage]!, {
      sourceLanguage,
      targetLanguages: [targetLanguage],
    });

    return translations?.[targetLanguage] || null;
  }, [translateText]);

  const translateBlocks = useCallback(async (
    blocks: any[],
    targetLanguage: SupportedLanguage,
    onProgress?: (progress: number) => void
  ): Promise<any[]> => {
    if (!blocks.length) return blocks;

    setIsTranslating(true);
    const translatedBlocks = [...blocks];
    let translatedCount = 0;
    let totalToTranslate = 0;

    // Count fields that need translation
    for (const block of blocks) {
      const content = block.content;
      if (!content) continue;

      const fieldsToTranslate = ['title', 'description', 'text', 'bio', 'name', 'label', 'caption'];
      for (const field of fieldsToTranslate) {
        if (content[field] && isMultilingualString(content[field]) && !content[field][targetLanguage]?.trim()) {
          totalToTranslate++;
        }
      }
    }

    if (totalToTranslate === 0) {
      setIsTranslating(false);
      return blocks;
    }

    try {
      for (let i = 0; i < translatedBlocks.length; i++) {
        const block = translatedBlocks[i];
        const content = block.content;
        if (!content) continue;

        const fieldsToTranslate = ['title', 'description', 'text', 'bio', 'name', 'label', 'caption'];
        const newContent = { ...content };

        for (const field of fieldsToTranslate) {
          if (content[field] && isMultilingualString(content[field])) {
            const multilingual = content[field] as MultilingualString;
            
            if (!multilingual[targetLanguage]?.trim()) {
              const translated = await translateMultilingualField(multilingual, targetLanguage);
              if (translated) {
                newContent[field] = {
                  ...multilingual,
                  [targetLanguage]: translated,
                };
                translatedCount++;
                onProgress?.(Math.round((translatedCount / totalToTranslate) * 100));
              }
            }
          }
        }

        translatedBlocks[i] = { ...block, content: newContent };
      }

      if (translatedCount > 0) {
        toast.success(t('ai.translationSuccess', 'Контент переведён'));
      }
    } catch (error) {
      console.error('Block translation error:', error);
      toast.error(t('ai.translationError', 'Ошибка перевода'));
    } finally {
      setIsTranslating(false);
    }

    return translatedBlocks;
  }, [translateMultilingualField, t]);

  return {
    isTranslating,
    translateText,
    translateMultilingualField,
    translateBlocks,
  };
}
