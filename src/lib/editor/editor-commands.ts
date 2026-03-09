/**
 * Editor Command Registry
 * Context-aware commands for command palette and keyboard shortcuts
 */

import type { Block, BlockType } from '@/types/page';
import { ALL_BLOCK_TYPES, BLOCK_METADATA } from '@/lib/blocks/block-registry';
import { BLOCK_PRESETS, type BlockPreset } from './editor-presets';

// ── Types ──

export interface EditorContext {
  blocks: Block[];
  selectedBlockId: string | null;
  isPremium: boolean;
  commandPaletteOpen: boolean;
  // Callbacks
  onInsertBlock: (blockType: string, position: number) => { success: boolean; blockId?: string };
  onInsertPreset: (preset: BlockPreset) => void;
  onDeleteBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onEditBlock: (block: Block) => void;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  onReorderBlocks: (blocks: Block[]) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenStructure?: () => void;
  onOpenTemplates?: () => void;
  onPreview?: () => void;
  onShare?: () => void;
  setSelectedBlockId: (id: string | null) => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export interface EditorCommand {
  id: string;
  labelKey: string;
  /** Fallback label if i18n key not found */
  label: string;
  icon: string;
  shortcut?: string;
  group: 'insert' | 'preset' | 'edit' | 'navigate' | 'action';
  isAvailable: (ctx: EditorContext) => boolean;
  execute: (ctx: EditorContext) => void;
  /** Extra search keywords */
  keywords?: string[];
}

// ── Helper ──

function getSelectedBlock(ctx: EditorContext): Block | null {
  if (!ctx.selectedBlockId) return null;
  return ctx.blocks.find((b) => b.id === ctx.selectedBlockId) || null;
}

function isNotProfile(ctx: EditorContext): boolean {
  const b = getSelectedBlock(ctx);
  return !!b && b.type !== 'profile';
}

// ── Build Commands ──

export function buildEditorCommands(): EditorCommand[] {
  const commands: EditorCommand[] = [];

  // ── Insert block commands ──
  for (const blockType of ALL_BLOCK_TYPES) {
    if (blockType === 'profile') continue; // can't insert profile
    const meta = BLOCK_METADATA[blockType];
    commands.push({
      id: `insert_${blockType}`,
      labelKey: `commands.insert.${blockType}`,
      label: `Add ${blockType}`,
      icon: meta.icon,
      group: 'insert',
      keywords: [blockType, 'add', 'insert', 'добавить', 'вставить'],
      isAvailable: (ctx) => !meta.isPremium || ctx.isPremium,
      execute: (ctx) => {
        ctx.onInsertBlock(blockType, ctx.blocks.length);
        ctx.setCommandPaletteOpen(false);
      },
    });
  }

  // ── Preset commands ──
  for (const preset of BLOCK_PRESETS) {
    commands.push({
      id: `preset_${preset.id}`,
      labelKey: preset.labelKey,
      label: preset.id.replace(/_/g, ' '),
      icon: BLOCK_METADATA[preset.blockType]?.icon || 'box',
      group: 'preset',
      keywords: [...preset.keywords, 'preset', 'шаблон'],
      isAvailable: (ctx) => {
        const meta = BLOCK_METADATA[preset.blockType];
        return !meta?.isPremium || ctx.isPremium;
      },
      execute: (ctx) => {
        ctx.onInsertPreset(preset);
        ctx.setCommandPaletteOpen(false);
      },
    });
  }

  // ── Edit commands ──
  commands.push(
    {
      id: 'edit_block',
      labelKey: 'commands.edit.open',
      label: 'Edit block',
      icon: 'pencil',
      shortcut: 'Enter',
      group: 'edit',
      keywords: ['edit', 'редактировать', 'open'],
      isAvailable: (ctx) => !!ctx.selectedBlockId,
      execute: (ctx) => {
        const b = getSelectedBlock(ctx);
        if (b) {
          ctx.onEditBlock(b);
          ctx.setCommandPaletteOpen(false);
        }
      },
    },
    {
      id: 'duplicate_block',
      labelKey: 'commands.edit.duplicate',
      label: 'Duplicate block',
      icon: 'copy',
      shortcut: '⌘D',
      group: 'edit',
      keywords: ['duplicate', 'copy', 'дублировать', 'копировать'],
      isAvailable: isNotProfile,
      execute: (ctx) => {
        if (ctx.selectedBlockId) {
          ctx.onDuplicateBlock(ctx.selectedBlockId);
          ctx.setCommandPaletteOpen(false);
        }
      },
    },
    {
      id: 'delete_block',
      labelKey: 'commands.edit.delete',
      label: 'Delete block',
      icon: 'trash-2',
      shortcut: 'Del',
      group: 'edit',
      keywords: ['delete', 'remove', 'удалить'],
      isAvailable: isNotProfile,
      execute: (ctx) => {
        if (ctx.selectedBlockId) {
          ctx.onDeleteBlock(ctx.selectedBlockId);
          ctx.setCommandPaletteOpen(false);
        }
      },
    },
    {
      id: 'move_up',
      labelKey: 'commands.edit.moveUp',
      label: 'Move block up',
      icon: 'arrow-up',
      shortcut: '⌘↑',
      group: 'edit',
      keywords: ['move', 'up', 'вверх', 'переместить'],
      isAvailable: (ctx) => {
        if (!ctx.selectedBlockId) return false;
        const idx = ctx.blocks.findIndex((b) => b.id === ctx.selectedBlockId);
        return idx > 0;
      },
      execute: (ctx) => {
        const idx = ctx.blocks.findIndex((b) => b.id === ctx.selectedBlockId);
        if (idx > 0) {
          const newBlocks = [...ctx.blocks];
          [newBlocks[idx - 1], newBlocks[idx]] = [newBlocks[idx], newBlocks[idx - 1]];
          ctx.onReorderBlocks(newBlocks);
        }
      },
    },
    {
      id: 'move_down',
      labelKey: 'commands.edit.moveDown',
      label: 'Move block down',
      icon: 'arrow-down',
      shortcut: '⌘↓',
      group: 'edit',
      keywords: ['move', 'down', 'вниз', 'переместить'],
      isAvailable: (ctx) => {
        if (!ctx.selectedBlockId) return false;
        const idx = ctx.blocks.findIndex((b) => b.id === ctx.selectedBlockId);
        return idx >= 0 && idx < ctx.blocks.length - 1;
      },
      execute: (ctx) => {
        const idx = ctx.blocks.findIndex((b) => b.id === ctx.selectedBlockId);
        if (idx >= 0 && idx < ctx.blocks.length - 1) {
          const newBlocks = [...ctx.blocks];
          [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
          ctx.onReorderBlocks(newBlocks);
        }
      },
    },
    {
      id: 'hide_block',
      labelKey: 'commands.edit.hide',
      label: 'Hide / show block',
      icon: 'eye-off',
      group: 'edit',
      keywords: ['hide', 'show', 'visible', 'скрыть', 'показать'],
      isAvailable: isNotProfile,
      execute: (ctx) => {
        const b = getSelectedBlock(ctx);
        if (b) {
          ctx.onUpdateBlock(b.id, { hidden: !(b as any).hidden } as Partial<Block>);
          ctx.setCommandPaletteOpen(false);
        }
      },
    }
  );

  // ── Action commands ──
  commands.push(
    {
      id: 'undo',
      labelKey: 'commands.action.undo',
      label: 'Undo',
      icon: 'undo-2',
      shortcut: '⌘Z',
      group: 'action',
      keywords: ['undo', 'отменить'],
      isAvailable: (ctx) => ctx.canUndo,
      execute: (ctx) => ctx.onUndo(),
    },
    {
      id: 'redo',
      labelKey: 'commands.action.redo',
      label: 'Redo',
      icon: 'redo-2',
      shortcut: '⌘⇧Z',
      group: 'action',
      keywords: ['redo', 'повторить'],
      isAvailable: (ctx) => ctx.canRedo,
      execute: (ctx) => ctx.onRedo(),
    }
  );

  // ── Navigation commands ──
  commands.push(
    {
      id: 'nav_templates',
      labelKey: 'commands.nav.templates',
      label: 'Open templates',
      icon: 'layout-template',
      group: 'navigate',
      keywords: ['template', 'шаблон'],
      isAvailable: (ctx) => !!ctx.onOpenTemplates,
      execute: (ctx) => {
        ctx.onOpenTemplates?.();
        ctx.setCommandPaletteOpen(false);
      },
    },
    {
      id: 'nav_preview',
      labelKey: 'commands.nav.preview',
      label: 'Preview page',
      icon: 'eye',
      group: 'navigate',
      keywords: ['preview', 'предпросмотр'],
      isAvailable: (ctx) => !!ctx.onPreview,
      execute: (ctx) => {
        ctx.onPreview?.();
        ctx.setCommandPaletteOpen(false);
      },
    },
    {
      id: 'nav_share',
      labelKey: 'commands.nav.share',
      label: 'Share / Publish',
      icon: 'share-2',
      group: 'navigate',
      keywords: ['share', 'publish', 'поделиться', 'опубликовать'],
      isAvailable: (ctx) => !!ctx.onShare,
      execute: (ctx) => {
        ctx.onShare?.();
        ctx.setCommandPaletteOpen(false);
      },
    }
  );

  return commands;
}

/**
 * Filter commands by search query
 */
export function filterCommands(commands: EditorCommand[], query: string, ctx: EditorContext): EditorCommand[] {
  if (!query) {
    // Show available non-insert commands first, then first 5 inserts
    const nonInsert = commands.filter((c) => c.group !== 'insert' && c.group !== 'preset');
    const insertPreset = commands.filter((c) => c.group === 'insert' || c.group === 'preset').slice(0, 8);
    return [...nonInsert, ...insertPreset].filter((c) => c.isAvailable(ctx));
  }

  const q = query.toLowerCase();
  return commands
    .filter((c) => {
      const matchLabel = c.label.toLowerCase().includes(q);
      const matchKeywords = c.keywords?.some((k) => k.includes(q));
      return matchLabel || matchKeywords;
    })
    .sort((a, b) => {
      // Prioritize available commands
      const aAvail = a.isAvailable(ctx) ? 0 : 1;
      const bAvail = b.isAvailable(ctx) ? 0 : 1;
      return aAvail - bAvail;
    });
}
