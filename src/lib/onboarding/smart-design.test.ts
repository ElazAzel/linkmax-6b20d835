import { describe, expect, it, vi } from 'vitest';
import { buildSmartPage, preserveBuilderIdentity } from './smart-page-builder';
import { NICHES } from '@/lib/niches';
import { HARDCODED_TEMPLATES } from '@/data/templates';
import { getPageThemeScope, getContrastRatio, toHslTriplet } from '@/lib/appearance/style-utils';
import { createThemeTransfer, parseThemeTransfer } from '@/lib/appearance/theme-transfer';

const userInfo = { name: 'Луна', bio: 'Маникюр и уход', services: 'Маникюр — 8000 KZT', contacts: '+77011234567', socials: '', mediaLinks: '' };

describe('local builder visual system', () => {
  it('lets a light legacy preset replace a dark generated palette', () => {
    const { theme } = buildSmartPage({ niche: 'tech', userInfo, now: 1 });
    const scope = getPageThemeScope({ ...theme, backgroundColor: '#ffffff', textColor: '#121212', themePreset: 'classic' });
    expect(scope.isDark).toBe(false);
    expect(scope.style).toHaveProperty('--foreground', toHslTriplet('#121212'));
    expect(scope.style).not.toHaveProperty('--card', toHslTriplet(theme.colors.surface));
  });
  it('keeps a generated palette through supported theme export and import', () => {
    const { theme } = buildSmartPage({ niche: 'tech', userInfo, now: 1 });
    expect(parseThemeTransfer(createThemeTransfer(theme))?.colors).toEqual(theme.colors);
  });
  it('keeps the real portrait and profile identity when rebuilding an existing page', () => {
    const generated = buildSmartPage({ niche: 'tech', userInfo, now: 1 });
    const blocks = preserveBuilderIdentity(generated.blocks, [{ id: 'actual-profile', type: 'profile', name: 'Previous', bio: '', avatar: '/actual.gif', coverImage: '/actual-cover.webp', coverVideo: '/actual-cover.webm' }]);
    expect(blocks[0]).toMatchObject({ id: 'actual-profile', name: 'Луна', avatar: '/actual.gif', coverImage: '/actual-cover.webp', coverVideo: '/actual-cover.webm' });
    expect(generated.blocks[0]).toMatchObject({ avatar: '' });
  });
  it('returns a complete reproducible theme for every niche without calling a model', () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    try {
      const palettes = new Set();
      for (const niche of NICHES) {
        const result = buildSmartPage({ niche, userInfo, now: 1 });
        expect(result.theme.colors.canvas).toBe(result.theme.backgroundColor);
        expect(result.theme.colors.text).toBe(result.theme.textColor);
        expect(result.theme.typography.headingFamily).toBeTruthy();
        expect(result.theme.spacing.pagePadding).toBeGreaterThanOrEqual(16);
        expect(getContrastRatio(result.theme.textColor, result.theme.backgroundColor)).toBeGreaterThanOrEqual(7);
        expect(getContrastRatio(result.theme.colors.mutedText, result.theme.colors.surface)).toBeGreaterThanOrEqual(4.5);
        expect(getPageThemeScope(result.theme).style).toHaveProperty('--card', toHslTriplet(result.theme.colors.surface));
        expect(result.theme).toEqual(buildSmartPage({ niche, userInfo, now: 1 }).theme);
        palettes.add(result.theme.backgroundColor);
      }
      expect(palettes.size).toBeGreaterThanOrEqual(5);
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });

  it('uses supplied images for a cover and converts supplied offers into visual cards', () => {
    const result = buildSmartPage({ niche: 'beauty', now: 1, userInfo: { ...userInfo, mediaLinks: 'https://example.test/my-work.jpg' } });
    expect(result.blocks[0]).toMatchObject({ type: 'profile', avatar: '', coverImage: 'https://example.test/my-work.jpg', avatarShape: 'circle' });
    expect(result.blocks.find(b => b.type === 'card')).toMatchObject({ title: 'Маникюр', text: expect.stringContaining('8'), image: 'https://example.test/my-work.jpg' });
    expect(JSON.stringify(result.blocks)).not.toContain('unsplash');
  });

  it('ships complete themed examples and generated local media for every nonblank template', () => {
    for (const template of HARDCODED_TEMPLATES.filter(t => t.id !== 'blank')) {
      expect(template.theme?.colors?.canvas, template.id).toBeTruthy();
      const profile = template.blocks.find(b => b.type === 'profile');
      expect(profile?.overrides?.coverImage, template.id).toMatch(/^\/demo\//);
      expect(JSON.stringify(template), template.id).toContain('/demo/editorial-v1/');
      expect(template.blocks.length, template.id).toBeGreaterThanOrEqual(4);
    }
  });
});
