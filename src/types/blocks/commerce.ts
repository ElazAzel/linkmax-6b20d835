import type { I18nText, MultilingualString } from '@/lib/i18n-helpers';
import type { BlockSchedule, BlockStyle, Currency } from './base';

export interface ProductBlock {
    id: string;
    type: 'product';
    name: string | I18nText | MultilingualString;
    description: string | I18nText | MultilingualString;
    price: number;
    currency: Currency;
    image?: string;
    buyLink?: string;
    buttonText?: string | I18nText | MultilingualString;
    alignment?: 'left' | 'center' | 'right';
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

export interface CatalogCategory {
    id: string;
    name: string | I18nText | MultilingualString;
}

export interface CatalogItem {
    id: string;
    name: string | I18nText | MultilingualString;
    description?: string | I18nText | MultilingualString;
    price?: number;
    currency?: Currency;
    image?: string;
    categoryId?: string;
}

export interface CatalogBlock {
    id: string;
    type: 'catalog';
    title?: string | I18nText | MultilingualString;
    categories?: CatalogCategory[];
    items: CatalogItem[];
    layout?: 'list' | 'grid';
    showPrices?: boolean;
    currency?: Currency;
    // isPremium is now managed by block-manifest.ts
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

// Service types for structured data (GEO-ready)
export type ServiceType =
    | 'haircut' | 'consultation' | 'training' | 'manicure'
    | 'lesson' | 'massage' | 'photo' | 'repair'
    | 'cleaning' | 'delivery' | 'coaching' | 'therapy'
    | 'beauty' | 'medical' | 'legal' | 'financial'
    | 'other';

// Pricing Block with structured service data
export interface PricingItem {
    id: string;
    name: string | I18nText | MultilingualString;
    description?: string | I18nText | MultilingualString;
    price: number;
    currency?: Currency;
    period?: string | I18nText | MultilingualString; // e.g., "per hour", "per session"
    featured?: boolean;
    // Structured service data for GEO
    serviceType?: ServiceType;
    duration?: number; // duration in minutes
    priceType?: 'fixed' | 'range' | 'from';
    priceMax?: number; // for range pricing
    isBookable?: boolean; // can be booked via Booking block
    availableDays?: ('weekdays' | 'weekends' | 'everyday' | 'by_appointment')[];
}

export interface PricingBlock {
    id: string;
    type: 'pricing';
    title?: string | I18nText | MultilingualString;
    items: PricingItem[];
    currency?: Currency;
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}

// Booking Block - appointment scheduling
export interface BookingSlot {
    id: string;
    startTime: string;
    endTime: string;
}

export type PrepaymentMethod = 'whatsapp' | 'kaspi' | 'robokassa';

export interface BookingBlock {
    id: string;
    type: 'booking';
    title?: string | I18nText | MultilingualString;
    description?: string | I18nText | MultilingualString;
    workingHoursStart?: number;
    workingHoursEnd?: number;
    slotDuration?: number;
    slots?: BookingSlot[];
    disabledWeekdays?: number[];
    maxBookingDays?: number;
    requirePhone?: boolean;
    requireEmail?: boolean;
    requirePrepayment?: boolean;
    prepaymentMethod?: PrepaymentMethod;
    prepaymentPhone?: string; // WhatsApp phone for payment
    kaspiPhone?: string; // Kaspi phone for QR payment
    prepaymentAmount?: number;
    prepaymentCurrency?: Currency;
    // Telegram notification settings
    dailyReminderEnabled?: boolean;
    dailyReminderTime?: string;
    weeklyMotivationEnabled?: boolean;
    // Google Calendar Sync
    gcalSyncEnabled?: boolean;
    buttonText?: string | I18nText | MultilingualString;
    // isPremium is now managed by block-manifest.ts
    schedule?: BlockSchedule;
    blockStyle?: BlockStyle;
}
