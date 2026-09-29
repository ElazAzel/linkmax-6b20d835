import { describe, expect, it } from 'vitest';
import { FONT_PAIR_PRESETS, THEME_PRESETS } from '@/lib/appearance/presets';
import { getPageFontHrefs, primaryFamily } from '../usePageFonts';

const PRELOADED = new Set(['Inter', 'Manrope']);

describe('usePageFonts', () => {
  it('knows how to load every family offered in the theme panel', () => {
    for (const pair of FONT_PAIR_PRESETS) {
      for (const stack of [pair.heading, pair.body]) {
        const family = primaryFamily(stack);
        if (!family || PRELOADED.has(family)) continue;
        const hrefs = getPageFontHrefs({ fontPair: pair.id });
        // A family without a weight entry silently falls back to system fonts.
        expect(hrefs.some((href) => href.includes(encodeURIComponent(family).replace(/%20/g, '+'))), `${pair.id}: ${family}`).toBe(true);
      }
    }
  });

  it('theme presets only reference existing font pairs', () => {
    const ids = new Set(FONT_PAIR_PRESETS.map((pair) => pair.id));
    for (const preset of THEME_PRESETS) {
      if (preset.theme.fontPair) expect(ids.has(preset.theme.fontPair), preset.id).toBe(true);
    }
  });
});
