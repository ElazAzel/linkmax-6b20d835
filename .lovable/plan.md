

# LinkMAX Block System — Full Technical & Product Audit

## 1. Verdict

The block system is **functional but architecturally sprawling**. It works today because the team knows where everything is. It will break the moment a second developer tries to add a block, or the catalog passes 35 types.

**Strong**: Good lazy-loading in BlockRenderer, consistent i18n approach (`I18nText | MultilingualString`), working grid layout, sensible free/pro split for core conversion path.

**Dangerous**: Triple source of truth for block definitions (types, domain entity, registry), two live editor components doing the same job (BlockEditor + BlockEditorV2), ghost block type (`search` — registered but has no renderer/editor), no schema validation at any layer, no compile-time guarantee that adding a block type updates all required files. The switch statements in BlockRenderer (449 lines), BlockEditor (396 lines), and BlockEditorV2 (423 lines) are ~1300 lines of nearly identical routing code maintained in parallel.

**Product fit**: 29 block types for a "service solopreneur revenue tool" is too many. ~10 blocks do the core job. ~8 are reasonable extensions. ~11 are noise that increases cognitive load in the editor without meaningfully serving the primary ICP.

---

## 2. Architecture Model

Current reality:

```text
BlockType (base.ts)          ← string literal union, 29 types
    ↕ (manual sync)
Block union (index.ts)       ← discriminated union of 28 interfaces (search missing)
    ↕ (manual sync)
Domain entity (Block.ts)     ← DUPLICATE BlockType + BLOCK_CATEGORIES + isPremiumBlockType()
    ↕ (manual sync)
Registry (block-registry.ts) ← DUPLICATE categories + premium flags + metadata
    ↕ (manual sync)
block-editor-types.ts        ← DUPLICATE BLOCK_CATEGORIES constant
    ↕ (manual sync)
BlockRenderer.tsx             ← giant switch (29 cases)
BlockEditor.tsx               ← giant switch (28 cases) 
BlockEditorV2.tsx             ← giant switch (28 cases)
BlockInsertButton.tsx         ← hardcoded block list with icons/colors
FreePremiumBlockGate.ts       ← re-exports from registry
```

**There is no single source of truth.** Premium flags exist in: registry, domain entity, individual type interfaces (`isPremium: true` on CatalogBlock, BookingBlock, etc.), and FreePremiumBlockGate. They can and will drift.

---

## 3. Critical Findings

### 3.1 Ghost block: `search`
- In `BlockType` union, in registry, in `BlockInsertButton` — but **no SearchBlock renderer**, **no SearchBlockEditor**, **no type interface**. Inserting it crashes silently (BlockRenderer returns `null` from default case).

### 3.2 Three switch statements maintained in parallel
- `BlockRenderer.tsx` (449 LOC) — public rendering
- `BlockEditor.tsx` (396 LOC) — editor v1
- `BlockEditorV2.tsx` (423 LOC) — editor v2
- Each has its own lazy imports and switch. Adding a block requires touching all three + types + registry + domain entity = minimum 6 files, no compile error if you miss one.

### 3.3 Duplicate domain layer
- `src/domain/entities/Block.ts` duplicates `BlockType`, `BLOCK_CATEGORIES`, `PREMIUM_BLOCK_TYPES`, and `getBlockCategory()` from `src/types/blocks/base.ts` and `src/lib/blocks/block-registry.ts`. Same for `src/types/block-editor-types.ts`. Three competing definitions of the same data.

### 3.4 No schema validation
- Blocks are persisted as `content: Json` in the DB. Loaded via `save_page_blocks` RPC. There is zero runtime validation that loaded JSON matches the TypeScript interface. A malformed block will cause a runtime crash in the renderer, caught only by BlockErrorBoundary (silent failure = invisible broken page for the visitor).

### 3.5 Editor props are `any`
- `BlockEditorWrapper.BaseBlockEditorProps` uses `formData: any, onChange: (updates: any) => void`. Every editor receives and emits untyped data. Type safety between editor input and renderer expectation is **zero at the contract level**.

### 3.6 Premium flag inconsistency
- Some blocks have `isPremium: true` hardcoded in their **type interface** (CatalogBlock, BookingBlock, FormBlock, etc.) — this is a data concern baked into a type definition. Others rely purely on the registry. The `FormBlock` type says `isPremium: true` but `block-registry.ts` lists `form` as FREE. This is a live contradiction.

### 3.7 Two editor components coexist
- `BlockEditor.tsx` and `BlockEditorV2.tsx` both exist and are likely both imported somewhere. V2 adds autosave and preview. But V1 isn't deleted. This is dead weight or a hidden code path.

---

## 4. Product Value Audit (29 blocks)

### Must-have (core revenue path): 6
`profile`, `pricing`, `booking`, `form`, `messenger`, `socials`

### Strong conversion/trust: 5
`link`, `button`, `faq`, `testimonial`, `image`

### Useful extensions: 5
`text`, `map`, `video`, `before_after`, `carousel`

### Niche/situational: 5
`event`, `catalog`, `product`, `download`, `community`

### Decorative/low-impact: 5
`avatar`, `separator`, `countdown`, `shoutout`, `newsletter`

### Questionable/premature: 3
`custom_code`, `scratch`, `search` (ghost)

**Verdict**: For the beauty/service master ICP, only ~11 blocks matter. The remaining 18 add catalog weight without serving the core flow.

---

## 5. ICP Fit

For a nail master in Almaty who wants "booking page in 5 minutes":
- **Needs**: profile, pricing, booking, messenger, faq, image/before_after
- **Maybe**: socials, map, testimonial
- **Doesn't need and won't understand**: custom_code, scratch, newsletter, countdown, shoutout, community, catalog, event, download, search

The block picker shows all 29 types. This creates decision paralysis. The recommendation system exists (`block-recommendations.ts`) but maps beauty → "freelancer" which is semantically wrong and likely gives suboptimal recommendations.

---

## 6. Recommended Architecture Changes

### P0 — Critical (week 1-2)

1. **Delete `search` block type** from all files or implement it. Currently a landmine.

2. **Kill BlockEditor.tsx (v1)**. Audit usages, migrate to V2, delete. Stop maintaining two identical switch files.

3. **Create a block manifest** — single `BLOCK_MANIFEST` record that defines: type, TypeScript interface reference, renderer lazy import, editor lazy import, premium flag, category, icon, default data factory. Replace all three switch statements with a single registry-driven lookup.

4. **Remove `isPremium: true` from type interfaces** (CatalogBlock, BookingBlock, FormBlock, etc.). Premium is a gating concern, not a data shape concern. Registry is the source of truth.

5. **Resolve FormBlock premium contradiction** — type says premium, registry says free. Pick one.

### P1 — Strong improvements (week 3-4)

6. **Delete `src/domain/entities/Block.ts`** or make it import from `src/types/blocks/base.ts`. One source of truth for BlockType.

7. **Delete `BLOCK_CATEGORIES` from `src/types/block-editor-types.ts`**. Use registry.

8. **Add Zod schemas for top 6 blocks** (profile, pricing, booking, form, messenger, socials). Validate on load. Log malformed blocks instead of crashing.

9. **Type the editor props** — replace `formData: any` with generic `formData: T` where T is the block type. Even partial typing (top 6 blocks) eliminates the most dangerous runtime mismatches.

10. **Simplify block picker for beauty niche** — show 8-10 recommended blocks prominently, collapse the rest into "More blocks". Reduce decision fatigue.

### P2 — Scale improvements (month 2+)

11. **Block schema versioning** — add `_schemaVersion: number` to block content JSON. Write migration functions per block type. Future-proof against schema changes.

12. **Registry-driven tests** — iterate BLOCK_MANIFEST, assert every type has renderer, editor, default factory, and icon. Run in CI. Prevents ghost blocks and missing implementations.

13. **Reduce block count** — consider merging `link` + `button` (they differ only in styling), `avatar` into `profile`, `product` into `pricing`. Target: 20-22 block types.

### Never now

- Don't build a plugin system for third-party blocks
- Don't add more block types before fixing the architecture
- Don't build a visual block schema editor
- Don't abstract the block system into a separate package

---

## 7. Performance Notes

- Lazy loading via `React.lazy` in BlockRenderer is correct and effective.
- `framer-motion` stagger animation on every block in GridBlocksRenderer adds layout cost on pages with 10+ blocks. Consider removing stagger for pages > 8 blocks.
- `BlockEditorV2` uses `useDeferredValue` which is good but `formData` is untyped `any` — React can't optimize diffs on unstructured objects.

---

## 8. Security Concern

- `CustomCodeBlock` renders user HTML/CSS/JS. The `enableInteraction` flag suggests JS execution. If this isn't sandboxed in an iframe with `sandbox` attribute, it's an XSS vector. Needs verification.

---

## 9. Final Recommendation

**Main structural problem**: No single source of truth. Block definitions are scattered across 6+ files with manual sync. Adding or modifying a block type is error-prone and unverifiable at compile time.

**Main opportunity**: A single `BLOCK_MANIFEST` record that drives everything — rendering, editing, insertion, gating, analytics, testing. This one refactor eliminates ~800 lines of duplicated switch statements, prevents ghost blocks, and makes the system extensible without fear.

**Single best next step**: Create `src/lib/blocks/block-manifest.ts` with a typed record mapping `BlockType → { renderer, editor, icon, category, isPremium, defaultFactory }`. Refactor `BlockRenderer.tsx` to use it (replacing the 250-line switch). Then do the same for BlockEditorV2. Then delete BlockEditor v1.

This is ~2 days of focused work for a massive architectural improvement.

