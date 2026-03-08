

# Fix: Broken Dynamic Imports in Block Manifest (MIME type errors)

## Root Cause

`lazyBlock` and `lazyEditor` in `block-manifest.ts` use **variable-based dynamic imports**:

```ts
const lazyBlock = (path: string, exportName: string) =>
  lazy(() => import(`../../components/blocks/${path}`).then(...));
```

Vite can resolve these during **dev** (using glob matching), but in **production builds**, the chunks are emitted with hashed names under `/assets/`. The browser resolves the import path literally (e.g. `/components/blocks/FormBlock`), gets the SPA's `index.html` instead of JS, and fails with MIME type mismatch.

## Fix

Replace the generic `lazyBlock`/`lazyEditor` helpers with **explicit static `lazy(() => import(...))` calls** for each block. Vite can statically analyze these and emit proper chunks.

Each manifest entry will have its renderer/editor defined as:
```ts
renderer: lazy(() => import('@/components/blocks/ProfileBlock').then(m => ({ default: m.ProfileBlock }))),
editor: lazy(() => import('@/components/block-editors/ProfileEditorWizard').then(m => ({ default: m.ProfileEditorWizard }))),
```

This is ~28 entries × 2 imports = 56 explicit import statements. Verbose but correct — Vite needs static strings in `import()` calls for production code splitting.

## Changes

| File | Action |
|------|--------|
| `src/lib/blocks/block-manifest.ts` | Remove `lazyBlock`/`lazyEditor` helpers. Replace all 28 renderer + 28 editor entries with explicit `lazy(() => import('...'))` calls using static string paths. |

No other files change. The manifest interface and all consumers remain identical.

