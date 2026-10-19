import { describe, expect, it } from 'vitest';
import { getI18nText, migrateToMultilingual } from '@/lib/i18n-helpers';
import { transformBlock, getTransformTargets } from '@/lib/editor/transform-engine';
import type { Block } from '@/types/page';

describe('migrateToMultilingual', () => {
  it('keeps one copy so other languages follow later edits', () => {
    const value = migrateToMultilingual('Привет');
    expect(value).toEqual({ ru: 'Привет', en: '', kk: '' });
    const edited = { ...value, ru: 'Правка' };
    expect(getI18nText(edited, 'en')).toBe('Правка');
    expect(getI18nText(edited, 'kk')).toBe('Правка');
  });
});

describe('transformBlock', () => {
  it('only offers conversions that keep the content', () => {
    expect(getTransformTargets('text')).toEqual([]);
    expect(getTransformTargets('button')).toEqual(['link']);
  });

  it('keeps title and url between button and link', () => {
    const button = { id: 'b1', type: 'button', title: 'Записаться', url: 'https://wa.me/1' } as unknown as Block;
    const { newBlock, success } = transformBlock(button, 'link');
    expect(success).toBe(true);
    expect(newBlock).toMatchObject({ id: 'b1', type: 'link', title: 'Записаться', url: 'https://wa.me/1' });
  });
});

describe('sample text of a new Text block', () => {
  it('is not shown to visitors until the owner writes their own', async () => {
    const { hasVisitorContent } = await import('@/lib/blocks/block-visibility');
    const { DEFAULT_TEXT_CONTENT } = await import('@/lib/blocks/block-defaults');
    expect(hasVisitorContent({ id: 't', type: 'text', content: DEFAULT_TEXT_CONTENT } as unknown as Block)).toBe(false);
    expect(hasVisitorContent({ id: 't', type: 'text', content: { ru: DEFAULT_TEXT_CONTENT, en: '', kk: '' } } as unknown as Block)).toBe(false);
    expect(hasVisitorContent({ id: 't', type: 'text', content: 'Мой текст' } as unknown as Block)).toBe(true);
  });

  it('drops the sample per language when another language has real text', async () => {
    const { withoutDefaultText, DEFAULT_TEXT_CONTENT } = await import('@/lib/blocks/block-defaults');
    const mixed = { ru: DEFAULT_TEXT_CONTENT, en: 'About me', kk: '' };
    expect(withoutDefaultText(mixed)).toEqual({ ru: '', en: 'About me', kk: '' });
    expect(getI18nText(withoutDefaultText(mixed) as typeof mixed, 'ru')).toBe('About me');
  });
});
