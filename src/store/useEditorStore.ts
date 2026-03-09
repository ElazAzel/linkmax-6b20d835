import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Block } from '@/types/page';
import type { DeletedBlockInfo } from '@/types/block-editor-types';

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

            // Actions
            setEditingBlock: (block) => set({ editingBlock: block }, false, 'setEditingBlock'),

            setEditorOpen: (open) => set({ editorOpen: open }, false, 'setEditorOpen'),

            setDeletedBlocks: (updater) => set((state) => ({
                deletedBlocks: typeof updater === 'function' ? updater(state.deletedBlocks) : updater
            }), false, 'setDeletedBlocks'),

            setOperationInProgress: (inProgress) => set({ operationInProgress: inProgress }, false, 'setOperationInProgress'),

            // P2
            setSelectedBlockId: (id) => set({ selectedBlockId: id }, false, 'setSelectedBlockId'),

            setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }, false, 'setCommandPaletteOpen'),

            addRecentBlockType: (blockType) => set((state) => ({
                recentBlockTypes: [blockType, ...state.recentBlockTypes.filter(t => t !== blockType)].slice(0, MAX_RECENT)
            }), false, 'addRecentBlockType'),

            addRecentPreset: (presetId) => set((state) => ({
                recentPresets: [presetId, ...state.recentPresets.filter(p => p !== presetId)].slice(0, MAX_RECENT)
            }), false, 'addRecentPreset'),

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
            }, false, 'reset'),
        }),
        { name: 'EditorStore' }
    )
);
