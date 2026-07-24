/**
 * Block styling utilities
 * Applies custom colors, fonts, text effects, borders, shadows, padding,
 * content alignment and hover effects to blocks.
 */

import type { BlockStyle, BlockFontFamily } from '@/types/page';

export const getFontClass = (font?: BlockFontFamily): string => {
  switch (font) {
    case 'sans': return 'font-sans';
    case 'serif': return 'font-serif';
    case 'mono': return 'font-mono';
    case 'display': return 'font-sans font-bold tracking-tight';
    case 'rounded': return 'font-sans';
    default: return '';
  }
};

export const getFontStyle = (font?: BlockFontFamily): React.CSSProperties => {
  switch (font) {
    case 'sans': return { fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' };
    case 'serif': return { fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' };
    case 'mono': return { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' };
    case 'display': return { fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontWeight: 700, letterSpacing: '-0.025em' };
    case 'rounded': return { fontFamily: '"SF Pro Rounded", ui-sans-serif, system-ui, sans-serif' };
    default: return {};
  }
};

/**
 * Get text effect CSS class
 */
export const getTextEffectClass = (effect?: BlockStyle['textEffect']): string => {
  switch (effect) {
    case 'shimmer': return 'text-effect-shimmer';
    case 'glow': return 'text-effect-glow';
    case 'pulse': return 'text-effect-pulse';
    case 'blink': return 'text-effect-blink';
    case 'rainbow': return 'text-effect-rainbow';
    case 'neon': return 'text-effect-neon';
    case 'typewriter': return 'text-effect-typewriter';
    case 'gradient-flow': return 'text-effect-gradient-flow';
    default: return '';
  }
};

// ----- Mappings -----

const RADIUS_PX: Record<NonNullable<BlockStyle['borderRadius']>, string> = {
  none: '0px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  full: '9999px',
};

const BORDER_WIDTH_PX: Record<NonNullable<BlockStyle['borderWidth']>, string> = {
  none: '0px',
  thin: '1px',
  medium: '2px',
  thick: '3px',
};

const SHADOW_CSS: Record<NonNullable<BlockStyle['shadow']>, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.12), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  glow: '0 0 24px 2px hsl(var(--primary) / 0.45)',
};

const PADDING_PX: Record<NonNullable<BlockStyle['padding']>, string> = {
  none: '0px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

const HOVER_CLASS: Record<NonNullable<BlockStyle['hoverEffect']>, string> = {
  none: '',
  scale: 'transition-transform duration-200 hover:scale-[1.02]',
  lift: 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
  glow: 'transition-shadow duration-200 hover:shadow-[0_0_24px_2px_hsl(var(--primary)/0.45)]',
  fade: 'transition-opacity duration-200 hover:opacity-80',
};

export interface BlockStyleResult {
  style: React.CSSProperties;
  className: string;
  textEffectClass: string;
}

/**
 * CONTAINER styles: background, border, padding, radius, shadow, hover.
 * Applied ONCE by BlockRenderer to the outer wrapper — never by leaf blocks
 * (avoids double frames/padding).
 */
export function getBlockStyles(blockStyle?: BlockStyle): BlockStyleResult {
  if (!blockStyle) {
    return { style: {}, className: '', textEffectClass: '' };
  }

  const style: React.CSSProperties = {};
  const classes: string[] = [];

  if (blockStyle.backgroundColor) style.backgroundColor = blockStyle.backgroundColor;
  if (blockStyle.backgroundGradient) style.backgroundImage = blockStyle.backgroundGradient;

  if (blockStyle.borderRadius) style.borderRadius = RADIUS_PX[blockStyle.borderRadius];

  if (blockStyle.borderWidth && blockStyle.borderWidth !== 'none') {
    style.borderWidth = BORDER_WIDTH_PX[blockStyle.borderWidth];
    style.borderStyle = 'solid';
    style.borderColor = blockStyle.borderColor || '#e5e7eb';
  }

  if (blockStyle.shadow && blockStyle.shadow !== 'none') {
    style.boxShadow = SHADOW_CSS[blockStyle.shadow];
  }

  if (blockStyle.padding && blockStyle.padding !== 'none') {
    style.padding = PADDING_PX[blockStyle.padding];
  }

  if (blockStyle.hoverEffect && blockStyle.hoverEffect !== 'none') {
    classes.push(HOVER_CLASS[blockStyle.hoverEffect]);
  }

  // Note: intentionally NOT forcing overflow:hidden here — it would clip
  // hover effects like scale/lift that extend past the wrapper.

  const textEffectClass = getTextEffectClass(blockStyle.textEffect);

  return { style, className: classes.join(' '), textEffectClass };
}

/**
 * INNER styles: color / font-family / text-effect only.
 * Applied by leaf blocks (Text/Button/Link) on the actual text element.
 * Never returns background/border/padding/radius/shadow — those live on the wrapper.
 */
export function getBlockInnerStyles(blockStyle?: BlockStyle): BlockStyleResult {
  if (!blockStyle) return { style: {}, className: '', textEffectClass: '' };
  const style: React.CSSProperties = {};
  if (blockStyle.textColor) style.color = blockStyle.textColor;
  if (blockStyle.fontFamily) Object.assign(style, getFontStyle(blockStyle.fontFamily));
  return { style, className: '', textEffectClass: getTextEffectClass(blockStyle.textEffect) };
}

/**
 * Check if block has custom styling that needs to be applied
 */
export function hasCustomBlockStyle(blockStyle?: BlockStyle): boolean {
  if (!blockStyle) return false;
  return !!(
    blockStyle.backgroundColor ||
    blockStyle.backgroundGradient ||
    blockStyle.textColor ||
    blockStyle.fontFamily ||
    blockStyle.textEffect ||
    (blockStyle.borderRadius && blockStyle.borderRadius !== 'none') ||
    (blockStyle.borderWidth && blockStyle.borderWidth !== 'none') ||
    (blockStyle.shadow && blockStyle.shadow !== 'none') ||
    (blockStyle.padding && blockStyle.padding !== 'none') ||
    (blockStyle.hoverEffect && blockStyle.hoverEffect !== 'none') ||
    blockStyle.contentAlignment
  );
}
