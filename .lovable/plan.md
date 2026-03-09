

## A. Verdict

### 8 editor gaps after P4:

1. **No sections/groups** — 50-block pages are flat lists with zero semantic structure
2. **No review/focus modes** — can't filter to only problematic or CTA blocks
3. **No replace/transform** — clipboard-engine defines `CONVERTIBLE_PAIRS` but no UI or execution path exists
4. **No friction recovery** — editor doesn't detect stuck users (undo loops, insert/delete cycles)
5. **Structure view is passive** — no filters, no quality badges, no section tree, no search
6. **History gets noisy** — rapid inline edits create 7 separate history entries; no compression
7. **No autosave batching** — every mutation triggers save independently
8. **No virtualization** — GridEditor renders all blocks + dividers; 50+ blocks = render pain

### Where editor still fatigues:
- Long pages require endless scrolling with no way to collapse regions
- Can't quickly "show me only what's broken"
- Replace block type requires delete + re-create + re-fill
- History fills up with trivial edits, losing important actions

---

## B. P5 Scope

Implementing in priority order:

1. **Section model** — lightweight metadata overlay on flat block array
2. **Structure view 2.0** — filters, quality badges, section tree
3. **Review/focus modes** — filter blocks by state/role
4. **Replace/transform engine** — block type conversion with field transfer
5. **Friction recovery** — event-based stuck detection + suggestions
6. **Smart autosave batching** — debounce queue with flush triggers
7. **History compression** — merge rapid same-field edits
8. **Performance hardening** — memoization, stable selectors, lazy structure view
9. **Observability upgrades** — new analytics events for P5 features

---

## C. Architecture

### New files:
```
src/lib/editor/
├── section-engine.ts          # Section CRUD, pure functions
├── transform-engine.ts        # Block type conversion logic
├── friction-detector.ts       # Stuck-state detection rules
├── history-compressor.ts      # History entry merging
└── autosave-batcher.ts        # Save queue with flush logic
```

### Modified files:
```
src/types/blocks/base.ts         # Add sectionId to block base
src/store/useEditorStore.ts      # Section state, review mode, collapsed sections
src/components/editor/StructureView.tsx  # Full rewrite: sections, filters, badges
src/components/editor/GridEditor.tsx     # Section rendering, collapse support
src/components/editor/EditorKeyboardHandler.tsx  # Section shortcuts
src/hooks/editor/useEditorHistory.ts     # Compression integration
src/lib/editor/editor-analytics.ts       # New P5 events
```

---

## D. Implementation Details

### 1. Section Model (`section-engine.ts`)

**Data model choice: flat array + section metadata on blocks.**

This preserves the existing `Block[]` architecture. Each block gets an optional `sectionId?: string`. Sections are derived from contiguous runs of blocks with the same `sectionId`.

```typescript
// Added to Block base type
sectionId?: string;

// Section metadata stored in a map (in store, not DB)
interface SectionMeta {
  id: string;
  label: string;
  collapsed: boolean;
  createdAt: number;
}
```

Pure functions:
- `createSection(blocks, selectedIds, label)` → assigns sectionId to selected blocks
- `dissolveSection(blocks, sectionId)` → clears sectionId
- `mergeSections(blocks, sectionIdA, sectionIdB)` → unifies
- `moveSection(blocks, sectionId, direction)` → moves all section blocks up/down
- `duplicateSection(blocks, sectionId)` → deep-copies section blocks
- `deleteSection(blocks, sectionId)` → removes all blocks in section
- `getSections(blocks)` → derives ordered section list from block array
- `getSectionBlocks(blocks, sectionId)` → blocks in a section

**Why flat + sectionId:** No migration needed. Existing pages work unchanged (sectionId undefined = ungrouped). No nested tree complexity. DnD stays on flat array. History stays on flat Block[].

### 2. Structure View 2.0

Full enhancement of existing `StructureView.tsx`:

- **Section tree:** Group blocks by sectionId, show section headers with collapse/expand
- **Filters:** Filter chips: All | Incomplete | Hidden | CTA/Contact | By Type
- **Quality badges:** Dot indicator (green/yellow/red) per block from intelligence `blockQuality`
- **Search:** Text filter matching block title/type
- **Section actions:** Rename, collapse, dissolve, duplicate, delete, move up/down
- **Jump to block:** Click scrolls GridEditor to that block
- **Props expansion:** Accept `blockQuality: BlockQualityReport[]` and `structureFilters` from store

### 3. Review/Focus Modes

Add `reviewMode` to store: `'normal' | 'problematic' | 'cta_contact' | 'hidden' | 'incomplete'`

When active:
- GridEditor filters displayed blocks (non-matching blocks get collapsed/dimmed)
- StructureView highlights matching blocks
- A small review bar shows "Showing X of Y blocks" with exit button
- Navigation through reviewed blocks via arrow keys

Implementation: derived selector `getFilteredBlockIds(blocks, reviewMode, intelligence)` → Set of visible IDs. GridEditor wraps non-matching blocks in collapsed state.

### 4. Replace/Transform Engine (`transform-engine.ts`)

Extends existing `CONVERTIBLE_PAIRS` from clipboard-engine.

```typescript
interface TransformResult {
  success: boolean;
  newBlock: Block;
  lostFields: string[];
  transferredFields: string[];
}

// Compatibility matrix with field mappings
const TRANSFORM_MAP: Record<string, {
  targets: string[];
  fieldMap: Record<string, string>;  // fromField → toField
  lossyFields: string[];
}> = {
  button: {
    targets: ['link', 'messenger'],
    fieldMap: { label: 'label', url: 'url' },
    lossyFields: ['variant', 'animation'],
  },
  link: {
    targets: ['button'],
    fieldMap: { title: 'label', url: 'url' },
    lossyFields: ['description', 'imageUrl'],
  },
  // ... etc
};
```

Functions:
- `canTransform(fromType, toType)` → boolean
- `getTransformTargets(blockType)` → BlockType[]
- `transformBlock(block, toType)` → TransformResult
- `getTransformWarning(fromType, toType)` → lossy field list

UI: In BlockContextToolbar, "Convert to..." submenu showing valid targets with lossy warnings.

### 5. Friction Recovery (`friction-detector.ts`)

Event-based detector using a sliding window of recent editor actions.

```typescript
interface FrictionSignal {
  type: 'undo_loop' | 'insert_delete_cycle' | 'reorder_chaos' | 'edit_abandon' | 'palette_indecision';
  confidence: number;
  suggestedAction: string;
  suggestedActionKey: string;
}

function detectFriction(recentEvents: EditorEvent[], pageState: PageData): FrictionSignal | null
```

Detection rules:
- `undo_loop`: 3+ undos in 30s → suggest review mode
- `insert_delete_cycle`: same block type added+deleted 2+ times in 60s → suggest preset
- `edit_abandon`: 3+ editor opens without save in 60s → suggest inline edit
- `palette_indecision`: 3+ palette opens without insert in 45s → suggest recommended blocks
- `reorder_chaos`: 4+ reorders in 30s → suggest structural repair

Cool-down: 120s between suggestions. Dismiss memory in session storage.

Event buffer: last 50 editor actions stored in-memory ring buffer.

### 6. Smart Autosave Batching (`autosave-batcher.ts`)

```typescript
interface SaveBatcher {
  enqueue(mutation: BlockMutation): void;
  flush(): Promise<void>;
  cancel(): void;
}
```

Rules:
- Inline edits: debounce 1500ms
- Reorder: debounce 800ms
- Add/delete: debounce 500ms
- Bulk actions: debounce 300ms
- Dangerous (delete all): flush immediately
- Blur/tab switch/route leave: flush immediately
- Merge queued mutations of same block into single update

Integration: wrap existing autosave in `useDashboard` with batcher.

### 7. History Compression (`history-compressor.ts`)

```typescript
function shouldMergeActions(prev: HistoryAction, next: HistoryAction): boolean
function mergeActions(prev: HistoryAction, next: HistoryAction): HistoryAction
```

Merge rules:
- Same blockId + type='update' + within 2000ms → merge (keep first previousState, last newState)
- Consecutive reorders within 1000ms → merge
- Bulk action = single entry (already handled)
- Never merge across different blockIds
- Never merge add/delete with updates

Integration: call `shouldMergeActions` in `recordAction` before appending.

### 8. Performance Hardening

- **GridEditor:** Memoize `SortableGridBlockItem` with `React.memo` + stable callback refs (already memo'd but deps may be unstable)
- **Store selectors:** Create derived selectors for `selectedCount`, `hasSelection`, `isBlockSelected(id)` to avoid Set recreation
- **Structure view:** Lazy render collapsed section contents
- **Intelligence hook:** Add `useMemo` dependency check — only recompute when blocks array reference changes
- **Insert ranker:** Cache results until blocks change
- **DnD:** Use `useId` for stable DndContext key (already done)

### 9. Observability

New analytics events:
- `section_created`, `section_dissolved`, `section_collapsed`, `section_moved`
- `review_mode_entered`, `review_mode_exited`
- `transform_used`, `transform_cancelled`
- `friction_detected`, `friction_suggestion_accepted`, `friction_suggestion_dismissed`
- `autosave_batch_flushed` (with batch size)
- `history_compressed` (with merge count)

---

## E. Data Model

### Block base extension:
```typescript
// In BlockGridProps (base.ts), add:
sectionId?: string;
```

### Store additions:
```typescript
// useEditorStore
sectionMeta: Map<string, SectionMeta>;
collapsedSections: Set<string>;
reviewMode: 'normal' | 'problematic' | 'cta_contact' | 'hidden' | 'incomplete';

// Actions
setSectionMeta(id: string, meta: SectionMeta): void;
removeSectionMeta(id: string): void;
toggleSectionCollapse(id: string): void;
setReviewMode(mode: string): void;
```

---

## F. UX Behavior

### Section workflow:
1. Select 3+ blocks → Bulk bar shows "Group into section"
2. Click → prompted for label → blocks get sectionId
3. Section header appears in GridEditor with collapse/expand toggle
4. In StructureView, section appears as collapsible tree node
5. Cmd+G = keyboard shortcut for group selected

### Review mode workflow:
1. User clicks filter in StructureView or toolbar
2. Non-matching blocks dim/collapse in GridEditor
3. Arrow keys navigate only through matching blocks
4. "Exit review" button restores normal mode

### Transform workflow:
1. Select block → context toolbar → "Convert to..." 
2. Shows valid targets with "⚠ loses: animation, variant" warnings
3. Confirm → block type changes, compatible fields transfer
4. Single history entry, undo-safe

---

## G. Verification

1. Build passes — no TS errors from sectionId addition
2. Existing pages work — undefined sectionId = no sections, zero migration
3. Section operations are undo-safe — history records full block array
4. Transform preserves compatible fields and warns on lossy
5. Friction detector doesn't spam — 120s cooldown enforced
6. Autosave batcher flushes on blur — no lost edits
7. History compression preserves undo clarity — cross-block edits never merged
8. Performance: 50-block page renders under 16ms frame budget

---

## H. Decision Tables

| Improvement | User value | Dev complexity | Runtime cost | Priority |
|---|---|---|---|---|
| Section model | High | Medium | ~0ms | 1 |
| Structure view 2.0 | High | Medium | ~0ms | 2 |
| Review/focus modes | High | Low | ~0ms | 3 |
| Replace/transform | Medium | Low | ~0ms | 4 |
| Friction recovery | Medium | Medium | ~0ms | 5 |
| Autosave batching | Medium | Low | ~0ms | 6 |
| History compression | Medium | Low | ~0ms | 7 |
| Performance hardening | High | Low | ~0ms | 8 |
| Observability | Low | Low | ~0ms | 9 |

| Area | Rules | Heuristics | ML-lite | LLM? | Choice |
|---|---|---|---|---|---|
| Section engine | Yes | — | — | No | Rules |
| Review mode filtering | Yes | — | — | No | Rules |
| Transform compatibility | Yes (matrix) | — | — | No | Rules |
| Friction detection | — | Threshold rules | — | No | Heuristics |
| Autosave batching | Yes (debounce) | — | — | No | Rules |
| History compression | Yes (merge rules) | — | — | No | Rules |
| Structure view filters | Yes | — | — | No | Rules |

| Risk | Where | Why it matters | Mitigation |
|---|---|---|---|
| sectionId breaks existing saves | Block serialization | Data loss | Optional field, undefined = ungrouped |
| History compression loses granularity | Undo flow | User can't undo individual keystrokes | Never merge cross-block; 2s window only |
| Autosave batcher loses edits on crash | Tab close | Data loss | Flush on beforeunload; keep local draft |
| Friction detector annoys users | Recovery suggestions | UX spam | 120s cooldown + session dismiss memory |
| Section DnD breaks ordering | GridEditor | Visual chaos | Section blocks stay contiguous; reorder within section only |

