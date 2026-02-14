/**
 * Language context types
 * Safe types for translation operations
 */

import type { SupportedLanguage, MultilingualString } from '@/lib/i18n-helpers';

export interface TranslatableObject {
  [key: string]: unknown | MultilingualString | TranslatableObject[];
}

export interface BlockContent {
  [key: string]: unknown;
}

export interface TranslatedBlock {
  id?: string;
  content?: BlockContent | unknown;
  [key: string]: unknown;
}

export type LanguageCode = 'ru' | 'en' | 'kk' | 'kz';
