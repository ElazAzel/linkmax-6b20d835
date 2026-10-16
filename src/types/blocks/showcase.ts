import type { I18nText, MultilingualString } from '@/lib/i18n-helpers';
import type { BlockSchedule, BlockStyle } from './base';

type Text = string | I18nText | MultilingualString;

/** Korner-style card: title, text, a photo beside or above it, one button. */
export interface CardBlock {
  id: string;
  type: 'card';
  title: Text;
  text?: Text;
  image?: string;
  imagePosition?: 'right' | 'top';
  buttonText?: Text;
  url?: string;
  buttonStyle?: 'solid' | 'outline';
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}

export interface TileItem {
  id: string;
  title?: Text;
  image?: string;
  url?: string;
}

/** Grid of picture tiles, each one a link with a caption over the photo. */
export interface TilesBlock {
  id: string;
  type: 'tiles';
  title?: Text;
  items: TileItem[];
  columns?: 2 | 3;
  aspect?: 'square' | 'portrait';
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
}
