/**
 * Style utils bridging PageTheme → runtime CSS.
 * Applied on both PublicPage and editor preview.
 */
import type { CSSProperties } from 'react';
import type { PageTheme, PageBackground } from '@/types/page';
import {
  BLOCK_SHAPE_RADIUS,
  BLOCK_SHADOW_CSS,
  getFontPair,
  PATTERN_PRESETS,
  type PatternId,
} from './presets';

/**
 * Compute background style + optional pattern class from PageBackground.
 * Returns { style, className, overlay } for use on the root element.
 */
export function getBackgroundStyle(bg?: PageBackground): {
  style: CSSProperties;
  className: string;
  overlay?: CSSProperties;
} {
  if (!bg) return { style: {}, className: '' };

  const style: CSSProperties = {};
  let className = '';

  switch (bg.type) {
    case 'solid':
      style.backgroundColor = bg.value;
      break;
    case 'gradient': {
      const colors = bg.value.split(',').map(c => c.trim()).filter(Boolean);
      if (colors.length > 0) {
        style.background = `linear-gradient(${bg.gradientAngle ?? 135}deg, ${colors.join(', ')})`;
      }
      break;
    }
    case 'image':
      if (bg.value) {
        style.backgroundImage = `url(${bg.value})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
        style.backgroundAttachment = bg.behavior === 'fixed' ? 'fixed' : 'scroll';
      }
      break;
    case 'pattern': {
      const preset = PATTERN_PRESETS.find(p => p.id === (bg.value as PatternId));
      if (preset) {
        className = preset.cssClass;
        if (bg.patternColor) {
          (style as Record<string, string>)['--lm-pattern-color'] = bg.patternColor;
        }
        if (bg.patternScale) {
          (style as Record<string, string>)['--lm-pattern-scale'] = String(bg.patternScale);
        }
      }
      break;
    }
  }

  if (bg.blur && bg.type === 'image') {
    style.filter = `blur(${bg.blur}px)`;
  }

  let overlay: CSSProperties | undefined;
  if (bg.overlay && (bg.overlayOpacity ?? 0) > 0) {
    overlay = {
      position: 'absolute',
      inset: 0,
      backgroundColor: bg.overlay,
      opacity: (bg.overlayOpacity ?? 0) / 100,
      pointerEvents: 'none',
      zIndex: 0,
    };
  }

  return { style, className, overlay };
}

/**
 * Compute CSS variables + font-family for the public page root.
 * These variables are consumed by public-appearance.css and blocks.
 */
export function getPublicPageCssVars(theme?: Partial<PageTheme>): CSSProperties {
  const t = theme ?? {};
  const font = getFontPair(t.fontPair);
  const shape = t.blockShape ?? 'rounded';
  const shadow = t.blockShadow ?? 'sm';
  const vars: Record<string, string> = {
    '--lm-block-radius': BLOCK_SHAPE_RADIUS[shape],
    '--lm-block-shadow': BLOCK_SHADOW_CSS[shadow],
    '--lm-heading-font': font.heading,
    '--lm-body-font': font.body,
  };
  if (t.accentColor) {
    vars['--lm-accent'] = t.accentColor;
    // A5: WCAG-aware foreground for anything sitting on the accent color
    vars['--lm-accent-fg'] = getContrastForeground(t.accentColor);
  }
  return vars as CSSProperties;
}

/**
 * Return '#0b0b0b' or '#ffffff' — whichever gives better contrast
 * against the given color (WCAG relative luminance).
 * Accepts hex (#rgb/#rrggbb) and rgb()/rgba().
 */
export function getContrastForeground(color: string): string {
  const rgb = parseColor(color);
  if (!rgb) return '#0b0b0b';
  const [r, g, b] = rgb.map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.5 ? '#0b0b0b' : '#ffffff';
}

function parseColor(c: string): [number, number, number] | null {
  const s = c.trim();
  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3) hex = hex.split('').map(ch => ch + ch).join('');
    if (hex.length !== 6) return null;
    const n = parseInt(hex, 16);
    if (Number.isNaN(n)) return null;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = s.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const parts = m[1].split(',').map(p => parseFloat(p.trim()));
    if (parts.length >= 3) return [parts[0], parts[1], parts[2]];
  }
  return null;
}

/** class combining hover + divider behavior on the root */
export function getAppearanceRootClass(theme?: Partial<PageTheme>): string {
  const t = theme ?? {};
  const hover = t.blockHover ?? 'lift';
  const divider = t.divider ?? 'none';
  return `lm-hover-${hover} lm-divider-${divider}`;
}
