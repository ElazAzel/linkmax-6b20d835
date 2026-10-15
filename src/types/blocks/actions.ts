import type { I18nText, MultilingualString } from '@/lib/i18n-helpers';
import type { BlockSchedule, BlockStyle } from './base';

export interface ButtonBlock {
    id: string;
    type: 'button';
    title: string | I18nText | MultilingualString;
    url: string;
    background?: {
        type: 'solid' | 'gradient' | 'image';
        value: string;
        gradientAngle?: number;
        overlay?: 'none' | 'light' | 'dark' | 'custom';
        overlayOpacity?: number;
    };
    hoverEffect?: 'glow' | 'scale' | 'shadow' | 'none';
    alignment?: 'left' | 'center' | 'right';
    width?: 'full' | 'medium' | 'small' | 'large' | 'auto';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export interface SocialsBlock {
    id: string;
    type: 'socials';
    title?: string | I18nText | MultilingualString;
    platforms: Array<{
        id?: string;
        name?: string;
        url: string;
        icon?: string;
        platform?: string; // For compatibility with Editor
        /** Owner-provided icon image; replaces the automatic brand icon. */
        customIconUrl?: string;
    }>;
    alignment?: 'left' | 'center' | 'right';
    /** 'theme' (default): icons in the page text colour; 'brand': brand colours; 'outline'. */
    iconStyle?: 'theme' | 'brand' | 'outline' | 'black' | 'white';
    /** 'grid' (default): a row of icons; 'list': rows with icon and name. */
    layout?: 'grid' | 'list';
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export interface MessengerBlock {
    id: string;
    type: 'messenger';
    title?: string | I18nText | MultilingualString;
    messengers: Array<{
        platform: 'whatsapp' | 'telegram' | 'viber' | 'wechat';
        username: string;
        message?: string;
    }>;
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}
