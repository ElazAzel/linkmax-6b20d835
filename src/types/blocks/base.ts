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
// gridCols: 1 = 1 column (half width on mobile/desktop 2-col grid), 2 = 2 columns (full width)
// gridRows: 1 = standard height, 2 = double height
export type BlockSizePreset =
    | 'small'       // 1x1 (was 'half' logic, but explicit 1x1)
    | 'wide'        // 2x1 (was 'full' logic)
    | 'tall'        // 1x2
    | 'large'       // 2x2
    | 'full'        // Legacy alias for 'wide'
    | 'half';       // Legacy alias for 'small'

export const BLOCK_SIZE_DIMENSIONS: Record<BlockSizePreset, { gridCols: 1 | 2; gridRows: 1 | 2 }> = {
    'small': { gridCols: 1, gridRows: 1 },
    'wide': { gridCols: 2, gridRows: 1 },
    'tall': { gridCols: 1, gridRows: 2 },
    'large': { gridCols: 2, gridRows: 2 },
    // Legacy mapping
    'full': { gridCols: 2, gridRows: 1 },
    'half': { gridCols: 1, gridRows: 1 },
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
    experimentId?: string; // For A/B testing tracking
    variantLabel?: string; // For A/B testing tracking
}

export type BlockType = 'profile' | 'link' | 'button' | 'socials' | 'text' | 'image' | 'product' | 'video' | 'carousel' | 'custom_code' | 'messenger' | 'form' | 'download' | 'newsletter' | 'testimonial' | 'scratch' | 'map' | 'avatar' | 'separator' | 'catalog' | 'before_after' | 'faq' | 'countdown' | 'pricing' | 'shoutout' | 'booking' | 'community' | 'event';
