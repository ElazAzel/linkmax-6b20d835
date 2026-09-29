import { useEffect } from 'react';
import type { PageTheme } from '@/types/page';
import { getFontPair } from '@/lib/appearance/presets';

/**
 * Loads the web fonts of the page's font pair.
 *
 * index.html only ships Inter and Manrope, so 13 of the 15 families offered
 * in the theme panel silently fell back to system fonts. Each family gets its
 * own <link>: the css2 API rejects the whole request if one family lacks a
 * requested weight, so weights are listed per family.
 */
const GOOGLE_FONT_WEIGHTS: Record<string, string> = {
  'Space Grotesk': '400;500;600;700',
  'DM Sans': '400;500;700',
  'Instrument Serif': '400',
  'Work Sans': '400;500;600;700',
  'Cormorant Garamond': '400;500;600;700',
  Karla: '400;500;700',
  Syne: '400;600;700',
  'Plus Jakarta Sans': '400;500;600;700',
  Urbanist: '400;600;700',
  Epilogue: '400;500;700',
  Outfit: '400;500;600;700',
  Figtree: '400;500;600;700',
  'JetBrains Mono': '400;500;700',
  'Archivo Black': '400',
  Hind: '400;500;600;700',
};

/** Families already loaded globally by index.html. */
const PRELOADED = new Set(['Inter', 'Manrope']);

/** First quoted family of a CSS font stack: "'Syne', system-ui" → "Syne". */
export function primaryFamily(stack: string | undefined): string | null {
  if (!stack) return null;
  const match = stack.match(/^\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

export function googleFontsHref(family: string): string | null {
  const weights = GOOGLE_FONT_WEIGHTS[family];
  if (!weights) return null;
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@${weights}&display=swap`;
}

export function getPageFontHrefs(theme?: Partial<PageTheme> | null): string[] {
  if (!theme?.fontPair) return [];
  const pair = getFontPair(theme.fontPair);
  const families = [primaryFamily(pair.heading), primaryFamily(pair.body)]
    .filter((family): family is string => !!family && !PRELOADED.has(family));
  return [...new Set(families)]
    .map(googleFontsHref)
    .filter((href): href is string => !!href);
}

export function usePageFonts(theme?: Partial<PageTheme> | null) {
  const hrefs = getPageFontHrefs(theme).join('|');

  useEffect(() => {
    if (!hrefs || typeof document === 'undefined') return;
    for (const href of hrefs.split('|')) {
      if (document.head.querySelector(`link[data-lm-font="${href}"]`)) continue;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.lmFont = href;
      document.head.appendChild(link);
    }
    // Links are kept: switching back to a font is instant, and the editor and
    // the public page share them.
  }, [hrefs]);
}
