import { describe, it, expect } from 'vitest';
import {
  INLINE_EDITABLE_FIELDS,
  getPrimaryEditableField,
  readInlineText,
  writeInlineText,
} from '../inline-edit-config';
import { createBlock } from '@/lib/blocks/block-factory';
import type { BlockType } from '@/types/page';

describe('inline-edit-config', () => {
  it('edits the caption field that button and link blocks actually render', () => {
    expect(getPrimaryEditableField('button')?.field).toBe('title');
    expect(getPrimaryEditableField('link')?.field).toBe('title');
  });

  it('every primary field exists on a freshly created block of that type', () => {
    const missing: string[] = [];
    for (const type of Object.keys(INLINE_EDITABLE_FIELDS) as BlockType[]) {
      const primary = getPrimaryEditableField(type);
      if (!primary) continue;
      let block: Record<string, unknown>;
      try {
        block = createBlock(type) as unknown as Record<string, unknown>;
      } catch {
        continue; // factory does not support this type standalone
      }
      if (!(primary.field in block)) missing.push(`${type}.${primary.field}`);
    }
    expect(missing).toEqual([]);
  });

  it('reads multilingual text in the current language instead of [object Object]', () => {
    expect(readInlineText({ ru: 'Привет', en: 'Hello' }, 'en')).toBe('Hello');
    expect(readInlineText({ ru: 'Привет' }, 'kk')).toBe('Привет');
    expect(readInlineText('plain', 'ru')).toBe('plain');
    expect(readInlineText(undefined, 'ru')).toBe('');
  });

  it('writes back only the current language and keeps other translations', () => {
    expect(writeInlineText({ ru: 'Привет', en: 'Hello' }, 'Hi', 'en')).toEqual({ ru: 'Привет', en: 'Hi' });
    expect(writeInlineText('old', 'new', 'ru')).toBe('new');
  });
});
