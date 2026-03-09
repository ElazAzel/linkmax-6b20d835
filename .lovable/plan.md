
## A. Verdict

### 7 biggest UX problems remaining:

1. **No multi-select** — users must delete/duplicate/hide blocks one by one
2. **No inline quick-edit** — every text edit forces opening the full editor sheet
3. **Selection state is invisible** — `selectedBlockId` exists in store but GridEditor doesn't show it
4. **Block toolbar is action-per-hover** — controls appear per-block but not for selected state
5. **No keyboard navigation between blocks** — arrow keys don't move selection; only shortcuts work on already-selected
6. **Structure view is passive** — shows blocks but no bulk select, no quality indicators, no filters
7. **Clipboard is missing** — no copy/paste blocks, no paste-style

### Actions still too expensive:
- Delete 5 blocks = 5 separate delete actions
- Move text above CTA = drag carefully or 3+ Cmd+Arrow presses
- Quickly edit a button label = open full sheet, find field, edit, close

### Where editor feels like CRUD not editor:
- No spatial awareness of selection
- No batch operations
- Context toolbar = generic action buttons
- No "review mode" for problematic blocks

### Interaction gaps hurting publish/activation:
1. Can't fix multiple block issues in batch
2. Can't quickly inline-edit weak copy
3. Structure view doesn't surface quality issues
4. No focus mode for problematic-only blocks

---

## B. P4 Scope

Implementing priorities 1-7:

1. **Multi-select system** — selection model + bulk actions
2. **Inline quick edit layer** — click-to-edit for text/button/messenger labels
3. **Block context toolbar** — unified toolbar for single/multi selection
4. **Keyboard-first expansion** — arrow navigation, Tab between blocks
5. **Smart insert flow** — context-aware insert ranking
6. **Structure view 2.0** — filters, quality badges, bulk select
7. **Copy/paste engine** — block clipboard with style-only option

Defer to P5: sections/grouping, collapse/focus modes, friction recovery, full analytics layer.

---

## C. Architecture

### New modules:
```
src/lib/editor/
├── selection-engine.ts      # Multi-select state logic
├── bulk-actions.ts          # Batch operations
├── clipboard-engine.ts      # Copy/paste logic
├── insert-ranker.ts         # Context-aware insert scoring
└── inline-edit-config.ts    # Per-block inline editable fields

src/components/editor/
├── BlockSelectionOverlay.tsx   # Visual selection UI
├── BlockContextToolbar.tsx     # Floating toolbar for selected
├── InlineTextEditor.tsx        # Quick inline text edit
└── BulkActionBar.tsx           # Multi-select action bar
```

### Store expansion (`useEditorStore`):
```typescript
interface EditorState {
  // Existing P2
  selectedBlockId: string | null;
  commandPaletteOpen: boolean;
  
  // New P4
  selectedBlockIds: Set<string>;        // Multi-select
  clipboardBlock: Block | null;         // Copied block
  clipboardMode: 'block' | 'style';     // Copy type
  inlineEditingBlockId: string | null;  // Currently inline editing
  inlineEditField: string | null;       // Which field is being edited
  structureViewFilters: StructureFilter[];
}
```

---

## D. Implementation by file

### 1. Store expansion (`src/store/useEditorStore.ts`)
Add:
- `selectedBlockIds: Set<string>` — for multi-select
- `toggleBlockSelection(id: string, additive: boolean)` — Cmd+click behavior
- `selectRange(fromId: string, toId: string)` — Shift+click range
- `clearSelection()`, `selectAll(blockIds: string[])`
- `clipboardBlock`, `clipboardMode`, `copyBlock()`, `pasteBlock()`
- `inlineEditingBlockId`, `setInlineEditing()`

### 2. Selection engine (`src/lib/editor/selection-engine.ts`)
Pure functions:
- `toggleSelection(current: Set<string>, id: string, additive: boolean): Set<string>`
- `selectRange(blocks: Block[], from: string, to: string): Set<string>`
- `getSelectableBlocks(blocks: Block[]): Block[]` — excludes profile
- `isValidSelection(ids: Set<string>, blocks: Block[]): boolean`

### 3. Bulk actions engine (`src/lib/editor/bulk-actions.ts`)
```typescript
interface BulkActionResult { success: boolean; affectedIds: string[] }

// Available bulk actions
- bulkDelete(blocks, selectedIds) → Block[]
- bulkDuplicate(blocks, selectedIds) → Block[]
- bulkHide(blocks, selectedIds) → Block[]
- bulkShow(blocks, selectedIds) → Block[]
- bulkMoveUp(blocks, selectedIds) → Block[]
- bulkMoveDown(blocks, selectedIds) → Block[]
```

### 4. Block context toolbar (`src/components/editor/BlockContextToolbar.tsx`)
Floating toolbar that appears:
- Above selected block(s)
- Shows: Edit, Duplicate, Delete, Hide, Move ↑↓, Copy, More...
- Multi-select shows: "3 selected" + bulk action subset
- Position: anchored to selection bounds

### 5. Inline text editor (`src/components/editor/InlineTextEditor.tsx`)
Lightweight overlay for quick field edit:
- Renders when `inlineEditingBlockId` is set
- Shows contentEditable span for the field value
- Blur/Enter saves, Escape cancels
- Supports: text.content, button.label, messenger.label, pricing item names, faq questions

### 6. Inline edit config (`src/lib/editor/inline-edit-config.ts`)
Registry of inline-editable fields per block type:
```typescript
const INLINE_EDITABLE: Record<BlockType, InlineEditableField[]> = {
  text: [{ field: 'content', type: 'text' }],
  button: [{ field: 'label', type: 'short' }],
  messenger: [{ field: 'customLabel', type: 'short' }],
  faq: [{ field: 'questions.*.question', type: 'text' }],
  // ...
}
```

### 7. GridEditor updates (`src/components/editor/GridEditor.tsx`)
- Add visual selection state (ring-2 ring-primary for selected)
- Handle click → single select
- Handle Cmd+click → toggle multi-select
- Handle Shift+click → range select
- Show `BlockContextToolbar` for selected
- Double-click → inline edit if supported
- Track `onBlockSelect` callback

### 8. Keyboard handler expansion (`src/components/editor/EditorKeyboardHandler.tsx`)
Add:
- ArrowUp/Down — move selection to prev/next block
- Shift+Arrow — range select
- Enter — open inline edit or full editor
- Tab — cycle through blocks
- Cmd+A — select all (non-profile)
- Cmd+C — copy block
- Cmd+V — paste block
- Cmd+Shift+C — copy style
- Cmd+Shift+V — paste style

### 9. Structure view 2.0 (`src/components/editor/StructureView.tsx`)
Add:
- Checkbox for multi-select
- Filter buttons: All | Incomplete | Hidden | CTA/Contact
- Quality badge per block (from intelligence layer)
- Bulk action bar when >1 selected
- "Jump to" behavior scrolls GridEditor

### 10. Insert ranker (`src/lib/editor/insert-ranker.ts`)
```typescript
function rankBlocksForInsert(
  currentBlocks: Block[],
  position: number,
  niche: string,
  recentTypes: string[]
): RankedBlock[]
```
Scoring:
- +30 if recommended by NBA
- +20 if fills composition gap
- +15 if recent
- +10 if niche-critical
- Position-aware: after pricing → boost booking/testimonial

### 11. Clipboard engine (`src/lib/editor/clipboard-engine.ts`)
```typescript
function copyBlock(block: Block): ClipboardData
function copyStyle(block: Block): StyleData
function pasteBlock(clipboard: ClipboardData, position: number): Block
function pasteStyle(clipboard: StyleData, target: Block): Partial<Block>
function canPasteStyle(from: Block, to: Block): boolean
```

### 12. Bulk action bar (`src/components/editor/BulkActionBar.tsx`)
Fixed bottom bar when >1 block selected:
- "X selected" label
- Buttons: Duplicate | Hide | Delete | Deselect
- Animate in from bottom

---

## E. UX Logic

### Single-click behavior:
1. Click on block → select it (deselect others)
2. Cmd+click → toggle selection (add/remove)
3. Shift+click → range select from last selected
4. Click outside → clear selection

### Double-click behavior:
- If block has inline-editable field → open inline editor
- Else → open full editor

### Keyboard flow:
- Arrow ↑↓ → move selection
- Enter → inline edit (if available) or full edit
- Delete → delete selected
- Cmd+D → duplicate
- Cmd+C/V → copy/paste

### Multi-select bulk:
- Delete → confirm dialog if >3 blocks
- Duplicate → insert duplicates after last selected
- Hide/Show → toggle all

---

## F. Why better than AI-heavy

| Dimension | This P4 | AI-assisted editor |
|-----------|---------|-------------------|
| Cost | 0 API calls | $0.01-0.10 per action |
| Latency | <5ms | 500-3000ms |
| Trust | Deterministic | Unpredictable |
| Edit speed | Instant | Wait for generation |
| Maintainability | Pure functions | Prompt engineering |

All P4 features are deterministic state machines + pure functions.

---

## G. Verification

1. **Build passes** — no TS errors
2. **Selection correctness** — Cmd+click adds, Shift+click ranges
3. **Bulk action safety** — profile never bulk-deleted
4. **History recording** — bulk actions record as single history entry
5. **Keyboard no-collision** — shortcuts don't fire in inputs
6. **Mobile fallback** — multi-select via long-press + tap
7. **Analytics events** — track `bulk_action_used`, `inline_edit_saved`, `selection_count`

---

## H. Summary

### Core interaction wins:
- Multi-select + bulk delete/duplicate/hide
- Inline quick edit for text/button labels
- Block context toolbar
- Full keyboard navigation
- Copy/paste blocks
- Structure view with filters + quality badges

### Adjacent platform wins:
- Insert ranker using NBA engine
- Selection state visible in grid
- Unified selection model (grid ↔ structure)

### What stays for P5:
- Sections/grouping model
- Collapse/focus/review modes
- Friction recovery layer
- Full interaction analytics dashboard
- Replace/transform engine (button↔link)

---

## Decision Tables

| Improvement | User value | Dev complexity | Runtime cost | Priority |
|------------|------------|----------------|--------------|----------|
| Multi-select + bulk | High | Medium | ~0ms | 1 |
| Inline quick edit | High | Medium | ~0ms | 2 |
| Block context toolbar | High | Low | ~0ms | 3 |
| Keyboard navigation | Medium | Low | ~0ms | 4 |
| Smart insert ranking | Medium | Low | ~0ms | 5 |
| Structure view 2.0 | High | Medium | ~0ms | 6 |
| Copy/paste engine | Medium | Low | ~0ms | 7 |

| Area | Rules | Heuristics | ML-lite | LLM? | Final choice |
|------|-------|------------|---------|------|--------------|
| Selection logic | Yes | — | — | No | Rules |
| Bulk actions | Yes | — | — | No | Rules |
| Insert ranking | — | Scoring | — | No | Heuristics |
| Inline edit config | Yes (registry) | — | — | No | Rules |
| Clipboard compat | Yes | — | — | No | Rules |
| Quality badges | Yes | — | — | No | Rules (from P3) |
| Style paste compat | Yes | — | — | No | Rules |
