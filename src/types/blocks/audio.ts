import type { I18nText, MultilingualString } from '@/lib/i18n-helpers';
import type { BlockSchedule, BlockStyle } from './base';

export interface AudioBlock {
  id: string;
  type: 'audio';
  title: string | I18nText | MultilingualString;
  description?: string | I18nText | MultilingualString;
  sourceType?: 'file' | 'external';
  fileUrl?: string;
  externalUrl?: string;
  coverUrl?: string;
  blockStyle?: BlockStyle;
  schedule?: BlockSchedule;
}
