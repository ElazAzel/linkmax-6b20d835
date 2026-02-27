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

    // Actions
    setEditingBlock: (block: Block | null) => void;
    setEditorOpen: (open: boolean) => void;
    setDeletedBlocks: (blocks: DeletedBlockInfo[] | ((prev: DeletedBlockInfo[]) => DeletedBlockInfo[])) => void;
    setOperationInProgress: (inProgress: boolean) => void;

    // Helpers
    closeEditor: () => void;
    reset: () => void;
}

export const useEditorStore = create<EditorState>()(
    devtools(
        (set) => ({
            // Initial State
            editingBlock: null,
            editorOpen: false,
            deletedBlocks: [],
            operationInProgress: false,

            // Actions
            setEditingBlock: (block) => set({ editingBlock: block }, false, 'setEditingBlock'),

            setEditorOpen: (open) => set({ editorOpen: open }, false, 'setEditorOpen'),

            setDeletedBlocks: (updater) => set((state) => ({
                deletedBlocks: typeof updater === 'function' ? updater(state.deletedBlocks) : updater
            }), false, 'setDeletedBlocks'),

            setOperationInProgress: (inProgress) => set({ operationInProgress: inProgress }, false, 'setOperationInProgress'),

            closeEditor: () => {
                set({ editorOpen: false }, false, 'closeEditor');
                // Delay clearing editingBlock for animations
                setTimeout(() => {
                    set({ editingBlock: null }, false, 'clearEditingBlock');
                }, 350);
            },

            reset: () => set({
                editingBlock: null,
                editorOpen: false,
                deletedBlocks: [],
                operationInProgress: false,
            }, false, 'reset'),
        }),
        { name: 'EditorStore' }
    )
);
