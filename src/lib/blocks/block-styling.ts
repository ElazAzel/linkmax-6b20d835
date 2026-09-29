/**
 * Block styling utilities
 * Applies custom colors, fonts, text effects, borders, shadows, padding,
 * content alignment and hover effects to blocks.
 */

import type { BlockStyle } from '@/types/page';
import {
  BLOCK_BORDER_WIDTH,
  BLOCK_HOVER_CLASS,
  BLOCK_PADDING,
  BLOCK_RADIUS,
  BLOCK_SHADOW,
  getFontStyle,
  getTextEffectClass,
} from '@/lib/appearance/block-appearance';

// Single source of truth lives in block-appearance (shared by the public grid
// and the editor canvas); re-exported here for existing imports.
export { getFontClass, getFontStyle, getTextEffectClass } from '@/lib/appearance/block-appearance';

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

  if (blockStyle.borderRadius) style.borderRadius = BLOCK_RADIUS[blockStyle.borderRadius];

  if (blockStyle.borderWidth && blockStyle.borderWidth !== 'none') {
    style.borderWidth = BLOCK_BORDER_WIDTH[blockStyle.borderWidth];
    style.borderStyle = 'solid';
    style.borderColor = blockStyle.borderColor || '#e5e7eb';
  }

  if (blockStyle.shadow && blockStyle.shadow !== 'none') {
    style.boxShadow = BLOCK_SHADOW[blockStyle.shadow];
  }

  if (blockStyle.padding && blockStyle.padding !== 'none') {
    style.padding = BLOCK_PADDING[blockStyle.padding];
  }

  if (blockStyle.hoverEffect && blockStyle.hoverEffect !== 'none') {
    classes.push(BLOCK_HOVER_CLASS[blockStyle.hoverEffect]);
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

/**
 * True when the user has customized the block's *container* (bg / border /
 * radius / shadow / padding). In that case, media/embed blocks should render
 * "naked" — without their default decorative frame — so the wrapper's style
 * is the only frame the user sees (avoids double borders/paddings).
 */
export function hasCustomBlockContainer(blockStyle?: BlockStyle): boolean {
  if (!blockStyle) return false;
  return !!(
    blockStyle.backgroundColor ||
    blockStyle.backgroundGradient ||
    (blockStyle.borderRadius && blockStyle.borderRadius !== 'none') ||
    (blockStyle.borderWidth && blockStyle.borderWidth !== 'none') ||
    (blockStyle.shadow && blockStyle.shadow !== 'none') ||
    (blockStyle.padding && blockStyle.padding !== 'none')
  );
}
