

## A. Verdict

### What P1 delivered (working):
- **Block manifest** — single source of truth for 27 block types
- **Basic history hook** — `useEditorHistory` exists with 7-step limit
- **GridEditor** — DnD reordering, insert-between dividers, duplicate/delete
- **StructureView** — tree navigation, quick actions (hide, duplicate, move)
- **Block factory** — defaults for all block types
- **Niche-based recommendations** — `block-recommendations.ts` with scoring

### Where editor still loses on speed:
1. **History not wired** — `recordBlockAdd/Delete/Update` methods exist but aren't called from actual block operations in `useBlockEditor`
2. **No keyboard shortcuts** — only Zone CRM has Cmd+K, editor has zero shortcuts
3. **No command palette** — users must click through menus for every action
4. **No presets** — only generic defaults, no quick-start content variants
5. **No editor analytics** — zero friction tracking to understand where users get stuck

### Top 3 interaction bottlenecks:
1. **Inserting a styled block** — requires: click + → pick type → open editor → fill fields → save (5+ steps)
2. **Undoing a mistake** — only delete has toast-based undo; no universal Ctrl+Z
3. **Finding the right block** — no recent/frequent blocks, must scroll categories every time

### State/system layer not normalized:
- `useBlockEditor` handles operations but doesn't call `useEditorHistory.record*` methods
- Selection state is implicit (last clicked block), not explicit in store
- Collapsed state not persisted across sessions
- No unified action dispatch layer — duplicate paths in GridEditor vs StructureView

---

## B. Deliverables for this P2 pass

**Priority 1-4 (must ship):**
1. **History integration** — wire `recordBlock*` into all block operations
2. **Editor Command Palette** — Cmd+K with block/command search
3. **Block presets system** — registry + 15-20 starter presets
4. **Editor analytics** — friction tracking hook

**Priority 5-6 (should ship):**
5. **Smart insert flow** — recent blocks, context-aware suggestions
6. **Session persistence** — collapsed state, recent presets, last insert search

**Priority 7-8 (stretch):**
7. **Multi-select groundwork** — selection model + action bar architecture
8. **Keyboard model** — essential shortcuts (Cmd+Z/Y, Cmd+D, Delete)

---

## C. Architecture

### New files to create:
```
src/lib/editor/
├── editor-commands.ts      # Command registry with capabilities
├── editor-presets.ts       # Block presets registry
├── editor-analytics.ts     # Friction tracking helpers
├── editor-session.ts       # Session persistence layer
└── editor-summaries.ts     # Block summary helpers

src/components/editor/
├── EditorCommandPalette.tsx  # Cmd+K palette
└── EditorKeyboardHandler.tsx # Global keyboard shortcuts

src/hooks/editor/
└── useEditorCommands.ts    # Command execution hook
```

### Store expansion (useEditorStore):
```typescript
interface EditorState {
  // Existing
  editingBlock, editorOpen, deletedBlocks, operationInProgress
  
  // New for P2
  selectedBlockId: string | null;
  collapsedBlockIds: Set<string>;
  commandPaletteOpen: boolean;
  recentBlockTypes: string[];  // last 5 inserted
  recentPresets: string[];     // last 5 used presets
}
```

### Integration points:
1. `useBlockEditor` — call history.record* on all mutations
2. `DashboardV2` — add EditorCommandPalette + EditorKeyboardHandler
3. `GridEditor` — respect selectedBlockId, expose selection
4. `StructureView` — sync with selectedBlockId

---

## D. Implementation Details

### 1. History Integration
Modify `useBlockEditor.tsx` to:
- Accept `editorHistory` as parameter
- Call `recordBlockAdd` after `addBlock`
- Call `recordBlockDelete` after `deleteBlock`
- Call `recordBlockUpdate` after `updateBlock`
- Call `recordBlocksReorder` after DnD completes

### 2. Command Palette (`EditorCommandPalette.tsx`)
Commands registry structure:
```typescript
interface EditorCommand {
  id: string;
  label: string;           // i18n key
  icon: string;            // lucide icon name
  shortcut?: string;       // "⌘D" display
  group: 'block' | 'edit' | 'navigation' | 'insert';
  isAvailable: (ctx: EditorContext) => boolean;
  execute: (ctx: EditorContext) => void;
}
```

Groups:
- **Insert** — all 27 block types + presets
- **Edit** — duplicate, delete, hide, move up/down
- **Navigation** — structure view, go to block by name
- **Actions** — undo, redo, preview, publish

Context-aware availability:
- "Delete block" only if `selectedBlockId` exists and not profile
- "Duplicate" only if selected and not profile
- "Move up" only if not first

### 3. Block Presets (`editor-presets.ts`)
Registry structure:
```typescript
interface BlockPreset {
  id: string;
  blockType: BlockType;
  labelKey: string;       // i18n
  category: 'cta' | 'info' | 'social' | 'commerce';
  overrides: Record<string, any>;  // merged with factory defaults
}
```

Example presets (15 minimum):
- text: `headline`, `bio`, `description`
- button: `cta_primary`, `whatsapp_cta`, `book_now`
- messenger: `whatsapp_ready`, `telegram_ready`
- faq: `starter_3q`
- pricing: `services_3`
- testimonial: `single_quote`
- booking: `appointment`
- socials: `instagram_tiktok`

Insertion path: Command Palette → search "preset:whatsapp" → insert with content

### 4. Editor Analytics (`editor-analytics.ts`)
Tracking function:
```typescript
function trackEditorAction(action: EditorAction, meta?: Record<string, any>) {
  // Debounce rapid actions (inline edits)
  // Send to analytics service
}
```

Actions tracked:
- `block_added`, `block_deleted`, `block_duplicated`, `block_reordered`
- `inline_edit_started`, `inline_edit_saved`, `inline_edit_cancelled`
- `full_editor_opened`, `full_editor_saved`
- `command_palette_opened`, `command_executed`
- `preset_used`, `undo_used`, `redo_used`
- `structure_view_opened`

### 5. Smart Insert Flow
Enhance `BlockInsertButton` with:
- **Recent section** — last 5 inserted types from session
- **Recommended section** — use existing `getRecommendedBlocks` with current blocks
- **Context suggestions** — "No CTA? Add messenger" banner

### 6. Session Persistence (`editor-session.ts`)
Storage keys (per pageId):
- `editor_collapsed_{pageId}` — Set<blockId>
- `editor_recent_blocks` — global recent types
- `editor_recent_presets` — global recent presets
- `editor_last_search` — last insert panel search

### 7. Multi-select Groundwork
Phase 1 only:
- Add `selectedBlockIds: Set<string>` to store
- Selection UI in StructureView (checkboxes)
- Action bar component (hidden until >1 selected)
- No bulk actions yet — defer to P3

### 8. Keyboard Shortcuts
Global shortcuts (in `EditorKeyboardHandler`):
- `Cmd+K` — open command palette
- `Cmd+Z` — undo
- `Cmd+Shift+Z` / `Cmd+Y` — redo
- `Cmd+D` — duplicate selected block
- `Delete/Backspace` — delete selected block (with confirmation)
- `Escape` — close palette / clear selection / close editor

---

## E. Verification Checklist

1. **Build passes** — no TypeScript errors
2. **History works** — add block → undo → block removed → redo → block back
3. **Palette works** — Cmd+K opens, search finds blocks, execute inserts
4. **Presets work** — insert "WhatsApp CTA" → button with WA styling
5. **Analytics fire** — check console/network for tracking calls
6. **Autosave unbroken** — edit block → auto-saves after debounce
7. **Grid/Structure sync** — select in grid → shows in structure and vice versa

---

## F. Summary

### Core editor improvements:
- History integration (wired into all block ops)
- Command Palette with 50+ commands
- 15+ block presets for faster starts
- Editor analytics friction map
- Keyboard shortcuts layer
- Session persistence

### Adjacent systems improvements:
- Enhanced store with selection model
- Block summaries helper for palette/structure
- Recent/frequent tracking
- Context-aware insert suggestions

### What remains for P3:
- Full multi-select + bulk actions
- Advanced inline edit batching in history
- Command palette fuzzy search improvements
- Analytics dashboard visualization
- Preset marketplace/user-created presets

### 3 Strongest Workflow Wins:
1. **Cmd+K → "whatsapp" → Enter** — insert styled WhatsApp block in 3 seconds
2. **Cmd+Z** — universal undo for any action, not just delete
3. **Recent blocks** — no more scrolling through categories for repeat inserts

