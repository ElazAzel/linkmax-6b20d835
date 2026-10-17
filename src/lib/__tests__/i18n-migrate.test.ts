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
