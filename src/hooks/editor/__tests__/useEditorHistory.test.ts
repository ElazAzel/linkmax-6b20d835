import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorHistory } from '../useEditorHistory';
import type { Block } from '@/types/page';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

const toastMock = vi.hoisted(() => {
  const fn = vi.fn() as ReturnType<typeof vi.fn> & { success: ReturnType<typeof vi.fn>; dismiss: ReturnType<typeof vi.fn> };
  fn.success = vi.fn();
  fn.dismiss = vi.fn();
  return fn;
});
vi.mock('sonner', () => ({ toast: toastMock }));

const b = (id: string) => ({ id, type: 'text' }) as unknown as Block;

describe('useEditorHistory', () => {
  it('undo/redo hand the restored blocks to onStateChange', () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() => useEditorHistory([], { onStateChange }));

    act(() => result.current.recordBlockAdd([b('a')], [b('a'), b('x')], 'text', 'x'));
    expect(onStateChange).not.toHaveBeenCalled();
    expect(result.current.canUndo).toBe(true);

    act(() => { result.current.undo(); });
    expect(onStateChange).toHaveBeenLastCalledWith([b('a')]);
    expect(result.current.canRedo).toBe(true);

    act(() => { result.current.redo(); });
    expect(onStateChange).toHaveBeenLastCalledWith([b('a'), b('x')]);
  });

  it('uses the latest onStateChange callback', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ cb }) => useEditorHistory([], { onStateChange: cb }), {
      initialProps: { cb: first },
    });
    act(() => result.current.recordBlocksReorder([b('a'), b('b')], [b('b'), b('a')]));
    rerender({ cb: second });
    act(() => { result.current.undo(); });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith([b('a'), b('b')]);
  });

  it('toast undo button undoes the action it was shown for', () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() => useEditorHistory([], { onStateChange }));

    act(() => result.current.recordBlockAdd([], [b('a')], 'text', 'a'));
    act(() => result.current.recordBulkDelete([b('a'), b('b')], [], 2));

    const lastToastOptions = toastMock.mock.calls.at(-1)?.[1] as { action: { onClick: () => void } };
    act(() => lastToastOptions.action.onClick());
    expect(onStateChange).toHaveBeenLastCalledWith([b('a'), b('b')]);
  });

  it('does not show a toast for routine edits', () => {
    toastMock.mockClear();
    const { result } = renderHook(() => useEditorHistory([]));
    act(() => result.current.recordBlockUpdate([b('a')], [b('a')], 'text', 'a'));
    expect(toastMock).not.toHaveBeenCalled();
  });

  it('reset clears undo', () => {
    const { result } = renderHook(() => useEditorHistory([]));
    act(() => result.current.recordBlockAdd([], [b('a')], 'text', 'a'));
    act(() => result.current.resetWithBlocks([]));
    expect(result.current.canUndo).toBe(false);
  });
});
