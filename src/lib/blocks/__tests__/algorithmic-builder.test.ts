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

describe('page builder output', () => {
  const build = (info: Partial<Parameters<typeof generateBlocksFromTemplate>[1]>) =>
    generateBlocksFromTemplate(getAlgorithmicTemplateForNiche('beauty'), {
      name: '', bio: '', contacts: '', services: '', socials: '', mediaLinks: '', ...info,
    });

  it('never leaves template filler on the page', () => {
    const blocks = build({ name: 'Кофейня Зерно', bio: 'Кофе и выпечка' });
    const json = JSON.stringify(blocks);
    for (const filler of ['Напишите что-нибудь', 'Товар 1', 'Your name', 'FAQ', 'unsplash', 'Как записаться?']) {
      expect(json).not.toContain(filler);
    }
    expect(blocks.map((b) => b.type)).toEqual(['profile', 'messenger']);
  });

  it('reads prices next to durations and counts', () => {
    const blocks = build({ name: 'Лаура', services: 'Консультация 60 минут 15000\nПакет 5 сессий — 65 000 тг' });
    const pricing = blocks.find((b) => b.type === 'pricing') as unknown as { items: Array<{ name: string; price: number }> };
    expect(pricing.items).toEqual([
      expect.objectContaining({ name: 'Консультация 60 минут', price: 15000 }),
      expect.objectContaining({ name: 'Пакет 5 сессий', price: 65000 }),
    ]);
  });

  it('splits one-line contacts into chats and an address', () => {
    const blocks = build({ name: 'Айгерим', contacts: '+7 701 123 45 67, @aigerim_nails, ул. Абая 10', socials: 'instagram.com/aigerim.nails' });
    const messenger = blocks.find((b) => b.type === 'messenger') as unknown as { messengers: Array<{ platform: string; username: string }> };
    expect(messenger.messengers).toEqual([
      { platform: 'whatsapp', username: '+77011234567' },
      { platform: 'telegram', username: 'aigerim_nails' },
    ]);
    expect(blocks.find((b) => b.type === 'map')).toMatchObject({ address: 'ул. Абая 10' });
    expect(blocks.find((b) => b.type === 'socials')).toBeDefined();
  });
});
