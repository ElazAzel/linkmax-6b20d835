import { describe, expect, it } from 'vitest';
import { buildRevertPatch, mergeBlockDraft } from '../block-draft';

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

describe('clearing fields', () => {
  it('an explicit undefined in the patch clears a style key (reset section)', () => {
    const draft = mergeBlockDraft(
      { blockStyle: { backgroundColor: '#ff5701', padding: 'lg' } },
      { blockStyle: { backgroundColor: undefined, padding: 'lg' } },
    );
    const saved = { id: 'b', blockStyle: { backgroundColor: '#ff5701', padding: 'lg' } };
    const next = { ...saved, ...draft };
    expect(next.blockStyle?.backgroundColor).toBeUndefined();
    expect(JSON.parse(JSON.stringify(next)).blockStyle).toEqual({ padding: 'lg' });
  });

  it('an explicit undefined clears a top-level field (remove schedule)', () => {
    const draft = mergeBlockDraft({ id: 'b', schedule: { startDate: '2026-10-01' } } as never, { schedule: undefined } as never);
    expect('schedule' in draft && (draft as { schedule?: unknown }).schedule === undefined).toBe(true);
  });
});

describe('buildRevertPatch', () => {
  it('restores snapshot values and clears fields added after it', () => {
    const snapshot = { id: 'b', type: 'text', content: 'Было' } as const;
    const current = { ...snapshot, content: 'Стало', blockStyle: { padding: 'lg' } };
    const patch = buildRevertPatch(snapshot as never, current as never);
    const reverted = { ...current, ...patch };
    expect(reverted.content).toBe('Было');
    expect(reverted.blockStyle).toBeUndefined();
  });
});
