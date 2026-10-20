import { describe, expect, it } from 'vitest';
import { HARDCODED_TEMPLATES, createTemplateBlock } from './index';
import { templateBlocksForFeatures } from '@/lib/blocks/template-features';
import { BUSINESS_BLOCK_TYPES } from '@/lib/features';

describe('fallback page templates', () => {
  it('preserves quoted prices, zero prices and localized descriptions in showcase cards', () => {
    const cards = templateBlocksForFeatures([
      { type: 'product', overrides: { name: 'Service', description: { ru: 'Описание', en: 'Description' }, price: 5000, currency: 'KZT' } },
      { type: 'pricing', overrides: { items: [{ name: 'Consultation', price: 0, currency: 'KZT' }] } },
      { type: 'catalog', overrides: { items: [{ name: 'Print', description: 'A4', price: 20, currency: 'USD' }] } },
    ], false);
    expect(cards.map(card => card.overrides?.text)).toEqual([
      { ru: 'Описание\n5000 KZT', en: 'Description\n5000 KZT' }, '0 KZT', 'A4\n20 USD',
    ]);
  });

  it('uses current data schemas instead of silently rendering factory examples', () => {
    for (const template of HARDCODED_TEMPLATES) {
      for (const definition of template.blocks) {
        const block = createTemplateBlock(definition.type, definition.overrides);
        expect(['testimonial', 'countdown']).not.toContain(block.type);
        if (block.type === 'pricing' || block.type === 'catalog') {
          expect(block.items.length, `${template.id}: ${block.type}`).toBeGreaterThan(0);
          expect(block.items.every((item) => item.name)).toBe(true);
        }
        if (block.type === 'carousel') expect(block.images.length).toBeGreaterThan(0);
        if (block.type === 'profile') expect(block.verified).toBe(false);
      }
    }
  });

  it('keeps business tools out of a focused page-builder recipe and preserves the business version', () => {
    for (const template of HARDCODED_TEMPLATES) {
      const showcase = templateBlocksForFeatures(template.blocks, false);
      expect(showcase.every((block) => !BUSINESS_BLOCK_TYPES.has(block.type))).toBe(true);
      expect(templateBlocksForFeatures(template.blocks, true)).toBe(template.blocks);
    }
  });

  it('uses bundled photographs on visual templates', () => {
    for (const id of ['beauty', 'photographer', 'teacher', 'wedding', 'restaurant']) {
      const template = HARDCODED_TEMPLATES.find((item) => item.id === id);
      expect(JSON.stringify(template), id).toContain('/demo/');
    }
  });

  it('does not publish invented awards, credentials or real-looking contact handles from demo recipes', () => {
    for (const template of HARDCODED_TEMPLATES) {
      for (const block of template.blocks) {
        if (block.type === 'profile') {
          expect(JSON.stringify(block.overrides?.bio)).not.toMatch(/2GIS|AWWWARDS|Tripadvisor|CELTA|95%|Гарантия|3000\+|5000\+/i);
        }
        if (block.type === 'messenger') expect(block.overrides?.messengers).toEqual([{ platform: 'whatsapp', username: '' }]);
        if (block.type === 'socials') expect(block.overrides?.platforms).toEqual([]);
        if (block.type === 'link' || block.type === 'button') expect(block.overrides?.url).toBe('https://example.com');
      }
    }
    const barber = HARDCODED_TEMPLATES.find((template) => template.id === 'barber');
    expect(barber?.blocks.find((block) => block.type === 'profile')?.overrides?.bio).toMatchObject({
      ru: 'Мужские стрижки в центре Алматы.\nПн–Вс 10:00–21:00',
    });
  });
});
