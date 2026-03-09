/**
 * EditorKeyboardHandler - Global keyboard shortcuts for the editor
 * Listens for Cmd+K, Cmd+Z, Cmd+Y, Cmd+D, Delete, Escape
 */
import { useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { trackEditorAction } from '@/lib/editor/editor-analytics';
import type { EditorContext } from '@/lib/editor/editor-commands';

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
  const { commandPaletteOpen, setCommandPaletteOpen, selectedBlockId } = useEditorStore();

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

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
        if (selectedBlockId) {
          context.setSelectedBlockId(null);
          return;
        }
        return;
      }

      // Don't handle shortcuts when typing in inputs
      if (isInputFocused()) return;

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

      // Delete/Backspace — delete selected block
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBlockId) {
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
  }, [enabled, commandPaletteOpen, selectedBlockId, context, setCommandPaletteOpen]);

  return null;
}
