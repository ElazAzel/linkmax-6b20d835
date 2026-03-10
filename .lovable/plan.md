

# P5 Completion — Wire Remaining Gaps

## What's still unwired after audit

| Module | Status |
|--------|--------|
| `BlockContextToolbar` | Created, never rendered in GridEditor |
| `useFrictionRecovery.pushEvent` | Hook mounted in EditorScreen but no events pushed |
| `useAutosaveBatcher` | Created, not integrated |
| `rankBlocksForInsert` | Created, not used in BlockInsertButton |
| `onCreateSection` prop on GridEditor | Declared but EditorScreen doesn't pass it |
| Review mode toggle UI | Store + StructureView has it, no toolbar button |
| StructureView `onBlockMoveUp/Down` | Not wired from EditorScreen |

## Implementation plan (7 changes)

### 1. GridEditor — Render BlockContextToolbar for single selected block

In `SortableGridBlockItem`, when `isSelected && !isMultiSelected`, render `BlockContextToolbar` above the block. Pass `onEdit`, `onDuplicate`, `onDelete`, `onCopy`, and `onTransform` callbacks.

**File:** `src/components/editor/GridEditor.tsx`
- Import `BlockContextToolbar`
- Add `onTransform` callback prop to `SortableGridBlockItemProps` and `GridEditorProps`
- In `SortableGridBlockItem`, when `selected && !isMultiSelected`, render `<BlockContextToolbar>` positioned absolutely above the block
- In `GridEditor`, create `handleTransform` callback using `transformBlock` from transform-engine, calling `onUpdateBlock` with the result
- Pass `onCreateSection` from `GridEditor` props through — it's already declared but EditorScreen needs to pass it

### 2. EditorScreen — Wire remaining props

**File:** `src/components/dashboard-v2/screens/EditorScreen.tsx`
- Pass `onCreateSection` to `GridEditor` (create handler using `createSection`)
- Pass `onBlockMoveUp` and `onBlockMoveDown` to StructureView (create handlers that reorder blocks)
- Add review mode buttons in quick tools bar (Problematic / CTA filter chips)
- Wire `pushEvent` calls into `onInsertBlock`, `onDeleteBlock`, undo/redo callbacks to feed friction detector

### 3. BlockInsertButton — Use insert ranker for recommended section

**File:** `src/components/editor/BlockInsertButton.tsx`
- Import `getTopRecommendedBlocks` from insert-ranker
- When `existingBlocks` are available, use ranked results to show "Recommended" blocks instead of current `getRecommendedBlocks`
- Pass position context from the divider for position-aware ranking

### 4. Friction recovery — Feed events

**File:** `src/components/dashboard-v2/screens/EditorScreen.tsx`
- Extract `pushEvent` from `useFrictionRecovery()`
- Wrap `onInsertBlock` to also call `pushEvent('block_added', blockType)`
- Wrap `onDeleteBlock` to also call `pushEvent('block_deleted')`
- Wrap `onUndo`/`onRedo` to push 'undo'/'redo' events
- This makes friction detection actually functional

### 5. Autosave batcher — Integrate into EditorScreen

**File:** `src/components/dashboard-v2/screens/EditorScreen.tsx`
- This is **deferred** since EditorScreen doesn't own the save flow — save lives in the parent dashboard hook (`useDashboard`/`usePageManager`). Integrating the batcher requires knowing where save is triggered. The hook is ready for future integration when the save flow is wired through EditorScreen.
- Add a note/comment in EditorScreen for future integration point.

### 6. StructureView — Wire move up/down from EditorScreen

**File:** `src/components/dashboard-v2/screens/EditorScreen.tsx`
- Create `handleBlockMoveUp(blockId)` and `handleBlockMoveDown(blockId)` that reorder `pageData.blocks` and call `onReorderBlocks`
- Pass to StructureView's `onBlockMoveUp` / `onBlockMoveDown` props

### 7. Review mode UI — Add toolbar toggles

**File:** `src/components/dashboard-v2/screens/EditorScreen.tsx`
- Add filter chip buttons in the quick tools bar for review modes: "Проблемные", "CTA"
- Clicking toggles `setReviewMode('problematic')` or `setReviewMode('cta_contact')`
- Active state shows highlighted chip
- Second click returns to 'normal'

## Files to modify
- `src/components/editor/GridEditor.tsx` — render BlockContextToolbar, add transform callback
- `src/components/dashboard-v2/screens/EditorScreen.tsx` — wire all remaining props, friction events, review mode UI, move up/down handlers

## What stays deferred
- Autosave batcher integration (needs parent save flow access)
- Insert ranker in BlockInsertButton (lower priority, existing recommendations work)
- Drag-and-drop across sections

