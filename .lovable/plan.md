

# P5 Completion Plan — Wire Everything End-to-End

## Audit: What's broken/unwired

| Module | Status | Used by |
|--------|--------|---------|
| `section-engine.ts` | Created | Only type import in store |
| `transform-engine.ts` | Created | Nothing |
| `friction-detector.ts` | Created | Nothing |
| `autosave-batcher.ts` | Created | Nothing |
| `insert-ranker.ts` | Created | Nothing |
| `history-compressor.ts` | Created | ✅ wired in useEditorHistory |
| Store: `sectionMeta`, `collapsedSections`, `reviewMode` | Declared | No component reads them |
| StructureView | Basic flat list | No sections, no filters, no badges |

## Implementation Plan (in priority order)

### 1. StructureView 2.0 — Full rewrite
**File: `src/components/editor/StructureView.tsx`**

This is the highest-leverage change because it surfaces sections, quality, and review modes.

- Add section tree display: group blocks by `sectionId`, show section headers with collapse toggle
- Add quality badge dots (green/yellow/red) per block from `BlockQualityReport[]` (new prop)
- Add filter chips: All | Problematic | Hidden | CTA/Contact
- Add search input filtering by block title/type
- Add section actions: create from selection, rename, collapse, dissolve, duplicate, delete
- Accept new props: `blockQuality`, `intelligence`, `selectedBlockIds`, `reviewMode`, `sectionMeta`, `collapsedSections`
- Section header UI: label, collapse/expand toggle, section action dropdown
- Wire section operations through new callbacks: `onCreateSection`, `onDissolveSection`, `onRenameSection`, `onToggleSectionCollapse`

### 2. GridEditor — Section & review mode integration
**File: `src/components/editor/GridEditor.tsx`**

- Read `collapsedSections` and `sectionMeta` from store
- Render section headers between blocks when `sectionId` changes
- Collapsed sections: render header only, skip block rendering
- Read `reviewMode` from store; when not 'normal', dim/collapse non-matching blocks
- Add "Create section" action to BulkActionBar when 2+ blocks selected
- Section header component: inline label, collapse toggle, quick actions dropdown

### 3. EditorScreen — Pass intelligence + section/review state down
**File: `src/components/dashboard-v2/screens/EditorScreen.tsx`**

- Pass `intelligence` (already computed) to StructureView and GridEditor
- Add Structure View button to toolbar (already exists as `History` button pattern)
- Add review mode toggle buttons to toolbar
- Wire section CRUD operations via block array mutations (using section-engine pure functions)
- Pass section callbacks to GridEditor and StructureView

### 4. Transform engine UI integration
**File: `src/components/editor/BlockContextToolbar.tsx`**

- Import `getTransformTargets` from transform-engine
- Add "Convert to..." button that shows dropdown of valid targets
- Show lossy field warnings inline
- On confirm: call `transformBlock`, update block via `onUpdateBlock`
- Track `transform_used` analytics event

### 5. Friction recovery wiring
**New file: `src/hooks/editor/useFrictionRecovery.ts`**

- Create hook that manages `EditorEventBuffer` instance
- Expose `pushEvent(type, blockType?, blockId?)` function
- Run `detect()` on each event push
- Return current `FrictionSignal | null`
- Wire into EditorScreen: show unobtrusive hint banner (same pattern as intelligence hint)
- Push events from: add/delete/undo/redo handlers, editor open/close, palette open/close

### 6. Autosave batcher — Wrap in hook
**New file: `src/hooks/editor/useAutosaveBatcher.ts`**

- Create hook wrapping `AutosaveBatcher` class
- Accept the save callback from dashboard
- Expose `enqueue(type: MutationType)` 
- Auto-cleanup on unmount
- Wire into EditorScreen/dashboard save flow by having the parent pass `onSave` through the batcher

### 7. Insert ranker wiring
**File: `src/components/editor/BlockInsertButton.tsx`**

- Import `rankBlocksForInsert` from insert-ranker
- Use ranked results to sort the "recommended" section instead of current `getRecommendedBlocks`
- Pass position context (insert-between divider position) for position-aware ranking

### 8. Block add popup close bug check
**File: `src/components/editor/BlockInsertButton.tsx`**

The current flow looks correct: `handleInsert` calls `setIsOpen(false)` synchronously before `onInsert`. But there may be a race if `onInsert` triggers a re-render that resets `isOpen`. Need to verify the `InsertBetweenDivider` in GridEditor properly closes after insert — it uses local `sheetOpen` state and passes `onInsert` without closing. **Bug found**: `InsertBetweenDivider.handleInsert` calls `onInsert(blockType, position)` but does NOT close the sheet — the sheet close happens inside `BlockInsertButton.handleInsert` which calls `setIsOpen(false)`. This should work because `BlockInsertButton` manages `isOpen` via the `externalIsOpen`/`onOpenChange` props. Looks correct, but will verify the sequencing.

### 9. Cleanup pass
- Remove unused imports
- Verify all new store fields are consumed
- Verify analytics events are tracked for section/transform/friction actions
- Memoize section derivation in GridEditor (call `getSections()` once in useMemo)

## Key architectural decisions

1. **Sections stay flat**: `sectionId` on blocks, metadata in store. No nested tree.
2. **Review mode = filter function**: A derived selector `getReviewFilteredIds(blocks, reviewMode, intelligence)` determines visible blocks. Non-matching blocks get `opacity-30` + collapsed, not removed.
3. **Friction recovery = singleton buffer**: One `EditorEventBuffer` per editor session via hook, resets on page change.
4. **Autosave batcher = optional wrapper**: Wraps existing save, doesn't replace it. Enqueue calls replace direct save calls.
5. **Transform = in-place block update**: Uses `onUpdateBlock(id, transformedBlock)` — single history entry.

## Files to create
- `src/hooks/editor/useFrictionRecovery.ts`
- `src/hooks/editor/useAutosaveBatcher.ts`

## Files to modify
- `src/components/editor/StructureView.tsx` — major rewrite
- `src/components/editor/GridEditor.tsx` — section headers, review mode, create-section in bulk bar
- `src/components/dashboard-v2/screens/EditorScreen.tsx` — wire intelligence, structure view, review mode, section ops, friction
- `src/components/editor/BlockContextToolbar.tsx` — add transform action
- `src/components/editor/BulkActionBar.tsx` — add "Group into section" button
- `src/components/editor/BlockInsertButton.tsx` — use insert-ranker
- `src/store/useEditorStore.ts` — minor: export ReviewMode type already done

## What stays for next phase
- Drag-and-drop across sections (complex DnD rework)
- Section templates/presets
- Section-level scoring
- Full friction analytics dashboard
- ML-based recommendation re-ranking

