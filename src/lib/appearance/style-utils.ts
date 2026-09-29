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
 * Resolve the base page background stored by legacy themes and newer presets.
 * A custom background is rendered in a separate layer, so this remains visible
 * below transparent patterns and while an image is loading.
 */
export function getThemeBackgroundStyle(theme?: Partial<PageTheme>): CSSProperties {
  const background = theme?.backgroundGradient || theme?.backgroundColor;

  if (!background) return {};

  return background.includes('gradient(')
    ? { background }
    : { backgroundColor: background };
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
  // Independent accent slots (fall back to accentColor at render time via var()).
  const btn = t.accentButton ?? t.accentColor;
  if (btn) {
    vars['--lm-accent-button'] = btn;
    vars['--lm-accent-button-fg'] = getContrastForeground(btn);
  }
  const link = t.accentLink ?? t.accentColor;
  if (link) {
    vars['--lm-accent-link'] = link;
    vars['--lm-accent-link-fg'] = getContrastForeground(link);
  }
  const active = t.accentActive ?? t.accentColor;
  if (active) {
    vars['--lm-accent-active'] = active;
    vars['--lm-accent-active-fg'] = getContrastForeground(active);
  }
  return vars as CSSProperties;
}

/**
 * Return '#0b0b0b' or '#ffffff' — whichever gives better contrast
 * against the given color (WCAG relative luminance).
 * Accepts hex (#rgb/#rrggbb) and rgb()/rgba().
 */
export function getContrastForeground(color: string): string {
  const L = getRelativeLuminance(color);
  if (L === null) return '#0b0b0b';
  return L > 0.5 ? '#0b0b0b' : '#ffffff';
}

/** Returns a WCAG contrast ratio when both values are parseable colors. */
export function getContrastRatio(foreground: string, background: string): number | null {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  if (foregroundLuminance === null || backgroundLuminance === null) return null;
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(color: string): number | null {
  const rgb = parseColor(color);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(p => parseFloat(p.trim()));
    if (parts.length >= 3) return [parts[0], parts[1], parts[2]];
  }
  const hsl = parseHsl(s);
  if (hsl) return hslToRgb(hsl[0], hsl[1], hsl[2]);
  return null;
}

/** Parses `hsl(220 15% 12%)`, `hsl(220, 15%, 12%)` and bare `220 15% 12%`. */
function parseHsl(c: string): [number, number, number] | null {
  const inner = c.match(/^hsla?\(([^)]+)\)$/i)?.[1] ?? (/^[\d.]+(deg)?\s+[\d.]+%\s+[\d.]+%/.test(c) ? c : null);
  if (!inner) return null;
  const parts = inner.split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const h = parseFloat(parts[0]);
  const sat = parseFloat(parts[1]);
  const light = parseFloat(parts[2]);
  if ([h, sat, light].some(Number.isNaN)) return null;
  return [h, sat, light];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

/**
 * Convert any supported color (hex, rgb(), hsl()) to the `H S% L%` triplet
 * format used by the app's Tailwind tokens (`hsl(var(--primary))`).
 */
export function toHslTriplet(color: string | undefined | null): string | null {
  if (!color) return null;
  const direct = parseHsl(color.trim());
  if (direct) return `${direct[0]} ${direct[1]}% ${direct[2]}%`;
  const rgb = parseColor(color);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(v => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let sat = 0;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return `${Math.round(h)} ${Math.round(sat * 100)}% ${Math.round(l * 100)}%`;
}

/** True when the color is dark enough that light text/cards are needed. */
export function isDarkColor(color: string | undefined | null): boolean {
  if (!color) return false;
  const L = getRelativeLuminance(color);
  return L !== null && L < 0.2;
}

const LEGACY_FONT_STACKS: Record<string, string> = {
  sans: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
  serif: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
};

/** Button shape from theme.buttonStyle (applies to Button and Link blocks). */
const BUTTON_RADIUS: Record<string, string> = {
  default: '8px',
  rounded: '14px',
  pill: '9999px',
  gradient: '14px',
};

export interface PageThemeScope {
  className: string;
  style: CSSProperties;
  isDark: boolean;
}

/**
 * Everything a page theme contributes to the element that wraps the page —
 * the public page root AND the editor canvas use this, so what the owner
 * sees in the editor is what visitors get.
 *
 * Besides the --lm-* appearance variables it re-points the app tokens that
 * blocks are built with: `--primary` follows the accent (so every CTA —
 * forms, pricing, products — uses it, not only Button/Link), `--foreground`
 * follows the text color, and dark themes switch the scope to `.dark` so
 * cards and muted text stay readable.
 */
export function getPageThemeScope(theme?: Partial<PageTheme>): PageThemeScope {
  const t = theme ?? {};
  const style: Record<string, string> = { ...(getPublicPageCssVars(t) as Record<string, string>) };

  // Legacy font setting only applies when no font pair was chosen
  if (!t.fontPair && t.fontFamily && t.fontFamily !== 'sans' && LEGACY_FONT_STACKS[t.fontFamily]) {
    style['--lm-heading-font'] = LEGACY_FONT_STACKS[t.fontFamily];
    style['--lm-body-font'] = LEGACY_FONT_STACKS[t.fontFamily];
  }

  const accent = t.accentButton ?? t.accentColor;
  const accentTriplet = toHslTriplet(accent);
  if (accent && accentTriplet) {
    style['--primary'] = accentTriplet;
    style['--ring'] = accentTriplet;
    const fg = toHslTriplet(getContrastForeground(accent));
    if (fg) style['--primary-foreground'] = fg;
  }

  const background = t.backgroundColor;
  const isDark = t.darkMode === true || isDarkColor(background) || isDarkColor(t.customBackground?.type === 'solid' ? t.customBackground.value : undefined);

  const textTriplet = toHslTriplet(t.textColor);
  if (t.textColor && textTriplet) {
    style['--foreground'] = textTriplet;
    style['--card-foreground'] = textTriplet;
    style.color = t.textColor;
  }

  if (t.buttonStyle) {
    style['--lm-button-radius'] = BUTTON_RADIUS[t.buttonStyle] ?? BUTTON_RADIUS.rounded;
    if (t.buttonStyle === 'gradient') {
      const from = accent || 'hsl(var(--primary))';
      style['--lm-button-bg'] = `linear-gradient(135deg, ${from}, color-mix(in srgb, ${from} 55%, #7c3aed))`;
    }
  }

  const className = [
    // Page base tokens (frozen): keeps a page identical in the app's editor
    // and on its public URL, whatever the LinkMAX interface theme is.
    'lm-page',
    'lm-typography',
    getAppearanceRootClass(t),
    `lm-anim-${t.animationStyle ?? 'gentle'}`,
    isDark ? 'dark' : '',
  ].filter(Boolean).join(' ');

  return { className, style: style as CSSProperties, isDark };
}

/** Hover behavior class for the page scope. */
export function getAppearanceRootClass(theme?: Partial<PageTheme>): string {
  const t = theme ?? {};
  return `lm-hover-${t.blockHover ?? 'lift'}`;
}

/**
 * Divider class for the block stack (GridBlocksRenderer root). It must not be
 * put on the page root: its direct children are background layers, so lines
 * used to appear at the top of the page instead of between blocks.
 */
export function getDividerClass(theme?: Partial<PageTheme>): string {
  return `lm-divider-${theme?.divider ?? 'none'}`;
}
