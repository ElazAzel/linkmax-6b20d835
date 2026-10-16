import { describe, expect, it } from 'vitest';
import { evaluateBlock } from '../block-quality-evaluator';
import type { Block } from '@/types/page';

const link = (title: unknown) => ({ id: 'l1', type: 'link', url: 'https://example.com', title }) as unknown as Block;
const issueKeys = (block: Block) => evaluateBlock(block).issues.map((issue) => issue.key);

describe('evaluateBlock', () => {
  it('reads multilingual link titles instead of crashing the editor', () => {
    expect(() => evaluateBlock(link({ ru: 'Записаться онлайн', en: 'Book online' }))).not.toThrow();
    expect(issueKeys(link({ ru: 'Записаться онлайн', en: 'Book online' }))).not.toContain('weak_label');
  });

  it('flags a weak or missing label in any shape', () => {
    expect(issueKeys(link('Ссылка'))).toContain('weak_label');
    expect(issueKeys(link({ ru: 'ссылка', en: 'link' }))).toContain('weak_label');
    expect(issueKeys(link({ ru: '', en: '' }))).toContain('weak_label');
  });

  it('measures multilingual text with non-string values', () => {
    const text = { id: 't1', type: 'text', content: { ru: 'Короткий', en: null } } as unknown as Block;
    expect(issueKeys(text)).toContain('too_short');
  });
});
