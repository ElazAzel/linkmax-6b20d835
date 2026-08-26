---
name: content-creation
description: AI bio-page builder, content blocks, SEO copy generation, rich text, and multilingual copy workflows.
---

# Content Creation & Bio-Pages

Use for visual page builder blocks, AI wizard page generation, rich text styling, blog articles, and localized copy.

## When to Use
- Adding or modifying block types in the page editor (`src/components/blocks/`, `src/components/block-editors/`).
- AI Wizard bio-page generation (`AIBuilderWizard`, `ai-content-generator` Edge Function).
- SEO content generation and structured meta descriptions.
- Writing or formatting blog articles in `src/lib/blog-posts.ts`.

## Core Workflows

### 1. Adding a New Block Type
1. Define block schema and TypeScript type in `src/types/` (must extend base `Block` interface).
2. Register default data in `src/lib/blocks/block-factory.ts` and `src/lib/blocks/block-manifest.ts`.
3. Create presentation renderer in `src/components/blocks/<BlockName>.tsx`.
4. Create configuration editor in `src/components/block-editors/<BlockName>Editor.tsx`.
5. Add i18n keys for block title, description, and field placeholders in `src/i18n/locales/ru.json` and `en.json`.
6. Add unit/smoke test in `src/components/blocks/__tests__/`.

### 2. AI Page Generation Wizard
1. Collect user niche, tone of voice, social links, and key services.
2. Invoke `ai-content-generator` Edge Function or client fallback in `src/lib/ai-helpers.ts`.
3. Parse generated JSON blocks, validate structure, and inject into `useEditorStore`.
4. Trigger auto-save batcher in `src/lib/editor/autosave-batcher.ts`.

### 3. SEO Content & Rich Text
1. Sanitize any rich text input via `dompurify` (e.g. `src/lib/rich-text-parser.tsx`).
2. Generate schema.org JSON-LD structured data via `src/lib/seo/`.

## Key Files & Services
- **Editor Store**: `src/store/useEditorStore.ts`, `src/lib/editor/`
- **Block System**: `src/components/blocks/`, `src/components/block-editors/`, `src/lib/blocks/`
- **AI Generators**: `src/components/editor/ai/AIBuilderWizard.tsx`, `supabase/functions/ai-content-generator`
- **Niches & Landings**: `src/lib/niches.ts`, `src/lib/niche-landing-data.ts`, `src/lib/blog-posts.ts`

## Commands & Verification
```bash
npm run typecheck:strict
npm run i18n:check
npm run test -- src/components/blocks/
```

## Best Practices & Guardrails
- **XSS Prevention**: Never render raw HTML without `DOMPurify.sanitize`.
- **Responsive Layout**: Every block must look flawless on 390px mobile viewports as well as desktop.
- **i18n Completeness**: Never hardcode user-visible UI labels; use `t('...')` hooks.
