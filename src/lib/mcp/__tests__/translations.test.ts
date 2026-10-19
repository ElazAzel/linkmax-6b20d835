import { describe, expect, it } from 'vitest';
import { applyTranslations, findTranslationGaps } from '../translations';
import type { DraftSnapshot } from '../draft';

const snapshot: DraftSnapshot = {
  id: 'p1',
  blocks: [
    { id: 'profile-1', type: 'profile', name: 'Айгерим', bio: { ru: 'Маникюр в Алматы', en: 'Nails in Almaty' } },
    { id: 'faq-1', type: 'faq', items: [{ id: 'q1', question: 'Сколько стоит?', answer: '8000 ₸' }] },
    { id: 'link-1', type: 'link', title: 'Instagram', url: 'https://instagram.com/a' },
  ],
};

describe('translations', () => {
  it('lists only missing visitor texts, with concrete paths', () => {
    const gaps = findTranslationGaps(snapshot, ['en', 'kk'], 'ru');
    const byPath = Object.fromEntries(gaps.map((g) => [`${g.block_id}:${g.path}`, g.missing]));
    expect(byPath['profile-1:bio']).toEqual(['kk']);
    expect(byPath['faq-1:items[0].question']).toEqual(['en', 'kk']);
    expect(byPath['link-1:title']).toEqual(['en', 'kk']);
    expect(Object.keys(byPath).some((k) => k.includes('url'))).toBe(false);
  });

  it('turns plain text into a multilingual object and keeps existing languages', () => {
    const result = applyTranslations(snapshot, [
      { block_id: 'faq-1', path: 'items[0].question', language: 'en', text: 'How much is it?' },
      { block_id: 'profile-1', path: 'bio', language: 'kk', text: 'Алматыдағы маникюр' },
      { block_id: 'link-1', path: 'url', language: 'en', text: 'x' },
    ], 'ru');
    expect(result.applied).toBe(2);
    expect(result.rejected[0].reason).toContain('not a visitor-facing text');
    const faq = result.snapshot.blocks[1] as { items: Array<{ question: unknown; id: string }> };
    expect(faq.items[0]).toEqual({ id: 'q1', question: { ru: 'Сколько стоит?', en: 'How much is it?' }, answer: '8000 ₸' });
    expect(result.snapshot.blocks[0].bio).toEqual({ ru: 'Маникюр в Алматы', en: 'Nails in Almaty', kk: 'Алматыдағы маникюр' });
    expect(snapshot.blocks[1]).toMatchObject({ items: [{ question: 'Сколько стоит?' }] });
  });
});
