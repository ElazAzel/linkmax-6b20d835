

# Block Editor UX Overhaul — Plan

## A. Verdict

**What's strong:**
- Solid manifest-driven architecture (`BLOCK_MANIFEST` → renderer + editor + icon + category). Single source of truth works.
- `BlockEditorShell` is a good unified container with autosave, tabs, preview, Cmd+S.
- `EditorSection` / `EditorField` give consistent structure inside editors.
- `withBlockEditor` HOC adds advanced settings (style, animation, schedule, paid content) uniformly.
- Undo/redo history exists (7-step, `useEditorHistory`).
- Mobile: swipe gestures, long-press actions sheet, haptic feedback, FAB.
- Insert-between dividers exist in `GridEditor`.

**What's weak:**

1. **No insert-between on grid**: `InsertBetweenDivider` is defined but never rendered in the grid layout. The grid only has a bottom "+" and mobile FAB. Users can't insert blocks between existing ones in the primary editor view.

2. **GridEditor block cards have no block type label or content summary.** Cards show a preview render behind `pointer-events-none` overlay + edit/delete buttons. User can't quickly identify what a block contains without clicking.

3. **Duplicate action missing from GridEditor.** `MobileBlockActions` supports duplicate, but `GridEditor.SortableGridBlockItem` doesn't wire it. No duplicate button on the card.

4. **Two parallel block list UIs**: `GridEditor` (grid view, primary) and `DraggableBlockList` (list view, used by StructureView). `DraggableBlockList` has hardcoded Russian titles (`getBlockTitle`), duplicates icon mapping, and is a separate interaction model from the grid.

5. **BlockInsertButton has duplicate block config.** `ALL_BLOCKS` in `BlockInsertButton.tsx` is a separate copy of block metadata from `BLOCK_MANIFEST` and `BLOCK_REGISTRY`. Icons, tiers, and categories are maintained in 3 places.

6. **Click-to-edit is the only interaction.** Every block edit requires opening the full editor drawer/dialog. No quick edit for simple fields (text content, link URL, button label).

7. **Block completeness is invisible.** No indicator on the grid card showing whether a block has empty required fields, missing content, or is publish-ready.

8. **StructureView has its own icon map** (`BLOCK_ICONS`) separate from manifest, creating drift risk.

## B. P0 / P1 / P2 Roadmap

### P0 — Ship immediately (biggest UX impact)

| # | Change | Impact |
|---|--------|--------|
| 1 | **Insert-between in GridEditor** | Currently impossible to add blocks between existing ones in the grid |
| 2 | **Block type label on grid cards** | Show small type badge (e.g., "Ссылка", "Текст") on each card so users can identify blocks without opening them |
| 3 | **Duplicate button on grid cards** | Add duplicate action next to edit/delete on each card |
| 4 | **Unify BlockInsertButton with BLOCK_MANIFEST** | Remove duplicate `ALL_BLOCKS` config, derive from manifest |
| 5 | **Unify StructureView icons with manifest** | Remove duplicate `BLOCK_ICONS`, use `getBlockIcon()` from manifest |

### P1 — Strong improvements (next sprint)

| # | Change |
|---|--------|
| 6 | Block completeness indicator (dot/badge on card for empty blocks) |
| 7 | Quick inline edit for text/link/button blocks (click-to-edit title/URL without opening full editor) |
| 8 | Keyboard shortcuts (Cmd+Z, Cmd+Shift+Z wired globally in editor) |
| 9 | Last-used blocks section in insert panel |
| 10 | Better empty state with niche-aware starter suggestions |

### P2 — Advanced

| # | Change |
|---|--------|
| 11 | Command palette for blocks/actions |
| 12 | Block collapse mode in grid |
| 13 | Editor analytics telemetry events |

## C. Implementation Plan — P0

### Change 1: Insert-between in GridEditor

**File:** `src/components/editor/GridEditor.tsx`

Add `InsertBetweenDivider` between each `SortableGridBlockItem` in the grid. Since the grid uses `grid-cols-2`, we need to render dividers as full-width rows between logical block rows. Approach: render blocks in a flat list (not CSS grid) with dividers between each block. Alternative: switch to a single-column vertical list of block cards with insert points between them. 

The simplest approach: render dividers **outside** the CSS grid, between groups of blocks. Actually, the cleanest: wrap each block + its insert divider in a fragment, but since it's a 2-col grid, dividers need `col-span-2`. Add an `InsertBetweenDivider` before each block that spans full width.

Implementation: After every 2 blocks (or at the end of a row), insert a divider row. Actually simpler: just add an `InsertBetweenDivider` with `col-span-2` before each block in the grid render. On mobile they'll always show; on desktop on hover. This is acceptable since the divider is already designed for this.

### Change 2: Block type label on grid cards

**File:** `src/components/editor/GridEditor.tsx` — `SortableGridBlockItem`

Add a small label badge at bottom-left of each card showing the translated block type name from manifest (`t(manifest.labelKey)`). Style: semi-transparent pill, `text-[10px]`, always visible.

### Change 3: Duplicate button on grid cards

**File:** `src/components/editor/GridEditor.tsx`

- Add `onDuplicateBlock` prop to `GridEditorProps`
- Add duplicate icon button next to edit/delete in `SortableGridBlockItem`
- Wire through from `EditorScreen`

This requires adding a `handleDuplicateBlock` to `useBlockEditor` hook. Looking at the hook, it doesn't have duplicate. We'll add it: copy the block, generate new ID, insert at position+1.

**Files:** 
- `src/hooks/editor/useBlockEditor.tsx` — add `handleDuplicateBlock`
- `src/components/editor/GridEditor.tsx` — add button + prop
- `src/components/dashboard-v2/screens/EditorScreen.tsx` — wire prop

### Change 4: Unify BlockInsertButton with BLOCK_MANIFEST

**File:** `src/components/editor/BlockInsertButton.tsx`

Replace `ALL_BLOCKS` array with derivation from `BLOCK_MANIFEST`. Each entry can compute `Icon` from the manifest icon string using `getLucideIcon()`, `label` from `manifest.labelKey`, `tier` from `manifest.isPremium`. The only thing manifest doesn't have is the colorful `color` class — we add a `color` mapping by category or block type.

### Change 5: Unify StructureView icons

**File:** `src/components/editor/StructureView.tsx`

Remove `BLOCK_ICONS` constant. Replace `getBlockIcon` function to use `getBlockIcon()` from `block-manifest.ts` + `getLucideIcon()`. ~5 line change.

## D. Exact file changes

### Phase 1: Manifest-driven insert button (Change 4)

`src/components/editor/BlockInsertButton.tsx`:
- Remove `ALL_BLOCKS` array (~45 lines)
- Add `BLOCK_COLORS: Record<BlockType, string>` mapping (~28 entries)
- Derive block list from `Object.values(BLOCK_MANIFEST)` with color lookup
- Keep existing rendering logic, just change data source

### Phase 2: StructureView icon unification (Change 5)

`src/components/editor/StructureView.tsx`:
- Remove `BLOCK_ICONS` constant (lines 53-82)
- Import `getBlockIcon` from `block-manifest`
- Update local `getBlockIcon` function to use manifest

### Phase 3: Grid UX — type labels + duplicate + insert-between (Changes 1-3)

`src/hooks/editor/useBlockEditor.tsx`:
- Add `handleDuplicateBlock(blockId: string)` — find block, clone with new ID, insert at position+1

`src/components/editor/GridEditor.tsx`:
- Add `onDuplicateBlock` to `GridEditorProps`
- In `SortableGridBlockItem`: add type label badge, add duplicate button (Copy icon)
- In grid render: intersperse `InsertBetweenDivider` components between blocks (col-span-2)

`src/components/dashboard-v2/screens/EditorScreen.tsx`:
- Pass `onDuplicateBlock` prop through

## E. Risks

- **Insert-between in 2-col grid**: CSS grid with `col-span-2` dividers between arbitrary blocks may cause layout reflow. Mitigation: use `col-span-2` on the divider element, test with 1-10 blocks.
- **Manifest-driven insert button**: Losing custom icons (some blocks use emoji components like `() => <span>👤</span>`). Mitigation: map these to lucide icons or keep a small override map.
- **Duplicate block**: Need to deep-clone block content including nested objects/arrays. Use `structuredClone()` or `JSON.parse(JSON.stringify())`.

## F. Three strongest UX wins

1. **Insert-between blocks** — currently impossible, unlocks non-linear page building
2. **Manifest-driven insert panel** — eliminates data drift between 3 sources of truth, reduces maintenance surface
3. **Duplicate on grid cards** — saves 5+ clicks vs manually recreating similar blocks

