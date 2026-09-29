import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EditorKeyboardHandler } from '../EditorKeyboardHandler';
import { useEditorStore } from '@/store/useEditorStore';
import type { EditorContext } from '@/lib/editor/editor-commands';
import type { Block } from '@/types/page';

const blocks = [
  { id: 'p', type: 'profile' },
  { id: 'a', type: 'text' },
  { id: 'b', type: 'link' },
] as unknown as Block[];

function makeContext(): EditorContext {
  return {
    blocks,
    selectedBlockId: null,
    isPremium: false,
    commandPaletteOpen: false,
    onInsertBlock: vi.fn(() => ({ success: true })),
    onInsertPreset: vi.fn(),
    onDeleteBlock: vi.fn(),
    onDeleteBlocks: vi.fn(),
    onDuplicateBlock: vi.fn(),
    onEditBlock: vi.fn(),
    onUpdateBlock: vi.fn(),
    onReorderBlocks: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    canUndo: false,
    canRedo: false,
    onOpenTemplates: vi.fn(),
    onPreview: vi.fn(),
    onShare: vi.fn(),
    setSelectedBlockId: vi.fn(),
    setCommandPaletteOpen: vi.fn(),
  } as unknown as EditorContext;
}

const pressDelete = () => act(() => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
});

describe('EditorKeyboardHandler — Delete', () => {
  beforeEach(() => {
    useEditorStore.getState().clearSelection();
  });

  it('deletes every selected block in one operation', () => {
    const context = makeContext();
    render(<EditorKeyboardHandler context={context} />);
    act(() => useEditorStore.getState().setSelectedBlockIds(new Set(['a', 'b', 'p'])));

    pressDelete();

    expect(context.onDeleteBlocks).toHaveBeenCalledWith(['a', 'b']);
    expect(context.onDeleteBlock).not.toHaveBeenCalled();
  });

  it('does nothing while focus is inside the block inspector', () => {
    const context = makeContext();
    render(
      <>
        <EditorKeyboardHandler context={context} />
        <aside data-editor-inspector>
          <button type="button">Размер</button>
        </aside>
      </>,
    );
    act(() => useEditorStore.getState().setSelectedBlockIds(new Set(['a'])));
    (document.querySelector('[data-editor-inspector] button') as HTMLButtonElement).focus();

    pressDelete();

    expect(context.onDeleteBlock).not.toHaveBeenCalled();
    expect(context.onDeleteBlocks).not.toHaveBeenCalled();
  });
});
