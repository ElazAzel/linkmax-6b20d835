import { describe, expect, it, vi } from 'vitest';
import { buildSmartPage, inferSmartPageNiche } from './smart-page-builder';
import { NICHES } from '@/lib/niches';
import { BUSINESS_BLOCK_TYPES } from '@/lib/features';

const userInfo = {
  name: 'Студия Луна', bio: 'Маникюр и уход. Запись: https://example.com/book',
  contacts: '+7 701 123 45 67, hello@example.com',
  services: 'Маникюр — 8000 KZT\nПедикюр — 12000 KZT',
  socials: 'instagram.com/studio.luna',
  mediaLinks: 'https://example.com/work.jpg https://example.com/detail.gif',
};

describe('shared token-free page builder', () => {
  it('builds every niche with network unavailable and never creates business blocks by default', () => {
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    try {
      for (const niche of NICHES) {
        const result = buildSmartPage({ niche, userInfo, now: 123 });
        expect(result.blocks[0]).toMatchObject({ type: 'profile', name: userInfo.name, avatar: '', verified: false });
        expect(result.blocks.every((block) => !BUSINESS_BLOCK_TYPES.has(block.type))).toBe(true);
        expect(result.blocks.find((block) => block.type === 'text')).toMatchObject({ content: expect.stringContaining('8 000 KZT') });
        expect(result.blocks.find((block) => block.type === 'carousel')).toMatchObject({ images: [{ url: 'https://example.com/work.jpg', alt: 'Материал 1' }, { url: 'https://example.com/detail.gif', alt: 'Материал 2' }], autoPlay: false });
        expect(new Set(result.blocks.map((block) => block.id)).size).toBe(result.blocks.length);
      }
      expect(network).not.toHaveBeenCalled();
    } finally { network.mockRestore(); }
  });

  it('reproduces the entire output with a fixed clock including nested sections and socials', () => {
    const input = { niche: 'beauty' as const, userInfo, now: 123 };
    expect(buildSmartPage(input)).toEqual(buildSmartPage(input));
  });

  it('does not repeat a free-form biography as an invented service', () => {
    const prompt = 'Фотограф в Алматы. Снимаю портреты и истории';
    const result = buildSmartPage({ niche: 'art', now: 1, userInfo: {
      name: 'Алия', bio: prompt, services: prompt, contacts: '', socials: '', mediaLinks: '',
    } });
    expect(result.blocks.filter((block) => block.type === 'text')).toHaveLength(0);
  });

  it('only supplies real business prices when business tools are enabled', () => {
    const result = buildSmartPage({ niche: 'beauty', userInfo, businessEnabled: true, now: 1 });
    const priceBlock = result.blocks.find((block) => block.type === 'pricing');
    expect(priceBlock?.type === 'pricing' && priceBlock.items.map((item) => item.price)).toEqual([8000, 12000]);
    expect(result.blocks.some((block) => ['testimonial', 'faq', 'booking', 'form'].includes(block.type))).toBe(false);
  });

  it('never invents prices, reviews, verification, promises, or stock portraits from sparse input', () => {
    const result = buildSmartPage({ niche: 'health', businessEnabled: true, now: 1,
      userInfo: { name: 'Алия', bio: '', contacts: '', services: '', socials: '', mediaLinks: '' },
    });
    expect(result.blocks.map((block) => block.type)).toEqual(['profile', 'messenger']);
    expect(result.profile).toEqual({ name: 'Алия', bio: '' });
    expect(result.diagnostics.qualityScore).toBe(20);
    expect(JSON.stringify(result)).not.toContain('unsplash');
  });

  it('preserves media from prose while rejecting lookalike video hosts as embeds', () => {
    const result = buildSmartPage({ niche: 'art', now: 1, userInfo: { ...userInfo,
      mediaLinks: 'Работа: https://example.com/work.jpg, видео https://youtube.com/watch?v=123 и ссылка https://youtube.com.evil.example/watch?v=123',
    } });
    expect(result.blocks[1]).toMatchObject({ type: 'image', url: 'https://example.com/work.jpg' });
    expect(result.blocks.filter((block) => block.type === 'video')).toHaveLength(1);
    expect(result.blocks.find((block) => block.type === 'button' && block.url.includes('evil'))).toBeDefined();
  });

  it.each([
    ['Мастер маникюра в Алматы', 'beauty'], ['Репетитор английского', 'education'],
    ['Фотограф и свадебные съёмки', 'art'], ['Фитнес тренер', 'fitness'],
    ['IT developer', 'tech'], ['Fitness studio', 'fitness'], ['Психолог', 'health'],
    ['Кофейня и выпечка', 'food'], ['Страница обо мне', 'other'],
  ])('recognizes the niche from %s', (prompt, niche) => {
    expect(inferSmartPageNiche(prompt)).toBe(niche);
  });
});
