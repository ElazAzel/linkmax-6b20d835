import { describe, expect, it } from 'vitest';
import { mergeBlockDraft } from '../block-draft';

describe('mergeBlockDraft', () => {
  it('keeps untouched fields when an editor emits a partial patch', () => {
    const result = mergeBlockDraft(
      { id: 'text-1', type: 'text', content: 'Keep me', blockSize: 'wide' },
      { content: 'Updated' },
    );

    expect(result).toMatchObject({
      id: 'text-1',
      type: 'text',
      content: 'Updated',
      blockSize: 'wide',
    });
  });

  it('merges style patches instead of replacing the style object', () => {
    const result = mergeBlockDraft(
      { blockStyle: { padding: 'md', shadow: 'md' } },
      { blockStyle: { padding: 'lg' } },
    );

    expect(result.blockStyle).toEqual({ padding: 'lg', shadow: 'md' });
  });
});
