/**
 * Block styling utilities
 * Applies custom colors, fonts, and text effects to blocks
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

export interface BlockStyleResult {
  style: React.CSSProperties;
  className: string;
  textEffectClass: string;
}

/**
 * Get combined style object and className for a block
 */
export function getBlockStyles(blockStyle?: BlockStyle): BlockStyleResult {
  if (!blockStyle) {
    return { style: {}, className: '', textEffectClass: '' };
  }

  const style: React.CSSProperties = {};
  const classes: string[] = [];

  // Background color
  if (blockStyle.backgroundColor) {
    style.backgroundColor = blockStyle.backgroundColor;
  }

  // Background gradient
  if (blockStyle.backgroundGradient) {
    style.backgroundImage = blockStyle.backgroundGradient;
  }

  // Text color
  if (blockStyle.textColor) {
    style.color = blockStyle.textColor;
  }

  // Font family
  if (blockStyle.fontFamily) {
    Object.assign(style, getFontStyle(blockStyle.fontFamily));
  }

  // Background opacity
  if (blockStyle.backgroundOpacity !== undefined) {
    style.opacity = blockStyle.backgroundOpacity;
  }

  // Text effect class
  const textEffectClass = getTextEffectClass(blockStyle.textEffect);

  return {
    style,
    className: classes.join(' '),
    textEffectClass,
  };
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
    blockStyle.textEffect
  );
}
