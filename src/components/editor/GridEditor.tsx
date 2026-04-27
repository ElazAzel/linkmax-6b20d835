import { memo, useCallback, useState, useMemo, useId, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Copy from 'lucide-react/dist/esm/icons/copy';
import FlaskConical from 'lucide-react/dist/esm/icons/flask-conical';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import FolderOpen from 'lucide-react/dist/esm/icons/folder-open';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { BlockRenderer } from '@/components/editor/BlockRenderer';
import { BlockInsertButton } from './BlockInsertButton';
import { InlineProfileEditor } from '../blocks/InlineProfileEditor';
import { InlineTextEditor } from './InlineTextEditor';
import { BulkActionBar } from './BulkActionBar';
import { useIsMobile } from '@/hooks/ui/use-mobile';
import { useEditorStore } from '@/store/useEditorStore';
import { ExperimentSetupDialog } from '@/components/dashboard-v2/dialogs/ExperimentSetupDialog';
import { selectRange } from '@/lib/editor/selection-engine';
import { bulkDelete, bulkDuplicate, bulkMoveUp, bulkMoveDown } from '@/lib/editor/bulk-actions';
import { copyBlock } from '@/lib/editor/clipboard-engine';
import { supportsInlineEdit } from '@/lib/editor/inline-edit-config';
import { trackEditorAction } from '@/lib/editor/editor-analytics';
import { canCreateSection, createSection, getSections, type SectionMeta } from '@/lib/editor/section-engine';
import { BlockContextToolbar } from './BlockContextToolbar';
import { FloatingBlockToolbar } from './v2/FloatingBlockToolbar';
import { transformBlock } from '@/lib/editor/transform-engine';
import { cn } from '@/lib/utils/utils';
import { BLOCK_MANIFEST } from '@/lib/blocks/block-manifest';
import { getBlockEmptyHint } from '@/lib/blocks/block-utils';
import type { Block, ProfileBlock, GridConfig, BlockType } from '@/types/page';
import { BLOCK_SIZE_DIMENSIONS } from '@/types/blocks/base';
import type { FreeTier } from '@/hooks/user/useFreemiumLimits';
import type { PremiumTier } from '@/hooks/user/usePremiumStatus';
import { motion } from 'framer-motion';

// ─── Insert-Between Divider ────────────────────────────────────────
function InsertBetweenDivider({
  position,
  onOpenInsert,
  isMobile,
}: {
  position: number;
  onOpenInsert: (position: number) => void;
  isMobile: boolean;
}) {
  return (
    <div className="relative group/divider py-1 col-span-2">
      <div className={cn(
        "flex items-center gap-2 transition-all duration-300",
        isMobile ? "opacity-100" : "opacity-0 group-hover/divider:opacity-100"
      )}>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <Button
          variant="ghost"
          type="button"
          onClick={() => onOpenInsert(position)}
          className={cn(
            "shrink-0 p-0 flex items-center justify-center rounded-full transition-all duration-300",
            "bg-primary/10 hover:bg-primary hover:text-primary-foreground border-white/20 shadow-lg shadow-primary/10",
            "active:scale-95 hover:scale-110",
            isMobile ? "h-11 w-11" : "h-7 w-7"
          )}
          aria-label="Insert block here"
        >
          <Plus className={isMobile ? "h-5 w-5" : "h-4 w-4"} strokeWidth={3} />
        </Button>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
    </div>
  );
}


interface GridEditorProps {
  blocks: Block[];
  isPremium: boolean;
  currentTier?: FreeTier;
  premiumTier?: PremiumTier;
  gridConfig?: GridConfig;
  onInsertBlock: (blockType: string, position: number) => void;
  onEditBlock: (block: Block) => void;
  onDeleteBlock: (id: string) => void;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  onReorderBlocks?: (blocks: Block[]) => void;
  onDuplicateBlock?: (id: string) => void;
  // P5: Section callbacks
  onCreateSection?: (blocks: Block[], selectedIds: Set<string>, label: string) => void;
  // P5: Transform callback
  onTransform?: (block: Block, toType: BlockType) => void;
  onInsertPreset?: (preset: import('@/lib/editor/editor-presets').BlockPreset, position: number) => void;
  pageNiche?: string;
  /** Block ID that was just inserted — gets a one-time appear animation + ring */
  recentlyAddedBlockId?: string | null;
}

interface SortableGridBlockItemProps {
  block: Block;
  onEdit: (block: Block) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onUpdateBlock?: (id: string, updates: Partial<Block>) => void;
  isPremium?: boolean;
  premiumTier?: PremiumTier;
  isDragging?: boolean;
  isMobile?: boolean;
  isSelected?: boolean;
  isMultiSelected?: boolean;
  isDimmed?: boolean;
  onStartExperiment?: (block: Block) => void;
  onBlockClick?: (block: Block, e: React.MouseEvent) => void;
  onBlockDoubleClick?: (block: Block) => void;
  onTransform?: (block: Block, toType: BlockType) => void;
  onCopy?: (block: Block) => void;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onInsertPreset?: (preset: import('@/lib/editor/editor-presets').BlockPreset) => void;
  isRecentlyAdded?: boolean;
}

function SortableGridBlockItem({
  block,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdateBlock,
  isPremium,
  premiumTier,
  isMobile = false,
  isSelected = false,
  isMultiSelected = false,
  isDimmed = false,
  onStartExperiment,
  onBlockClick,
  onBlockDoubleClick,
  onTransform,
  onCopy,
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
  isRecentlyAdded = false,
}: SortableGridBlockItemProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const blockSize = block.blockSize || 'small';
  const dimensions = BLOCK_SIZE_DIMENSIONS[blockSize] || BLOCK_SIZE_DIMENSIONS['small'];
  const colSpanClass = dimensions.gridCols === 2 ? 'col-span-2' : 'col-span-1';
  const rowSpanClass = dimensions.gridRows === 2 ? 'row-span-2' : 'row-span-1';
  const isFrameless = block.type === 'separator' || block.type === 'socials';

  // Get block type label from manifest
  const manifest = BLOCK_MANIFEST[block.type as BlockType];
  const typeLabel = manifest ? t(manifest.labelKey, block.type) : block.type;

  const selected = isSelected || isMultiSelected;

  // Empty-hint detection (e.g. link without URL)
  const emptyHint = useMemo(() => getBlockEmptyHint(block), [block]);

  // Smooth scroll into view + ring highlight when this block was just inserted
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    wrapperRef.current = node;
    setNodeRef(node);
  }, [setNodeRef]);

  useEffect(() => {
    if (isRecentlyAdded && wrapperRef.current) {
      requestAnimationFrame(() => {
        wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [isRecentlyAdded]);

  const [isHovered, setIsHovered] = useState(false);
  const showToolbar = isHovered || selected;

  return (
    <div
      ref={setRefs}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative group transition-all duration-200 rounded-2xl border-0',
        !isFrameless && 'bg-card',
        colSpanClass,
        rowSpanClass,
        isDragging && 'opacity-50 ring-2 ring-primary/50 scale-[0.98] z-50 shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.25)]',
        !isFrameless && 'min-h-[140px]',
        !isFrameless && dimensions.gridRows === 2 && 'min-h-[296px]',
        // P4: Selection ring
        selected && !isDragging && 'ring-2 ring-primary/60 ring-offset-1 ring-offset-background',
        isMultiSelected && !isDragging && 'ring-2 ring-primary/40',
        // Recently-added: glowing ring + scale-in fade
        isRecentlyAdded && !isDragging && 'ring-2 ring-primary/70 ring-offset-2 ring-offset-background animate-scale-in',
        // P5: Review mode dimming
        isDimmed && 'opacity-30 pointer-events-none',
      )}
    >
      {/* Hold-anywhere drag handle (covers full block, low priority) */}
      <div
        className={cn(
          'absolute inset-0 z-10 touch-none',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        {...attributes}
        {...listeners}
        aria-hidden="true"
      />

      {/* Block Content */}
      <div className="w-full h-full relative z-0">
        <div className="pointer-events-none w-full h-full isolate bg-card rounded-2xl overflow-hidden" data-editor-block>
          <BlockRenderer block={block} isPreview isOwnerPremium={isPremium} ownerTier={premiumTier} />
        </div>

        {/* Click Overlay — sits above hold-drag, captures click/dblclick */}
        <button
          type="button"
          className="absolute inset-0 z-20 h-auto min-h-0 cursor-pointer rounded-2xl bg-transparent p-0 shadow-none outline-none transition-colors hover:bg-accent/10 active:bg-accent/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBlockClick?.(block, e);
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBlockDoubleClick?.(block);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.currentTarget.blur();
            }
          }}
          aria-label={`Edit ${block.type} block`}
        />
      </div>

      {/* Inline editor overlay */}
      {onUpdateBlock && (
        <InlineTextEditor
          block={block}
          onSave={(id, updates) => onUpdateBlock(id, updates)}
        />
      )}

      {/* Empty-hint chip — appears when block is missing required data */}
      {emptyHint.isEmpty && !isDragging && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(block);
          }}
          className="absolute top-2 left-2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/95 backdrop-blur-md text-[10px] font-bold text-white shadow-md hover:bg-amber-500 transition-all animate-fade-in"
          aria-label={t(emptyHint.hintKey, emptyHint.hintLabel)}
        >
          <Edit2 className="h-3 w-3" />
          <span>{t(emptyHint.hintKey, emptyHint.hintLabel)}</span>
        </button>
      )}

      {/* Block type label — only on hover/select to keep canvas quiet */}
      <div
        className={cn(
          'absolute bottom-2 left-2 z-30 pointer-events-none transition-opacity duration-200',
          showToolbar && !isDragging ? 'opacity-100' : 'opacity-0',
        )}
      >
        <span className="inline-block px-1.5 py-px rounded-md bg-background/90 backdrop-blur text-[10px] font-medium text-muted-foreground uppercase tracking-wide border border-border/10">
          {typeLabel}
        </span>
      </div>

      {/* Floating toolbar — appears on hover/select. On mobile показываем при выделении */}
      <FloatingBlockToolbar
        visible={showToolbar && !isDragging && !isMultiSelected}
        isProfile={block.type === 'profile'}
        onEdit={() => onEdit(block)}
        onDuplicate={onDuplicate ? () => onDuplicate(block.id) : undefined}
        onDelete={() => onDelete(block.id)}
      />

      {/* P5: Context toolbar for single-selected block */}
      {isSelected && !isMultiSelected && !isDragging && (
        <BlockContextToolbar
          block={block}
          onEdit={onEdit}
          onDuplicate={(id) => onDuplicate?.(id)}
          onDelete={onDelete}
          onCopy={(b) => onCopy?.(b)}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onTransform={onTransform}
          isFirst={isFirst}
          isLast={isLast}
        />
      )}
    </div>
  );
}

// Drag overlay component
function DragOverlayBlockItem({ block, isPremium, premiumTier }: { block: Block; isPremium?: boolean; premiumTier?: PremiumTier }) {
  const blockSize = block.blockSize || 'small';
  const dimensions = BLOCK_SIZE_DIMENSIONS[blockSize] || BLOCK_SIZE_DIMENSIONS['small'];
  const widthClass = dimensions.gridCols === 2 ? 'w-full md:w-[600px]' : 'w-full md:w-[300px]';

  return (
    <div
      className={cn(
        'relative bg-card rounded-2xl border-2 border-primary shadow-xl overflow-visible cursor-grabbing',
        widthClass,
        dimensions.gridRows === 2 ? 'h-[296px]' : 'h-[140px]'
      )}
    >
      <div className="w-full h-full overflow-hidden opacity-80" data-editor-block>
        <BlockRenderer block={block} isPreview isOwnerPremium={isPremium} ownerTier={premiumTier} />
      </div>
      <div className="absolute top-0 right-0 z-40 p-3 pt-3 pr-3">
        <div className="bg-primary/20 p-2 rounded-xl">
          <GripVertical className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

// ─── Section Header in Grid ────────────────────────────────────
function SectionHeader({
  label,
  blockCount,
  isCollapsed,
  onToggleCollapse,
}: {
  label: string;
  blockCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <div className="col-span-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/10">
      <Button variant="ghost" className="h-auto p-0.5 hover:bg-transparent" onClick={onToggleCollapse}>
        <ChevronRight className={cn(
          'h-4 w-4 text-muted-foreground transition-transform',
          !isCollapsed && 'rotate-90'
        )} />
      </Button>
      <FolderOpen className="h-4 w-4 text-primary shrink-0" />
      <span className="text-xs font-bold text-foreground flex-1 truncate">{label}</span>
      <span className="text-xs text-muted-foreground">{blockCount}</span>
    </div>
  );
}

export const GridEditor = memo(function GridEditor({
  blocks,
  isPremium,
  currentTier = 'identity',
  premiumTier,
  gridConfig,
  onInsertBlock,
  onEditBlock,
  onDeleteBlock,
  onUpdateBlock,
  onReorderBlocks,
  onDuplicateBlock,
  onCreateSection,
  onTransform,
  onInsertPreset,
  pageNiche,
  recentlyAddedBlockId,
}: GridEditorProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [experimentBlock, setExperimentBlock] = useState<Block | null>(null);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [sectionNameInput, setSectionNameInput] = useState('');

  const dndContextId = useId();

  // P4: Multi-select state + P5: section/review state
  const {
    selectedBlockIds,
    lastSelectedId,
    toggleBlockSelection,
    setSelectedBlockIds,
    clearSelection,
    setClipboardContent,
    setInlineEditing,
    sectionMeta,
    collapsedSections,
    toggleSectionCollapse,
    setSectionMeta,
    reviewMode,
  } = useEditorStore();

  const profileBlock = blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;
  const contentBlocks = blocks.filter(b => b.type !== 'profile');

  // P5: Derive sections for rendering
  const sections = useMemo(() => getSections(blocks), [blocks]);
  const sectionBlockIds = useMemo(() => {
    const set = new Set<string>();
    sections.forEach(s => s.blockIds.forEach(id => set.add(id)));
    return set;
  }, [sections]);

  // P5: Review mode - determine dimmed blocks
  const reviewDimmedIds = useMemo(() => {
    if (reviewMode === 'normal') return new Set<string>();
    const ctaTypes = new Set(['button', 'link', 'messenger', 'form', 'booking', 'newsletter']);
    const dimmed = new Set<string>();
    contentBlocks.forEach(b => {
      if (reviewMode === 'cta_contact' && !ctaTypes.has(b.type)) {
        dimmed.add(b.id);
      }
      // Other review modes can be added here
    });
    return dimmed;
  }, [reviewMode, contentBlocks]);

  // P5: Can create section from current selection
  const canGroup = useMemo(() => canCreateSection(blocks, selectedBlockIds), [blocks, selectedBlockIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 }
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeBlock = activeId ? contentBlocks.find(b => b.id === activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = contentBlocks.findIndex(b => b.id === active.id);
      const newIndex = contentBlocks.findIndex(b => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedContent = arrayMove(contentBlocks, oldIndex, newIndex);
        const newBlocks = profileBlock ? [profileBlock, ...reorderedContent] : reorderedContent;
        onReorderBlocks?.(newBlocks);
      }
    }
  }, [contentBlocks, profileBlock, onReorderBlocks]);

  const [insertSheetOpen, setInsertSheetOpen] = useState(false);
  const [insertPosition, setInsertPosition] = useState(blocks.length);
  const lastInsertSheetCloseAtRef = useRef(0);

  const openInsertSheet = useCallback((position: number) => {
    if (Date.now() - lastInsertSheetCloseAtRef.current < 250) {
      return;
    }

    setInsertPosition(position);
    setInsertSheetOpen(true);
  }, []);

  const handleInsertSheetOpenChange = useCallback((open: boolean) => {
    if (!open) {
      lastInsertSheetCloseAtRef.current = Date.now();
    }

    setInsertSheetOpen(open);
  }, []);

  const handleInsertBlock = useCallback((blockType: string, position: number) => {
    onInsertBlock(blockType, position);
  }, [onInsertBlock]);

  const handleInsertPreset = useCallback((preset: import('@/lib/editor/editor-presets').BlockPreset, position: number) => {
    if (onInsertPreset) {
      onInsertPreset(preset, position);
    } else {
      onInsertBlock(preset.blockType, position);
    }
  }, [onInsertPreset, onInsertBlock]);

  const handleSharedInsert = useCallback((blockType: string) => {
    handleInsertBlock(blockType, insertPosition);
  }, [handleInsertBlock, insertPosition]);

  const handleSharedInsertPreset = useCallback((preset: import('@/lib/editor/editor-presets').BlockPreset) => {
    handleInsertPreset(preset, insertPosition);
  }, [handleInsertPreset, insertPosition]);

  // P4: Block click handler with multi-select support
  const handleBlockClick = useCallback((block: Block, e: React.MouseEvent) => {
    const meta = e.metaKey || e.ctrlKey;
    const shift = e.shiftKey;

    if (meta) {
      toggleBlockSelection(block.id, true);
      trackEditorAction('selection_changed', { blockType: block.type, source: 'grid' });
    } else if (shift && lastSelectedId) {
      const range = selectRange(blocks, lastSelectedId, block.id);
      setSelectedBlockIds(range);
      trackEditorAction('selection_changed', { blockType: block.type, source: 'grid' });
    } else {
      toggleBlockSelection(block.id, false);
    }
  }, [toggleBlockSelection, lastSelectedId, blocks, setSelectedBlockIds]);

  // P4: Double-click handler for inline edit
  const handleBlockDoubleClick = useCallback((block: Block) => {
    if (supportsInlineEdit(block.type as BlockType)) {
      setInlineEditing(block.id);
      trackEditorAction('inline_edit_opened', { blockType: block.type, source: 'grid' });
    } else {
      onEditBlock(block);
    }
  }, [setInlineEditing, onEditBlock]);

  // P4: Bulk action handlers
  const handleBulkDelete = useCallback(() => {
    const result = bulkDelete(blocks, selectedBlockIds);
    if (result.success && result.newBlocks) {
      for (const id of result.affectedIds) {
        onDeleteBlock(id);
      }
      clearSelection();
      trackEditorAction('bulk_action_used', { source: 'grid' });
    }
  }, [blocks, selectedBlockIds, onDeleteBlock, clearSelection]);

  const handleBulkDuplicate = useCallback(() => {
    for (const id of selectedBlockIds) {
      const block = blocks.find(b => b.id === id);
      if (block && block.type !== 'profile') {
        onDuplicateBlock?.(id);
      }
    }
    trackEditorAction('bulk_action_used', { source: 'grid' });
  }, [blocks, selectedBlockIds, onDuplicateBlock]);

  const handleBulkMoveUp = useCallback(() => {
    const result = bulkMoveUp(blocks, selectedBlockIds);
    if (result.success && result.newBlocks) {
      onReorderBlocks?.(result.newBlocks);
    }
  }, [blocks, selectedBlockIds, onReorderBlocks]);

  const handleBulkMoveDown = useCallback(() => {
    const result = bulkMoveDown(blocks, selectedBlockIds);
    if (result.success && result.newBlocks) {
      onReorderBlocks?.(result.newBlocks);
    }
  }, [blocks, selectedBlockIds, onReorderBlocks]);

  // P5: Create section from selection - open dialog
  const handleCreateSectionClick = useCallback(() => {
    if (!canGroup) return;
    setSectionNameInput(t('editor.newSection', 'Новая секция'));
    setSectionDialogOpen(true);
  }, [canGroup, t]);

  const handleCreateSectionConfirm = useCallback(() => {
    const label = sectionNameInput.trim();
    if (!label) return;
    const result = createSection(blocks, selectedBlockIds, label);
    onReorderBlocks?.(result.blocks);
    setSectionMeta(result.section.id, result.section);
    clearSelection();
    trackEditorAction('section_created', { source: 'grid' });
    setSectionDialogOpen(false);
    setSectionNameInput('');
  }, [sectionNameInput, blocks, selectedBlockIds, onReorderBlocks, setSectionMeta, clearSelection]);

  // P5: Transform handler
  const handleTransform = useCallback((block: Block, toType: BlockType) => {
    if (onTransform) {
      onTransform(block, toType);
    } else {
      const result = transformBlock(block, toType);
      if (result.success) {
        onUpdateBlock(block.id, result.newBlock);
        trackEditorAction('transform_used', { source: 'grid', blockType: `${block.type}->${toType}` });
      }
    }
  }, [onTransform, onUpdateBlock]);

  // P5: Copy handler for context toolbar
  const handleCopyBlock = useCallback((block: Block) => {
    const clipData = copyBlock(block);
    setClipboardContent(clipData);
    trackEditorAction('block_copied', { blockType: block.type, source: 'grid' });
  }, [setClipboardContent]);

  // Build grid items with section headers
  const gridItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    const profileOffset = profileBlock ? 1 : 0;
    let currentSectionId: string | undefined;

    contentBlocks.forEach((block, index) => {
      const blockSectionId = (block as any).sectionId as string | undefined;

      // Insert section header when entering a new section
      if (blockSectionId && blockSectionId !== currentSectionId) {
        const meta = sectionMeta.get(blockSectionId);
        const section = sections.find(s => s.id === blockSectionId);
        const isCollapsed = collapsedSections.has(blockSectionId);
        items.push(
          <SectionHeader
            key={`section-${blockSectionId}`}
            label={meta?.label || t('editor.section', 'Секция')}
            blockCount={section?.blockIds.length || 0}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => toggleSectionCollapse(blockSectionId)}
          />
        );
      }
      currentSectionId = blockSectionId;

      // Skip blocks in collapsed sections
      if (blockSectionId && collapsedSections.has(blockSectionId)) {
        return;
      }

      items.push(
        <InsertBetweenDivider
          key={`divider-${block.id}`}
          position={index + profileOffset}
          onOpenInsert={openInsertSheet}
          isMobile={isMobile}
        />
      );
      items.push(
        <SortableGridBlockItem
          key={block.id}
          block={block}
          onEdit={onEditBlock}
          onDelete={onDeleteBlock}
          onDuplicate={onDuplicateBlock}
          onUpdateBlock={onUpdateBlock}
          isPremium={isPremium}
          premiumTier={premiumTier}
          isMobile={isMobile}
          isSelected={selectedBlockIds.size <= 1 && selectedBlockIds.has(block.id)}
          isMultiSelected={selectedBlockIds.size > 1 && selectedBlockIds.has(block.id)}
          isDimmed={reviewDimmedIds.has(block.id)}
          onStartExperiment={setExperimentBlock}
          onBlockClick={handleBlockClick}
          onBlockDoubleClick={handleBlockDoubleClick}
          onTransform={handleTransform}
          onCopy={handleCopyBlock}
          isFirst={index === 0}
          isLast={index === contentBlocks.length - 1}
          onMoveUp={index > 0 ? () => {
            const reordered = arrayMove(contentBlocks, index, index - 1);
            onReorderBlocks?.(profileBlock ? [profileBlock, ...reordered] : reordered);
          } : undefined}
          onMoveDown={index < contentBlocks.length - 1 ? () => {
            const reordered = arrayMove(contentBlocks, index, index + 1);
            onReorderBlocks?.(profileBlock ? [profileBlock, ...reordered] : reordered);
          } : undefined}
          isRecentlyAdded={recentlyAddedBlockId === block.id}
        />
      );
    });

    return items;
  }, [contentBlocks, profileBlock, handleInsertBlock, handleInsertPreset, isPremium, currentTier, blocks.length, isMobile, onEditBlock, onDeleteBlock, onDuplicateBlock, onUpdateBlock, premiumTier, selectedBlockIds, handleBlockClick, handleBlockDoubleClick, sectionMeta, sections, collapsedSections, toggleSectionCollapse, reviewDimmedIds, t, onReorderBlocks, recentlyAddedBlockId]);

  return (
    <div className="max-w-2xl mx-auto px-[var(--space-page-px)] py-4 space-y-2 pb-32 md:pb-24">
      {/* Profile block — also gets data-editor-block for anti-blur */}
      {profileBlock && (
        <div className="relative isolate bg-card rounded-2xl overflow-hidden" data-onboarding="profile-block" data-editor-block>
          <InlineProfileEditor
            block={profileBlock}
            onUpdate={(updates) => onUpdateBlock(profileBlock.id, updates)}
          />
        </div>
      )}

      {/* Grid container */}
      <DndContext
        key={dndContextId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={contentBlocks.map(b => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-2 xs:grid-cols-2 gap-2 sm:gap-3 grid-flow-row-dense">
            {gridItems}
          </div>
        </SortableContext>

        <DragOverlay adjustScale={true}>
          {activeBlock && (
            <DragOverlayBlockItem block={activeBlock} isPremium={isPremium} premiumTier={premiumTier} />
          )}
        </DragOverlay>
      </DndContext>

      {/* Subtle bottom add — quiet hint, not a duplicate CTA. Primary action lives in SmartActionDock. */}
      {contentBlocks.length > 0 && (
        <motion.button
          type="button"
          onClick={() => openInsertSheet(blocks.length)}
          className="w-full mt-4 h-14 rounded-2xl border border-dashed border-border/40 bg-transparent hover:bg-accent/30 hover:border-border transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25 }}
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">
            {t('editor.insert.addBelow', 'Добавить блок ниже')}
          </span>
        </motion.button>
      )}

      {/* Empty state — single, generous, friendly */}
      {contentBlocks.length === 0 && (
        <motion.div
          className="text-center py-16 px-6 mt-2 rounded-3xl bg-gradient-to-br from-primary/5 via-card to-card border border-border/10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Plus className="h-7 w-7 text-primary" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {t('dashboard.empty.title', 'Соберите страницу за минуту')}
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
            {t('dashboard.empty.desc', 'Начните с оффера, кнопки или мессенджера — всё, чтобы получить первого клиента.')}
          </p>
          <button
            type="button"
            onClick={() => openInsertSheet(blocks.length)}
            data-onboarding="add-block"
            className="inline-flex items-center gap-2 h-11 rounded-xl px-5 bg-primary text-primary-foreground font-semibold text-sm shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.4)] hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            {t('dashboard.empty.cta', 'Добавить первый блок')}
          </button>
        </motion.div>
      )}

      <BlockInsertButton
        onInsert={handleSharedInsert}
        onInsertPreset={handleSharedInsertPreset}
        isPremium={isPremium}
        currentTier={currentTier}
        currentBlockCount={blocks.length}
        pageNiche={pageNiche}
        existingBlocks={blocks.map(b => b.type as BlockType)}
        isOpen={insertSheetOpen}
        onOpenChange={handleInsertSheetOpenChange}
        hideTrigger
      />

      {/* P4: Bulk Action Bar - P5: with section creation */}
      <BulkActionBar
        selectedCount={selectedBlockIds.size}
        onDuplicate={handleBulkDuplicate}
        onDelete={handleBulkDelete}
        onMoveUp={handleBulkMoveUp}
        onMoveDown={handleBulkMoveDown}
        onClearSelection={clearSelection}
        onCreateSection={handleCreateSectionClick}
        canCreateSection={canGroup}
      />

      {/* Experiment Setup Dialog */}
      {experimentBlock && (
        <ExperimentSetupDialog
          isOpen={!!experimentBlock}
          onOpenChange={(open) => !open && setExperimentBlock(null)}
          pageId={(profileBlock as any)?.page_id || ''}
          block={experimentBlock}
        />
      )}

      {/* Section Name Dialog */}
      <AlertDialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('editor.sectionName', 'Имя секции')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('editor.sectionNameDescription', 'Введите название для новой секции')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={sectionNameInput}
            onChange={(e) => setSectionNameInput(e.target.value)}
            placeholder={t('editor.newSection', 'Новая секция')}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSectionConfirm();
            }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Отмена')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateSectionConfirm}>
              {t('common.create', 'Создать')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
