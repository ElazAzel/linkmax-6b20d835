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
  }
  return vars as CSSProperties;
}

/** class combining hover + divider behavior on the root */
export function getAppearanceRootClass(theme?: Partial<PageTheme>): string {
  const t = theme ?? {};
  const hover = t.blockHover ?? 'lift';
  const divider = t.divider ?? 'none';
  return `lm-hover-${hover} lm-divider-${divider}`;
}
