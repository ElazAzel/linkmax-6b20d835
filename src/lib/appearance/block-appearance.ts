/**
 * Block appearance — the single mapping from BlockStyle to CSS.
 *
 * The public grid (GridBlocksRenderer), the editor canvas (GridEditor) and
 * BlockRenderer used to keep their own radius/shadow/padding tables (e.g. a
 * "large" radius was 28px on the public page and 16px in the editor), so the
 * editor never showed what visitors saw. Everything reads these maps now.
 */
import type { CSSProperties } from 'react';
import type { Block, BlockStyle, BlockFontFamily } from '@/types/page';
import { toHslTriplet } from './style-utils';

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

export const getFontStyle = (font?: BlockFontFamily): CSSProperties => {
  switch (font) {
    case 'sans': return { fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' };
    case 'serif': return { fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' };
    case 'mono': return { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' };
    case 'display': return { fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontWeight: 700, letterSpacing: '-0.025em' };
    case 'rounded': return { fontFamily: '"SF Pro Rounded", ui-sans-serif, system-ui, sans-serif' };
    default: return {};
  }
};

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

export const BLOCK_RADIUS: Record<NonNullable<BlockStyle['borderRadius']>, string> = {
  none: '0px',
  sm: '10px',
  md: '16px',
  lg: '24px',
  full: '9999px',
};

export const BLOCK_BORDER_WIDTH: Record<NonNullable<BlockStyle['borderWidth']>, string> = {
  none: '0px',
  thin: '1px',
  medium: '2px',
  thick: '3px',
};

export const BLOCK_SHADOW: Record<NonNullable<BlockStyle['shadow']>, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.12), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  glow: '0 0 24px 2px hsl(var(--primary) / 0.45)',
};

export const BLOCK_PADDING: Record<NonNullable<BlockStyle['padding']>, string> = {
  none: '0px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

export const BLOCK_HOVER_CLASS: Record<NonNullable<BlockStyle['hoverEffect']>, string> = {
  none: '',
  scale: 'transition-transform duration-200 hover:scale-[1.02]',
  lift: 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
  glow: 'transition-shadow duration-200 hover:shadow-[0_0_24px_2px_hsl(var(--primary)/0.45)]',
  fade: 'transition-opacity duration-200 hover:opacity-80',
};

/**
 * Blocks that paint their own surface (the <button>/<a>/quote element) with
 * the user's container style. Their grid cell must not paint it again —
 * that produced a frame inside a frame.
 */
export const SELF_STYLED_BLOCK_TYPES = new Set(['button', 'link', 'text']);

/** Blocks rendered without card chrome. */
export const TRANSPARENT_BLOCK_TYPES = new Set(['separator', 'socials', 'spacer']);

export function hasCustomBackground(style?: BlockStyle): boolean {
  return !!(style?.backgroundColor || style?.backgroundGradient);
}

export interface BlockCellAppearance {
  style: CSSProperties;
  className: string;
  /** Class for the text-effect wrapper (shimmer, glow, …). */
  textEffectClass: string;
  hasCustomBackground: boolean;
}

/**
 * Resolve the visual style of a block's grid cell.
 *
 * - radius/shadow fall back to the page theme (`--lm-block-radius/-shadow`)
 * - text color / font apply to every block type: text color re-points the
 *   `--foreground` token inside the cell, so blocks built with
 *   `text-foreground`/`text-muted-foreground` follow it too
 * - self-styled blocks keep only the text settings on the cell
 */
export function resolveBlockCellAppearance(
  block: Pick<Block, 'type' | 'blockStyle'>,
  mergedStyle?: BlockStyle,
): BlockCellAppearance {
  const bs = mergedStyle ?? block.blockStyle ?? {};
  const selfStyled = SELF_STYLED_BLOCK_TYPES.has(block.type);
  const style: Record<string, string> = {};
  const classes: string[] = [];

  if (!selfStyled) {
    if (bs.backgroundColor) style.backgroundColor = bs.backgroundColor;
    if (bs.backgroundGradient) style.backgroundImage = bs.backgroundGradient;
    style.borderRadius = bs.borderRadius ? BLOCK_RADIUS[bs.borderRadius] : 'var(--lm-block-radius, 16px)';
    style.boxShadow = bs.shadow ? BLOCK_SHADOW[bs.shadow] : 'var(--lm-block-shadow, 0 1px 3px rgb(0 0 0 / 0.08))';
    if (bs.borderWidth && bs.borderWidth !== 'none') {
      style.borderWidth = BLOCK_BORDER_WIDTH[bs.borderWidth];
      style.borderStyle = 'solid';
      style.borderColor = bs.borderColor || 'hsl(var(--border))';
    }
    if (bs.padding && bs.padding !== 'none') style.padding = BLOCK_PADDING[bs.padding];
    if (bs.hoverEffect && bs.hoverEffect !== 'none') classes.push(BLOCK_HOVER_CLASS[bs.hoverEffect]);
  } else {
    // The cell still follows the theme shape so the card around a button
    // matches its neighbours.
    style.borderRadius = 'var(--lm-block-radius, 16px)';
    style.boxShadow = 'var(--lm-block-shadow, 0 1px 3px rgb(0 0 0 / 0.08))';
  }

  if (bs.textColor) {
    style.color = bs.textColor;
    const triplet = toHslTriplet(bs.textColor);
    if (triplet) {
      style['--foreground'] = triplet;
      style['--card-foreground'] = triplet;
      style['--muted-foreground'] = triplet;
    }
  }
  if (bs.fontFamily) Object.assign(style, getFontStyle(bs.fontFamily));

  return {
    style: style as CSSProperties,
    className: classes.join(' '),
    // Self-styled blocks apply the effect on their own text element
    textEffectClass: selfStyled ? '' : getTextEffectClass(bs.textEffect),
    hasCustomBackground: hasCustomBackground(bs),
  };
}
