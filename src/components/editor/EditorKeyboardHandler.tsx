/**
 * EditorKeyboardHandler - Global keyboard shortcuts for the editor
 * P4: Expanded with arrow navigation, multi-select, clipboard, inline edit
 */
import { useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { trackEditorAction } from '@/lib/editor/editor-analytics';
import { getNextBlockId, selectAll, selectRange } from '@/lib/editor/selection-engine';
import { copyBlock } from '@/lib/editor/clipboard-engine';
import { supportsInlineEdit } from '@/lib/editor/inline-edit-config';
import type { EditorContext } from '@/lib/editor/editor-commands';
import type { BlockType } from '@/types/page';

interface EditorKeyboardHandlerProps {
  context: EditorContext;
  enabled?: boolean;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function EditorKeyboardHandler({ context, enabled = true }: EditorKeyboardHandlerProps) {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    selectedBlockId,
    selectedBlockIds,
    lastSelectedId,
    inlineEditingBlockId,
    toggleBlockSelection,
    setSelectedBlockIds,
    clearSelection,
    selectAllBlocks,
    setClipboardContent,
    clipboardContent,
    setInlineEditing,
  } = useEditorStore();

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      // Skip all shortcuts during inline editing
      if (inlineEditingBlockId) return;

      // Cmd+K — always open palette
      if (meta && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        return;
      }

      // Escape — close palette or clear selection
      if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
        if (selectedBlockIds.size > 0) {
          clearSelection();
          return;
        }
        return;
      }

      // Don't handle shortcuts when typing in inputs
      if (isInputFocused()) return;

      // Arrow Up/Down — navigate selection
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !meta) {
        e.preventDefault();
        const direction = e.key === 'ArrowUp' ? 'up' : 'down';
        const currentId = lastSelectedId || selectedBlockId;
        const nextId = getNextBlockId(context.blocks, currentId, direction);

        if (nextId) {
          if (e.shiftKey) {
            // Shift+Arrow: extend range selection
            const anchor = lastSelectedId || currentId || nextId;
            const range = selectRange(context.blocks, anchor, nextId);
            setSelectedBlockIds(range);
          } else {
            // Regular arrow: single select
            toggleBlockSelection(nextId, false);
          }
          trackEditorAction('keyboard_navigate', { direction });
        }
        return;
      }

      // Enter — open inline edit or full editor
      if (e.key === 'Enter' && !meta) {
        const currentId = selectedBlockId || (selectedBlockIds.size === 1 ? [...selectedBlockIds][0] : null);
        if (currentId) {
          e.preventDefault();
          const block = context.blocks.find(b => b.id === currentId);
          if (block) {
            if (supportsInlineEdit(block.type as BlockType)) {
              setInlineEditing(currentId);
              trackEditorAction('inline_edit_opened', { blockType: block.type, source: 'keyboard' });
            } else {
              context.onEditBlock?.(block);
            }
          }
        }
        return;
      }

      // Cmd+A — select all (non-profile)
      if (meta && e.key === 'a') {
        e.preventDefault();
        const selectableIds = context.blocks
          .filter(b => b.type !== 'profile')
          .map(b => b.id);
        selectAllBlocks(selectableIds);
        trackEditorAction('select_all', { count: selectableIds.length });
        return;
      }

      // Cmd+C — copy selected block
      if (meta && !e.shiftKey && e.key === 'c') {
        const currentId = selectedBlockId || (selectedBlockIds.size === 1 ? [...selectedBlockIds][0] : null);
        if (currentId) {
          e.preventDefault();
          const block = context.blocks.find(b => b.id === currentId);
          if (block) {
            setClipboardContent(copyBlock(block));
            trackEditorAction('block_copied', { blockType: block.type, source: 'keyboard' });
          }
        }
        return;
      }

      // Cmd+V — paste block
      if (meta && !e.shiftKey && e.key === 'v') {
        if (clipboardContent?.type === 'block') {
          e.preventDefault();
          const pastedBlock = JSON.parse(JSON.stringify(clipboardContent.block));
          pastedBlock.id = `${pastedBlock.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

          // Insert after selected block or at end
          const currentId = selectedBlockId || lastSelectedId;
          const position = currentId
            ? context.blocks.findIndex(b => b.id === currentId) + 1
            : context.blocks.length;

          context.onInsertBlock?.(pastedBlock.type, position);
          trackEditorAction('block_pasted', { blockType: pastedBlock.type, source: 'keyboard' });
        }
        return;
      }

      // Cmd+Z — undo
      if (meta && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (context.canUndo) {
          context.onUndo();
          trackEditorAction('undo_used', { source: 'keyboard' });
        }
        return;
      }

      // Cmd+Shift+Z or Cmd+Y — redo
      if ((meta && e.shiftKey && e.key === 'z') || (meta && e.key === 'y')) {
        e.preventDefault();
        if (context.canRedo) {
          context.onRedo();
          trackEditorAction('redo_used', { source: 'keyboard' });
        }
        return;
      }

      // Cmd+D — duplicate selected
      if (meta && e.key === 'd') {
        e.preventDefault();
        if (selectedBlockId) {
          const b = context.blocks.find((bl) => bl.id === selectedBlockId);
          if (b && b.type !== 'profile') {
            context.onDuplicateBlock(selectedBlockId);
          }
        }
        return;
      }

      // Delete/Backspace — delete selected block(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBlockIds.size > 0) {
          for (const id of selectedBlockIds) {
            const b = context.blocks.find((bl) => bl.id === id);
            if (b && b.type !== 'profile') {
              context.onDeleteBlock(id);
            }
          }
          clearSelection();
        } else if (selectedBlockId) {
          const b = context.blocks.find((bl) => bl.id === selectedBlockId);
          if (b && b.type !== 'profile') {
            context.onDeleteBlock(selectedBlockId);
          }
        }
        return;
      }

      // Cmd+ArrowUp — move up
      if (meta && e.key === 'ArrowUp' && selectedBlockId) {
        e.preventDefault();
        const idx = context.blocks.findIndex((b) => b.id === selectedBlockId);
        if (idx > 0) {
          const newBlocks = [...context.blocks];
          [newBlocks[idx - 1], newBlocks[idx]] = [newBlocks[idx], newBlocks[idx - 1]];
          context.onReorderBlocks(newBlocks);
        }
        return;
      }

      // Cmd+ArrowDown — move down
      if (meta && e.key === 'ArrowDown' && selectedBlockId) {
        e.preventDefault();
        const idx = context.blocks.findIndex((b) => b.id === selectedBlockId);
        if (idx >= 0 && idx < context.blocks.length - 1) {
          const newBlocks = [...context.blocks];
          [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
          context.onReorderBlocks(newBlocks);
        }
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled, commandPaletteOpen, selectedBlockId, selectedBlockIds,
    lastSelectedId, inlineEditingBlockId, clipboardContent,
    context, setCommandPaletteOpen, toggleBlockSelection,
    setSelectedBlockIds, clearSelection, selectAllBlocks,
    setClipboardContent, setInlineEditing,
  ]);

  return null;
}
