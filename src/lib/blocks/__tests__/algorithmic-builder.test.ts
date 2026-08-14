import { describe, expect, it } from 'vitest';
import { getAlgorithmicTemplateForNiche } from '../algorithmic-templates';
import { generateBlocksFromTemplate } from '../internal-builder';

describe('algorithmic page builder', () => {
  it('creates a deterministic conversion structure for a niche', () => {
    const template = getAlgorithmicTemplateForNiche('beauty');
    const blocks = generateBlocksFromTemplate(template, {
      name: 'Studio Luna',
      bio: 'Маникюр и уход. Подробнее: https://example.com/book',
      goal: 'sales',
      contacts: '+7 777 123 45 67, hello@example.com',
      services: 'Маникюр — 5000 KZT\nПедикюр — 7000 KZT',
      socials: 'Instagram: @studio_luna',
      mediaLinks: '',
    });

    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.filter((block) => block.type === 'profile')[0]).toMatchObject({ name: 'Studio Luna' });
    expect(blocks.some((block) => block.type === 'catalog')).toBe(true);
    expect(blocks.some((block) => block.type === 'messenger')).toBe(true);
    expect(blocks.some((block) => block.type === 'socials')).toBe(true);
    expect(blocks.some((block) => block.type === 'button' && block.url === 'https://example.com/book')).toBe(true);
    expect(new Set(blocks.map((block) => block.id)).size).toBe(blocks.length);
  });

  it('always returns a usable profile and fallback blocks with empty optional input', () => {
    const blocks = generateBlocksFromTemplate(
      getAlgorithmicTemplateForNiche('other'),
      { name: 'My Page', bio: '', contacts: '', services: '', socials: '', mediaLinks: '' },
    );

    expect(blocks.find((block) => block.type === 'profile')).toBeDefined();
    expect(blocks.every((block) => typeof block.id === 'string' && block.id.length > 0)).toBe(true);
  });
});
