// Editor mode is now always 'grid'
export type EditorMode = 'grid';

// Multilingual string support
import type { I18nText, MultilingualString } from '@/lib/i18n-helpers';

export type Currency = 'KZT' | 'RUB' | 'BYN' | 'AMD' | 'AZN' | 'KGS' | 'TJS' | 'TMT' | 'UZS' | 'USD' | 'EUR' | 'GBP' | 'CNY' | 'JPY' | 'CHF' | 'CAD' | 'AUD';

// Font families that support RU/EN/KK
export type BlockFontFamily = 'sans' | 'serif' | 'mono' | 'display' | 'rounded';

// Extended style system for all blocks
export interface BlockStyle {
    // Spacing
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

    // Border
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    borderWidth?: 'none' | 'thin' | 'medium' | 'thick';
    borderColor?: string;

    // Shadow
    shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';

    // Background
    backgroundColor?: string;
    backgroundGradient?: string;
    backgroundOpacity?: number;

    // Text styling
    textColor?: string;
    fontFamily?: BlockFontFamily;

    // Text effects (like Taplink)
    textEffect?: 'none' | 'shimmer' | 'glow' | 'pulse' | 'blink' | 'rainbow' | 'neon' | 'typewriter' | 'gradient-flow';

    // Content alignment (vertical)
    contentAlignment?: 'top' | 'center' | 'bottom';

    // Animation
    hoverEffect?: 'none' | 'scale' | 'glow' | 'lift' | 'fade';
    animation?: 'none' | 'fade-in' | 'slide-up' | 'scale-in' | 'bounce';
    animationDelay?: number; // in milliseconds (0-2000)
    animationSpeed?: 'slow' | 'normal' | 'fast'; // slow: 0.8s, normal: 0.5s, fast: 0.3s

    // Paid content access (coming soon)
    isPaidContent?: boolean;
    paidContentPrice?: number;
    paidContentCurrency?: Currency;
}

export interface BlockSchedule {
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
}

// Block size presets - optimized for mobile-first responsive grid
// gridCols: 1 = full width, 2 = half width (2 per row max)
export type BlockSizePreset =
    | 'full'        // Full width block
    | 'half';       // Half width block (2 per row)

export const BLOCK_SIZE_DIMENSIONS: Record<BlockSizePreset, { gridCols: 1 | 2 }> = {
    'full': { gridCols: 1 },
    'half': { gridCols: 2 },
};

// Grid layout data for blocks
export interface GridLayoutData {
    gridColumn?: number;    // starting column (1-based)
    gridRow?: number;       // starting row (1-based)
    gridWidth?: number;     // width in cells (1-4)
    gridHeight?: number;    // height in cells (1-4)
}

// Base block type with optional grid layout
export interface BlockGridProps {
    gridLayout?: GridLayoutData;
    blockSize?: BlockSizePreset;
    createdAt?: string;
}

export type BlockType = 'profile' | 'link' | 'button' | 'socials' | 'text' | 'image' | 'product' | 'video' | 'carousel' | 'custom_code' | 'messenger' | 'form' | 'download' | 'newsletter' | 'testimonial' | 'scratch' | 'map' | 'avatar' | 'separator' | 'catalog' | 'before_after' | 'faq' | 'countdown' | 'pricing' | 'shoutout' | 'booking' | 'community' | 'event';
