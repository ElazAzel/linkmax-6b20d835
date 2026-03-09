
## Full Audit After P0

### What's already good:
- P0 delivered: insert-between dividers ✓, block type labels ✓, duplicate buttons ✓, manifest-driven insert ✓, StructureView uses manifest icons ✓
- `useBlockEditor` has `handleDuplicateBlock` ✓
- `GridEditor` has `SortableGridBlockItem` with type label + duplicate + drag handle ✓
- `MobileBlockActions` has comprehensive action sheet with move up/down/top/bottom, duplicate, hide ✓
- `BlockInsertButton` is fully manifest-driven with recommendations ✓
- DnD is stable with proper event propagation guards ✓

### What's still weak (honest verdict):

**3 biggest friction points:**
1. **No block completeness/validation signal** — empty pricing, button without URL, text without content — all look identical on cards. Users have no feedback loop until they preview.
2. **No collapse/expand** — 10+ blocks = vertical wall. No way to reduce cognitive load or scroll distance.
3. **StructureView is passive** — it's a view-only panel that doesn't reflect incomplete state, hidden state visually on card, or let you jump to a block. Move up/down work but onBlockSelect doesn't close the sheet + scroll to block.

**One underpowered system layer:** Block validation / completeness — there's no shared helper that can determine whether a block is empty/incomplete. Each rendering component handles its own empty state (e.g., PricingBlock has its own empty check). The editor layer has no awareness of this.

---

## P1 Plan

### What will be implemented in this pass:

**1. Block completeness validator** — `src/lib/blocks/block-completeness.ts`
A pure function `getBlockCompleteness(block: Block): 'complete' | 'incomplete' | 'empty'` covering the 10 most common block types. Logic:
- `text`: empty if `content` is empty string/object with no values
- `button`: incomplete if no `url` or no `title`; empty if both missing
- `link`: same as button
- `messenger`: empty if `messengers.length === 0` or no valid username
- `pricing`: empty if `items.length === 0`; incomplete if any item has no name
- `faq`: empty if `items.length === 0`
- `image`: empty if no `url`
- `booking`: incomplete if no meaningful booking config
- `profile`: never incomplete (always has something)
- `separator`, `socials`, `avatar`, etc.: always `complete` (self-sufficient)

**2. Completeness badge on GridEditor cards** — `src/components/editor/GridEditor.tsx`
Add a small dot indicator to `SortableGridBlockItem`: orange dot = incomplete, red dot = empty. Positioned at top-left, next to drag handle (not overlapping). Only shown when relevant.

**3. Collapse/expand per block** — `src/components/editor/GridEditor.tsx`
Add `collapsedBlocks` state (`Set<string>`) in `GridEditor`. Pass `isCollapsed` + `onToggleCollapse` to each `SortableGridBlockItem`.
- Collapsed state: shows icon + type label + completeness badge + brief summary text. Height fixed ~56px. 
- Summary text: derived from `getBlockSummary(block)` helper function (also in `block-completeness.ts`).
- Expand/collapse button on card (ChevronDown/ChevronUp) always visible, not hover-only.
- Full block preview shows when expanded (current behavior).
- `collapsedBlocks` stored in `sessionStorage` keyed by page ID to persist across tab switches.

**4. Move up/down on grid cards** — `src/components/editor/GridEditor.tsx`
Add up/down arrow buttons to `SortableGridBlockItem` quick action area. Currently only edit+duplicate+delete exist. Add `onMoveUp` / `onMoveDown` props to grid editor and wire through from EditorScreen/useDashboard. Profile block gets no move buttons. First/last blocks get disabled state.

**5. StructureView: incomplete marker + selected block highlight** — `src/components/editor/StructureView.tsx`
- Accept `selectedBlockId?: string` prop — highlight the currently-selected/editing block in the list
- Accept `incompleteBlockIds?: Set<string>` prop — show an orange dot on incomplete blocks
- onBlockSelect closes the sheet AND the parent calls `onEditBlock` — the sheet should close on select

**6. EditorScreen: wire move up/down from dashboard** — connect reorder ops
`useDashboard` / `EditorScreen` already has `reorderBlocks` from cloudState. Add `handleMoveBlock(id, direction)` in `useDashboard` or directly in `EditorScreen` that finds the block index and calls `reorderBlocks` with array swapped. Pass as `onMoveUpBlock` / `onMoveDownBlock` to `GridEditor` and `StructureView`.

**7. StructureView: incomplete block count in header** — minor improvement
Show "3 блока неполных" alongside block count if there are incomplete blocks.

---

## Files to Change

| File | Change |
|------|--------|
| `src/lib/blocks/block-completeness.ts` | **NEW** — `getBlockCompleteness()`, `getBlockSummary()` |
| `src/components/editor/GridEditor.tsx` | Add collapse, completeness badge, move up/down buttons, wiring |
| `src/components/editor/StructureView.tsx` | Add `selectedBlockId`, `incompleteBlockIds`, close-on-select |
| `src/components/dashboard-v2/screens/EditorScreen.tsx` | Add `onMoveUpBlock` / `onMoveDownBlock` props, wire |
| `src/hooks/dashboard/useDashboard.ts` | Add `handleMoveBlock` helper, expose to EditorScreen |

---

## Implementation Details

### `block-completeness.ts` (new file)

```ts
export type BlockCompletion = 'complete' | 'incomplete' | 'empty';

export function getBlockCompleteness(block: Block): BlockCompletion
export function getBlockSummary(block: Block): string
```

`getBlockSummary` returns a short human-readable string:
- text → first 40 chars of content
- link/button → title (truncated)
- messenger → platform name + username
- pricing → "N услуг"
- faq → "N вопросов"
- image → has URL ? "Изображение" : "Нет фото"
- booking → "Бронирование активно" / "Не настроено"
- separator → style name
- default → block type label

### `GridEditor.tsx` changes

- Add `collapsedBlocks: Set<string>` state, initialized from `sessionStorage`
- Add `onMoveUp?: (id: string) => void` and `onMoveDown?: (id: string) => void` to `GridEditorProps`
- `SortableGridBlockItem` gets:
  - `isCollapsed: boolean`
  - `onToggleCollapse: () => void`  
  - `completeness: BlockCompletion`
  - `summary: string`
  - `onMoveUp?: (id: string) => void`
  - `onMoveDown?: (id: string) => void`
  - `isFirst: boolean`
  - `isLast: boolean`
- Collapsed rendering: `min-h-[56px]` fixed, show icon + typeLabel + summary + completeness dot + ChevronDown
- Expanded rendering: existing card with additionally a ChevronUp button + completeness dot
- Move up/down: small buttons rendered in expanded controls cluster (between drag handle and edit button on desktop), always rendered on mobile (in the card header row)

### `StructureView.tsx` changes

- Add `selectedBlockId?: string` to `StructureViewProps`
- Add `incompleteBlockIds?: Set<string>` to `StructureViewProps`  
- `BlockListItem` gets `isSelected: boolean` — highlighted with `ring-2 ring-primary/50`
- `BlockListItem` gets `isIncomplete: boolean` — orange dot next to icon
- `onSelect` callback should also call `onOpenChange(false)` — wire this inside StructureView

### `EditorScreen.tsx` changes

- Add `onMoveUpBlock?: (id: string) => void`
- Add `onMoveDownBlock?: (id: string) => void`
- Pass these to `GridEditor`

### `useDashboard.ts` changes

- Add `handleMoveBlock(id: string, direction: 'up' | 'down')` using `cloudState.reorderBlocks`
- Expose `handleMoveBlock` (or split into handleMoveUp / handleMoveDown)

---

## Risks

- **Collapse + DnD**: When a block is collapsed, its DOM height is fixed. DnD sortable handles still work — just the card renders smaller. No DnD logic changes needed.
- **sessionStorage**: Collapsed state keyed by `pageData.id`. If pageData.id is undefined (new page), use `'new'` as key. Read on mount, write on toggle.
- **Move up/down**: Just calls `arrayMove` on the blocks array and calls `reorderBlocks`. Profile block is always first (protected in `addBlock` logic already).

---

## Adjacent improvements included

**Core editor:**
- block-completeness.ts (new utility)
- collapse/expand per block
- completeness badge on grid cards + structure view
- move up/down on grid cards

**Adjacent (editor-adjacent only):**
- `useDashboard`: `handleMoveBlock` (wiring layer, not UX change)
- `StructureView`: selected-block highlight (UX coherence with editor state)

**NOT included (out of scope):**
- Inline editing (would need per-block form rendering inside the card — P2, more complex)
- Command palette (P2)
- Analytics telemetry (P2)

---

## 3 Strongest UX Wins

1. **Completeness badge** — users finally know which blocks need content before publishing. No more silent empty pricing blocks.
2. **Collapse/expand** — 15-block pages become manageable. Users can collapse finished sections and focus on what's left.
3. **Move up/down on grid cards** — drag is unreliable on mobile; having explicit arrow buttons makes reorder accessible without the actions sheet.
