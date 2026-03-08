

# P1: Manifest-Driven BlockRenderer + BlockEditorV2 + Cleanup Duplicates

## What we're doing

4 tasks to complete the architectural consolidation:

1. **Rewrite `BlockRenderer.tsx`** — replace 450-line switch with manifest-driven lookup (~60 lines of logic)
2. **Rewrite `BlockEditorV2.tsx`** — replace 28 lazy imports + icon map + switch with manifest-driven lookup
3. **Clean `domain/entities/Block.ts`** — remove duplicate `BLOCK_CATEGORIES`, `PREMIUM_BLOCK_TYPES`, `isPremiumBlockType()`, `getBlockCategory()`. Keep only pure domain logic (`isBlockScheduledVisible`, `generateBlockId`, `validateBlock`, `BaseBlock`, `BlockSchedule`, `GridLayoutData`). Re-export `BlockType` from `@/types/blocks/base` instead of duplicating.
4. **Clean `block-editor-types.ts`** — remove duplicate `BLOCK_CATEGORIES` and `getBlockCategory()`. Keep only editor-specific types (`DeletedBlockInfo`, `BlockEditorProps`, `BlockInsertResult`, etc.)

## Key design decisions

### BlockRenderer manifest-driven rendering

The manifest already has `renderMode` ('trackable' | 'simple') and `rendererPropsKeys`. The new renderer:

- Looks up `BLOCK_MANIFEST[block.type]`
- If `renderMode === 'trackable'` → wraps with `PaidBlockWrapper` + analytics
- If `renderMode === 'simple'` → wraps with animation div only  
- Builds renderer props from `rendererPropsKeys` (maps `onClick` → `handleTrackClick`, `onPlatformClick` → `handleTrackClick`)
- Passes standard props: `block`, `isPreview`, `pageOwnerId`, `pageId`, `isOwnerPremium`, `ownerTier`

**Special cases to handle**: `ShoutoutBlock` takes `userId`/`message` props instead of `block` prop. The manifest approach will standardize: pass `block` as the primary prop to all renderers. ShoutoutBlock's renderer entry will receive the full block and destructure internally — this requires a small ShoutoutBlock adapter (or we just pass `block` and update ShoutoutBlock to accept it).

Given ShoutoutBlock, BookingBlock, CommunityBlock, EventBlock all have slightly custom prop passing in the current switch, the cleanest approach: pass the full standard props set to every renderer via manifest, and let each component destructure what it needs. For ShoutoutBlock specifically, we'll update it to accept a `block` prop pattern like all others.

### BlockEditorV2 manifest-driven editing

- Remove all 28 lazy imports (already in manifest)
- Remove `BLOCK_ICONS` map (use `getBlockIcon()` from manifest)
- Replace `renderEditor()` switch with: `const EditorComponent = BLOCK_MANIFEST[block.type].editor` + `<Suspense><EditorComponent {...commonProps} /></Suspense>`
- Special case: `profile` editor gets `onComplete` prop — handle via check `if (block.type === 'profile')` for that one prop

## Files changed

| File | Action |
|------|--------|
| `src/components/editor/BlockRenderer.tsx` | Rewrite: ~450 → ~80 lines |
| `src/components/editor/BlockEditorV2.tsx` | Rewrite switch + remove lazy imports + icon map |
| `src/components/blocks/ShoutoutBlock.tsx` | Update to accept `block` prop (align with all other blocks) |
| `src/domain/entities/Block.ts` | Remove duplicates, re-export BlockType from base |
| `src/domain/entities/__tests__/Block.test.ts` | Update tests for removed exports |
| `src/types/block-editor-types.ts` | Remove BLOCK_CATEGORIES + getBlockCategory |

## Net result

- ~800 lines of duplicated switch/routing code eliminated
- Single source of truth: `BLOCK_MANIFEST` drives rendering, editing, icons, categories, premium gating
- Adding a new block = 1 manifest entry + type + renderer + editor (compile-time checked)

