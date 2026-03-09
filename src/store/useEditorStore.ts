import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Block } from '@/types/page';
import type { DeletedBlockInfo } from '@/types/block-editor-types';
import type { ClipboardData, StyleData, ClipboardContent } from '@/lib/editor/clipboard-engine';
import type { SectionMeta } from '@/lib/editor/section-engine';

type StructureFilter = 'all' | 'incomplete' | 'hidden' | 'cta' | 'contact';
export type ReviewMode = 'normal' | 'problematic' | 'cta_contact' | 'hidden' | 'incomplete';

interface EditorState {
    // State
    editingBlock: Block | null;
    editorOpen: boolean;
    deletedBlocks: DeletedBlockInfo[];
    operationInProgress: boolean;

    // P2: Selection & palette
    selectedBlockId: string | null;
    commandPaletteOpen: boolean;
    recentBlockTypes: string[];
    recentPresets: string[];

    // P4: Multi-select
    selectedBlockIds: Set<string>;
    lastSelectedId: string | null;

    // P4: Clipboard
    clipboardContent: ClipboardContent | null;

    // P4: Inline edit
    inlineEditingBlockId: string | null;
    inlineEditField: string | null;

    // P4: Structure view
    structureViewFilters: StructureFilter[];

    // P5: Sections
    sectionMeta: Map<string, SectionMeta>;
    collapsedSections: Set<string>;

    // P5: Review modes
    reviewMode: ReviewMode;

    // Actions
    setEditingBlock: (block: Block | null) => void;
    setEditorOpen: (open: boolean) => void;
    setDeletedBlocks: (blocks: DeletedBlockInfo[] | ((prev: DeletedBlockInfo[]) => DeletedBlockInfo[])) => void;
    setOperationInProgress: (inProgress: boolean) => void;

    // P2 Actions
    setSelectedBlockId: (id: string | null) => void;
    setCommandPaletteOpen: (open: boolean) => void;
    addRecentBlockType: (blockType: string) => void;
    addRecentPreset: (presetId: string) => void;

    // P4 Actions: Multi-select
    toggleBlockSelection: (id: string, additive: boolean) => void;
    setSelectedBlockIds: (ids: Set<string>) => void;
    clearSelection: () => void;
    selectAllBlocks: (blockIds: string[]) => void;

    // P4 Actions: Clipboard
    setClipboardContent: (content: ClipboardContent | null) => void;

    // P4 Actions: Inline edit
    setInlineEditing: (blockId: string | null, field?: string | null) => void;

    // P4 Actions: Structure view
    setStructureViewFilters: (filters: StructureFilter[]) => void;
    toggleStructureFilter: (filter: StructureFilter) => void;

    // P5 Actions: Sections
    setSectionMeta: (id: string, meta: SectionMeta) => void;
    removeSectionMeta: (id: string) => void;
    toggleSectionCollapse: (id: string) => void;

    // P5 Actions: Review mode
    setReviewMode: (mode: ReviewMode) => void;

    // Helpers
    closeEditor: () => void;
    reset: () => void;
}

const MAX_RECENT = 5;

export const useEditorStore = create<EditorState>()(
    devtools(
        (set) => ({
            // Initial State
            editingBlock: null,
            editorOpen: false,
            deletedBlocks: [],
            operationInProgress: false,
            selectedBlockId: null,
            commandPaletteOpen: false,
            recentBlockTypes: [],
            recentPresets: [],

            // P4 Initial State
            selectedBlockIds: new Set<string>(),
            lastSelectedId: null,
            clipboardContent: null,
            inlineEditingBlockId: null,
            inlineEditField: null,
            structureViewFilters: ['all'],

            // P5 Initial State
            sectionMeta: new Map<string, SectionMeta>(),
            collapsedSections: new Set<string>(),
            reviewMode: 'normal' as ReviewMode,

            // Actions
            setEditingBlock: (block) => set({ editingBlock: block }, false, 'setEditingBlock'),

            setEditorOpen: (open) => set({ editorOpen: open }, false, 'setEditorOpen'),

            setDeletedBlocks: (updater) => set((state) => ({
                deletedBlocks: typeof updater === 'function' ? updater(state.deletedBlocks) : updater
            }), false, 'setDeletedBlocks'),

            setOperationInProgress: (inProgress) => set({ operationInProgress: inProgress }, false, 'setOperationInProgress'),

            // P2
            setSelectedBlockId: (id) => set({ 
                selectedBlockId: id,
                selectedBlockIds: id ? new Set([id]) : new Set<string>(),
                lastSelectedId: id,
            }, false, 'setSelectedBlockId'),

            setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }, false, 'setCommandPaletteOpen'),

            addRecentBlockType: (blockType) => set((state) => ({
                recentBlockTypes: [blockType, ...state.recentBlockTypes.filter(t => t !== blockType)].slice(0, MAX_RECENT)
            }), false, 'addRecentBlockType'),

            addRecentPreset: (presetId) => set((state) => ({
                recentPresets: [presetId, ...state.recentPresets.filter(p => p !== presetId)].slice(0, MAX_RECENT)
            }), false, 'addRecentPreset'),

            // P4: Multi-select
            toggleBlockSelection: (id, additive) => set((state) => {
                if (additive) {
                    const next = new Set(state.selectedBlockIds);
                    if (next.has(id)) {
                        next.delete(id);
                    } else {
                        next.add(id);
                    }
                    return { 
                        selectedBlockIds: next, 
                        selectedBlockId: next.size === 1 ? [...next][0] : null,
                        lastSelectedId: id,
                    };
                }
                return { 
                    selectedBlockIds: new Set([id]), 
                    selectedBlockId: id,
                    lastSelectedId: id,
                };
            }, false, 'toggleBlockSelection'),

            setSelectedBlockIds: (ids) => set({ 
                selectedBlockIds: ids,
                selectedBlockId: ids.size === 1 ? [...ids][0] : null,
                lastSelectedId: ids.size > 0 ? [...ids][ids.size - 1] : null,
            }, false, 'setSelectedBlockIds'),

            clearSelection: () => set({ 
                selectedBlockIds: new Set<string>(), 
                selectedBlockId: null,
                lastSelectedId: null,
                inlineEditingBlockId: null,
                inlineEditField: null,
            }, false, 'clearSelection'),

            selectAllBlocks: (blockIds) => set({ 
                selectedBlockIds: new Set(blockIds),
                selectedBlockId: null,
                lastSelectedId: blockIds[blockIds.length - 1] ?? null,
            }, false, 'selectAllBlocks'),

            // P4: Clipboard
            setClipboardContent: (content) => set({ clipboardContent: content }, false, 'setClipboardContent'),

            // P4: Inline edit
            setInlineEditing: (blockId, field = null) => set({ 
                inlineEditingBlockId: blockId, 
                inlineEditField: field 
            }, false, 'setInlineEditing'),

            // P4: Structure view filters
            setStructureViewFilters: (filters) => set({ structureViewFilters: filters }, false, 'setStructureViewFilters'),

            toggleStructureFilter: (filter) => set((state) => {
                if (filter === 'all') {
                    return { structureViewFilters: ['all'] as StructureFilter[] };
                }
                const current = state.structureViewFilters.filter(f => f !== 'all');
                const hasFilter = current.includes(filter);
                const next = hasFilter 
                    ? current.filter(f => f !== filter)
                    : [...current, filter];
                return { 
                    structureViewFilters: next.length === 0 ? ['all'] as StructureFilter[] : next as StructureFilter[]
                };
            }, false, 'toggleStructureFilter'),

            // P5: Sections
            setSectionMeta: (id, meta) => set((state) => {
                const next = new Map(state.sectionMeta);
                next.set(id, meta);
                return { sectionMeta: next };
            }, false, 'setSectionMeta'),

            removeSectionMeta: (id) => set((state) => {
                const next = new Map(state.sectionMeta);
                next.delete(id);
                const collapsed = new Set(state.collapsedSections);
                collapsed.delete(id);
                return { sectionMeta: next, collapsedSections: collapsed };
            }, false, 'removeSectionMeta'),

            toggleSectionCollapse: (id) => set((state) => {
                const next = new Set(state.collapsedSections);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return { collapsedSections: next };
            }, false, 'toggleSectionCollapse'),

            // P5: Review mode
            setReviewMode: (mode) => set({ reviewMode: mode }, false, 'setReviewMode'),

            closeEditor: () => {
                set({ editorOpen: false }, false, 'closeEditor');
                setTimeout(() => {
                    set({ editingBlock: null }, false, 'clearEditingBlock');
                }, 350);
            },

            reset: () => set({
                editingBlock: null,
                editorOpen: false,
                deletedBlocks: [],
                operationInProgress: false,
                selectedBlockId: null,
                commandPaletteOpen: false,
                recentBlockTypes: [],
                recentPresets: [],
                selectedBlockIds: new Set<string>(),
                lastSelectedId: null,
                clipboardContent: null,
                inlineEditingBlockId: null,
                inlineEditField: null,
                structureViewFilters: ['all'],
                sectionMeta: new Map(),
                collapsedSections: new Set<string>(),
                reviewMode: 'normal' as ReviewMode,
            }, false, 'reset'),
        }),
        { name: 'EditorStore' }
    )
);
