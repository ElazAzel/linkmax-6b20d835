import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLiveBlockDraft } from '../useLiveBlockDraft';
import type { Block } from '@/types/page';

const text = (id: string, content: string) => ({ id, type: 'text', content }) as unknown as Block;

describe('useLiveBlockDraft', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('applies edits to the page after a short delay, coalescing bursts', () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useLiveBlockDraft(text('a', 'Было'), commit, 150));

    act(() => {
      result.current.change({ content: 'С' } as Partial<Block>);
      result.current.change({ content: 'Стало' } as Partial<Block>);
    });
    expect(commit).not.toHaveBeenCalled();
    expect((result.current.draft as { content: string }).content).toBe('Стало');

    act(() => { vi.advanceTimersByTime(150); });
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit.mock.calls[0][1]).toMatchObject({ content: 'Стало' });
  });

  it('discard returns the block to the snapshot taken when it was opened', () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useLiveBlockDraft(text('a', 'Было'), commit, 150));

    act(() => { result.current.change({ content: 'Стало', blockStyle: { padding: 'lg' } } as Partial<Block>); });
    act(() => { vi.advanceTimersByTime(150); });
    act(() => { result.current.discard(); });

    const revert = commit.mock.calls.at(-1)?.[1] as Record<string, unknown>;
    expect(revert.content).toBe('Было');
    expect('blockStyle' in revert && revert.blockStyle === undefined).toBe(true);
    expect(result.current.dirty).toBe(false);
  });

  it('flushes pending edits of the previous block when another block opens', () => {
    const commit = vi.fn();
    const { result, rerender } = renderHook(({ block }) => useLiveBlockDraft(block, commit, 150), {
      initialProps: { block: text('a', 'A') },
    });

    act(() => { result.current.change({ content: 'A2' } as Partial<Block>); });
    rerender({ block: text('b', 'B') });

    expect(commit).toHaveBeenCalledWith('a', expect.objectContaining({ content: 'A2' }));
    expect((result.current.draft as { content: string }).content).toBe('B');
  });
});
