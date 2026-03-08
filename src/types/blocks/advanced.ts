import type { I18nText, MultilingualString } from '@/lib/i18n-helpers';
import type { BlockSchedule, BlockStyle } from './base';

export interface CustomCodeBlock {
    id: string;
    type: 'custom_code';
    title?: string | I18nText | MultilingualString;
    html: string;
    css?: string;
    javascript?: string;
    height?: 'auto' | 'small' | 'medium' | 'large' | 'full';
    enableInteraction?: boolean;
    // isPremium is now managed by block-manifest.ts, not in type interface
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export interface FormBlock {
    id: string;
    type: 'form';
    title: string | I18nText | MultilingualString;
    fields: Array<{
        name: string | I18nText | MultilingualString;
        type: 'text' | 'email' | 'phone' | 'textarea';
        required: boolean;
        placeholder?: string | I18nText | MultilingualString;
    }>;
    submitEmail: string;
    buttonText: string | I18nText | MultilingualString;
    // isPremium is now managed by block-manifest.ts
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export interface DownloadBlock {
    id: string;
    type: 'download';
    title: string | I18nText | MultilingualString;
    description?: string | I18nText | MultilingualString;
    fileUrl: string;
    fileName: string;
    fileSize?: string;
    icon?: string;
    buttonText?: string | I18nText | MultilingualString;
    alignment?: 'left' | 'center' | 'right';
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export interface ScratchBlock {
    id: string;
    type: 'scratch';
    title?: string | I18nText | MultilingualString;
    revealText: string | I18nText | MultilingualString;
    scratchImage?: string;
    backgroundColor?: string;
    isPremium: true;
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}
