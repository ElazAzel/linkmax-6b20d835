import { describe, it, expect } from 'vitest';
import { getPageThemeScope, toHslTriplet, isDarkColor, getDividerClass, getAppearanceRootClass } from '../style-utils';
import { resolveBlockCellAppearance, BLOCK_RADIUS } from '../block-appearance';
import { getBlockStyles } from '@/lib/blocks/block-styling';
import { getPageFontHrefs, primaryFamily } from '@/hooks/page/usePageFonts';

const vars = (style: unknown) => style as Record<string, string>;

describe('toHslTriplet', () => {
  it('converts hex, rgb and hsl() into the token triplet format', () => {
    expect(toHslTriplet('#ff0000')).toBe('0 100% 50%');
    expect(toHslTriplet('rgb(0, 0, 255)')).toBe('240 100% 50%');
    expect(toHslTriplet('hsl(220 15% 12%)')).toBe('220 15% 12%');
    expect(toHslTriplet('hsl(220, 15%, 12%)')).toBe('220 15% 12%');
    expect(toHslTriplet('not-a-color')).toBeNull();
  });

  it('detects dark backgrounds in any format', () => {
    expect(isDarkColor('hsl(230 30% 8%)')).toBe(true);
    expect(isDarkColor('#101318')).toBe(true);
    expect(isDarkColor('hsl(48 27% 96%)')).toBe(false);
  });
});

describe('getPageThemeScope', () => {
  it('points --primary at the accent so every CTA block follows it', () => {
    const scope = getPageThemeScope({ accentColor: '#ff5701' });
    expect(vars(scope.style)['--primary']).toBe(toHslTriplet('#ff5701'));
    expect(vars(scope.style)['--primary-foreground']).toBeTruthy();
  });

  it('button accent slot wins over the base accent', () => {
    const scope = getPageThemeScope({ accentColor: '#ff5701', accentButton: '#0000ff' });
    expect(vars(scope.style)['--primary']).toBe('240 100% 50%');
  });

  it('maps text color to --foreground and switches dark themes to the dark scope', () => {
    const scope = getPageThemeScope({ backgroundColor: 'hsl(230 30% 8%)', textColor: 'hsl(0 0% 96%)' });
    expect(vars(scope.style)['--foreground']).toBe('0 0% 96%');
    expect(scope.isDark).toBe(true);
    expect(scope.className).toContain('dark');
  });

  it('honours an explicit darkMode flag', () => {
    expect(getPageThemeScope({ darkMode: true, backgroundColor: '#ffffff' }).isDark).toBe(true);
  });

  it('applies buttonStyle as button radius and gradient', () => {
    expect(vars(getPageThemeScope({ buttonStyle: 'pill' }).style)['--lm-button-radius']).toBe('9999px');
    expect(vars(getPageThemeScope({ buttonStyle: 'gradient', accentColor: '#ff5701' }).style)['--lm-button-bg']).toContain('linear-gradient');
  });

  it('uses the legacy font setting only when no font pair is chosen', () => {
    expect(vars(getPageThemeScope({ fontFamily: 'serif' }).style)['--lm-body-font']).toContain('serif');
    expect(vars(getPageThemeScope({ fontFamily: 'serif', fontPair: 'space-dm' }).style)['--lm-body-font']).toContain('DM Sans');
  });

  it('keeps the divider off the page root (it belongs on the block stack)', () => {
    expect(getAppearanceRootClass({ divider: 'hairline' })).not.toContain('divider');
    expect(getDividerClass({ divider: 'hairline' })).toBe('lm-divider-hairline');
  });
});

describe('resolveBlockCellAppearance', () => {
  it('uses the same radius table as BlockRenderer containers', () => {
    const cell = resolveBlockCellAppearance({ type: 'faq', blockStyle: { borderRadius: 'lg' } });
    const container = getBlockStyles({ borderRadius: 'lg' });
    expect(cell.style.borderRadius).toBe(BLOCK_RADIUS.lg);
    expect(container.style.borderRadius).toBe(BLOCK_RADIUS.lg);
  });

  it('applies padding and text color to any block type', () => {
    const cell = resolveBlockCellAppearance({ type: 'pricing', blockStyle: { padding: 'lg', textColor: '#ffffff' } });
    expect(cell.style.padding).toBe('24px');
    expect(vars(cell.style)['--foreground']).toBe('0 0% 100%');
  });

  it('falls back to the theme block shape when no radius is set', () => {
    expect(resolveBlockCellAppearance({ type: 'faq' }).style.borderRadius).toBe('var(--lm-block-radius, 16px)');
  });

  it('does not paint the user background twice for self-styled blocks', () => {
    const cell = resolveBlockCellAppearance({ type: 'button', blockStyle: { backgroundColor: '#ff0000' } });
    expect(cell.style.backgroundColor).toBeUndefined();
  });
});

describe('page fonts', () => {
  it('loads non-bundled families of the chosen pair and skips Inter/Manrope', () => {
    expect(primaryFamily("'Space Grotesk', system-ui")).toBe('Space Grotesk');
    const hrefs = getPageFontHrefs({ fontPair: 'space-dm' });
    expect(hrefs).toHaveLength(2);
    expect(hrefs[0]).toContain('family=Space+Grotesk');
    expect(getPageFontHrefs({ fontPair: 'manrope-inter' })).toEqual([]);
    expect(getPageFontHrefs({})).toEqual([]);
  });
});
