import type { I18nText, MultilingualString } from '@/lib/i18n-helpers';
import type { BlockSchedule, BlockStyle } from './base';

export interface NewsletterBlock {
    id: string;
    type: 'newsletter';
    title: string | I18nText | MultilingualString;
    description?: string | I18nText | MultilingualString;
    buttonText: string | I18nText | MultilingualString;
    apiEndpoint?: string;
    isPremium: true;
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export interface TestimonialBlock {
    id: string;
    type: 'testimonial';
    title?: string | I18nText | MultilingualString;
    testimonials: Array<{
        name: string | I18nText | MultilingualString;
        text: string | I18nText | MultilingualString;
        rating?: number;
        avatar?: string;
        role?: string | I18nText | MultilingualString;
    }>;
    isPremium: true;
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

// Countdown Timer Block
export interface CountdownBlock {
    id: string;
    type: 'countdown';
    title?: string | I18nText | MultilingualString;
    targetDate: string; // ISO date string
    expiredText?: string | I18nText | MultilingualString;
    showDays?: boolean;
    showHours?: boolean;
    showMinutes?: boolean;
    showSeconds?: boolean;
    isPremium: true;
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

// Shoutout Block - recommend other users
export interface ShoutoutBlock {
    id: string;
    type: 'shoutout';
    userId: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    message?: string | I18nText | MultilingualString;
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}
