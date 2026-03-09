

## A. Verdict

### What already works algorithmically:
- **Block recommendations** — niche-based weight tables with missing-need bonuses (block-recommendations.ts)
- **Quality score** — 8-check deterministic scoring rubric for search readiness (quality-score.ts)
- **Block validators** — per-type validation functions (block-validators.ts)
- **Editor analytics** — event tracking with debounce (editor-analytics.ts)
- **Presets** — 15 starter presets (editor-presets.ts)
- **Block summaries** — per-type human-readable labels (editor-summaries.ts)

### Where platform still depends on manual actions instead of algorithms:
1. **No composition analysis** — system doesn't know page has pricing without CTA, or trust blocks in wrong position
2. **No next-best-action** — user must figure out what to do next; quality score only covers search readiness
3. **No block quality evaluation** — validators are pass/fail, no "this is weak" detection
4. **No structural anti-pattern detection** — no reorder suggestions
5. **No publish/activation readiness** — only search readiness exists; no "ready to get first booking" engine

### 5 zones improvable with algorithms, zero tokens:
1. **Page composition gaps** — deterministic rules detect missing CTA, trust, contact paths
2. **Block ordering** — scoring ideal position vs actual, detect anti-patterns
3. **Next-best-action ranking** — weighted scoring of all possible actions by impact/effort
4. **Block quality grading** — content thinness, missing fields, weak labels — all rule-based
5. **Niche-specific ideal stacks** — config-driven, not ML

### Where ML-lite is justified vs overkill:
- **Justified later (P4):** recommendation re-ranking from accept/dismiss data, preset performance scoring
- **Overkill now:** anything requiring training data we don't have yet; all P3 targets are solvable with rules+scoring

---

## B. P3 Scope

Implementing priorities 1-7 from the prompt:

1. **Next-Best-Action Engine** — ranked suggestions with reasons
2. **Page Composition Analyzer** — coverage, gaps, structural report
3. **Block Quality Evaluator** — per-block weakness detection
4. **Structural Repair Engine** — anti-pattern detection + reorder suggestions
5. **Publish/Activation/Conversion Readiness** — three readiness models
6. **Niche Heuristic Packs** — 7 niche configs driving all engines
7. **Smart Preset Selection** — niche-aware preset recommendations

Deferred to P4: personalization/reranking, friction prediction, admin insights dashboards.

---

## C. Architecture

New module: `src/lib/intelligence/`

```text
src/lib/intelligence/
├── types.ts                    # Shared types for all engines
├── niche-packs.ts              # 7 niche heuristic configurations
├── composition-analyzer.ts     # Page composition report
├── block-quality-evaluator.ts  # Per-block quality grading
├── structural-repair.ts        # Anti-pattern detection + reorder suggestions
├── readiness-engines.ts        # Publish / Activation / Conversion readiness
├── next-best-action.ts         # NBA engine (consumes all above)
└── preset-recommender.ts       # Niche-aware preset selection
```

All engines are **pure functions**: `(pageData, niche, context) => result`. Zero network calls. Zero tokens. Run on every relevant render via `useMemo`.

### Integration surface:
- New hook: `src/hooks/editor/usePageIntelligence.ts` — memoized composition of all engines
- Consumed by: EditorScreen (hint banner), StructureView (block quality badges), Command Palette (smart suggestions)

---

## D. Implementation Details

### 1. `types.ts` — Shared contracts

```typescript
export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';
export type SuggestionEffort = 'instant' | 'quick' | 'moderate';
export type SuggestionCategory = 'add_block' | 'fix_block' | 'reorder' | 'fill_field' | 'publish' | 'share' | 'settings';

export interface Suggestion {
  id: string;
  titleKey: string;
  reasonKey: string;
  priority: SuggestionPriority;
  effort: SuggestionEffort;
  category: SuggestionCategory;
  impactScore: number;    // 0-100
  targetBlockId?: string;
  targetBlockType?: string;
  actionType: string;     // e.g. 'insert_booking', 'reorder', 'fill_pricing'
  meta?: Record<string, unknown>;
}

export interface BlockQualityReport {
  blockId: string;
  blockType: string;
  score: number;          // 0-100
  issues: BlockIssue[];
}

export interface BlockIssue {
  key: string;
  severity: 'error' | 'warning' | 'info';
  messageKey: string;
}

export interface CompositionReport {
  coverage: Record<string, boolean>;  // e.g. { hasCTA: true, hasTrust: false }
  missingEssentials: string[];
  weakSpots: string[];
  structuralScore: number;
  conversionReadiness: number;
  suggestions: Suggestion[];
}

export interface ReadinessResult {
  ready: boolean;
  score: number;
  blockers: string[];
  improvements: string[];
}
```

### 2. `niche-packs.ts` — 7 niche configurations

Each pack defines:
- `idealStack: BlockType[]` — ordered ideal block sequence
- `criticalBlocks: BlockType[]` — must-have for this niche
- `trustBlocks: BlockType[]` — trust signals
- `ctaBlocks: BlockType[]` — conversion actions
- `antiPatterns: AntiPattern[]` — specific structural rules
- `presetIds: string[]` — recommended presets

Packs for: `beauty`, `expert`, `freelancer`, `local_business`, `education`, `events`, `commerce`. Mapped from existing 15 niches via `mapNicheToPageNiche`.

### 3. `composition-analyzer.ts`

Pure function `analyzeComposition(blocks, niche, pageData)`:
- Classifies blocks into roles: `identity`, `offer`, `trust`, `cta`, `contact`, `content`, `filler`
- Checks coverage: hasIdentity, hasOffer, hasTrust, hasCTA, hasContact, hasContent
- Detects: duplicate roles, missing paths (offer without CTA), content thinness
- Returns `CompositionReport` with structural score (0-100)

Block role mapping (deterministic):
```
identity: profile, avatar
offer: pricing, product, catalog, booking
trust: testimonial, before_after, community
cta: button, messenger, form, newsletter
contact: messenger, form, booking, map
content: text, image, video, carousel, faq, event
filler: separator, socials, link, download, shoutout
```

### 4. `block-quality-evaluator.ts`

Registry of evaluators per block type. Each returns `BlockQualityReport`.

Examples:
- **text:** `content.length < 20` → warning "too short"; `content.length > 500` → warning "wall of text"
- **pricing:** `items.length === 0` → error "no services"; items without price → warning
- **button:** label is generic ("Click here") → warning; no URL → error
- **messenger:** no username filled → error
- **booking:** no title → warning
- **faq:** fewer than 2 questions → warning; generic questions → info
- **testimonial:** text shorter than 15 chars → warning
- **form:** more than 6 fields → warning "too many fields"
- **profile:** no bio or bio < 30 chars → warning

### 5. `structural-repair.ts`

Detects anti-patterns and suggests reorders:

Anti-pattern rules (each is a scored check):
- `booking_too_low` — booking below 70% of page → suggest moving up
- `cta_without_context` — CTA in top 2 positions without offer block above → suggest adding context
- `trust_before_offer` — testimonial appears before any offer block → suggest moving after
- `pricing_after_faq` — FAQ above pricing → suggest swapping
- `consecutive_text_blocks` — 3+ text blocks in a row → suggest breaking with visual/action
- `socials_above_cta` — socials higher than primary CTA → suggest moving down
- `missing_hero` — first non-profile block is filler → suggest better first block
- `action_without_offer` — messenger/form without pricing/text above → suggest adding context

Output: `StructuralSuggestion[]` with `fromIndex`, `toIndex`, `reason`.

### 6. `readiness-engines.ts`

Three engines, all pure functions:

**A. Publish Readiness** `(pageData) => ReadinessResult`
- Blockers: no profile block, no content blocks, page has 0 non-profile blocks
- Improvements: add CTA, fill empty blocks

**B. Activation Readiness** `(pageData, niche) => ReadinessResult`
- Will page get first visitor → first response → first booking?
- Checks: has shareable content, has CTA, has contact method, has offer clarity
- Score based on weighted checks

**C. Conversion Readiness** `(pageData, niche) => ReadinessResult`
- Checks: offer clarity (pricing/text), trust (testimonial/before_after), CTA path, no friction sinks, visible next step
- Missing answer blocks check (has booking but no FAQ)

All reuse `computeQualityScore` for search readiness (already exists).

### 7. `next-best-action.ts`

The main engine. Consumes outputs from all other engines:

```typescript
function getNextBestActions(
  pageData: PageData,
  niche: string | undefined,
  options?: { maxResults?: number; isPremium?: boolean }
): Suggestion[]
```

Algorithm:
1. Run `analyzeComposition` → get coverage gaps
2. Run `evaluateAllBlocks` → get block issues
3. Run `detectAntiPatterns` → get structural problems
4. Run all readiness engines → get blockers
5. Generate candidate suggestions from all sources
6. Score each: `impactScore = baseWeight * nicheMultiplier * urgencyBoost - effortPenalty`
7. Deduplicate (same target block + same action)
8. Sort by impactScore descending
9. Return top N (default 5)

Scoring weights:
- Missing critical block for niche: base 80
- Empty/broken existing block: base 70
- Structural anti-pattern: base 60
- Missing nice-to-have block: base 40
- Minor quality issue: base 20
- Publish action (if ready): base 90
- Share action (if published): base 85

### 8. `preset-recommender.ts`

`getRecommendedPresets(blocks, niche, maxResults)` — returns presets sorted by relevance to current page state. Uses niche pack's `presetIds` + composition gaps to boost relevant presets.

### 9. `usePageIntelligence.ts` hook

```typescript
function usePageIntelligence(pageData: PageData | null, niche?: string) {
  return useMemo(() => {
    if (!pageData) return null;
    const composition = analyzeComposition(pageData.blocks, niche, pageData);
    const blockQuality = evaluateAllBlocks(pageData.blocks);
    const structural = detectAntiPatterns(pageData.blocks, niche);
    const publishReady = checkPublishReadiness(pageData);
    const activationReady = checkActivationReadiness(pageData, niche);
    const conversionReady = checkConversionReadiness(pageData, niche);
    const nextActions = getNextBestActions(pageData, niche);
    return { composition, blockQuality, structural, publishReady, activationReady, conversionReady, nextActions };
  }, [pageData, niche]);
}
```

### 10. UI Integration (minimal)

- **EditorScreen**: Show top suggestion as a dismissible banner below toolbar
- **StructureView**: Show quality badge (green/yellow/red dot) per block
- **Command Palette**: Add "Suggested" group at top with NBA results

---

## E. Why this is better than AI

| Dimension | Algorithmic (this plan) | LLM-based |
|-----------|------------------------|-----------|
| Cost | 0 tokens, 0 API calls | ~$0.01-0.05 per page analysis |
| Latency | <1ms (pure JS) | 500-3000ms per call |
| Explainability | Every suggestion has coded reason | Black box |
| Robustness | Deterministic, testable | Non-deterministic |
| Maintainability | Config-driven, type-safe | Prompt engineering |
| UX | Instant, always available | Loading states, failures |

---

## F. Decision Tables

| Area | Deterministic rules | Heuristics | ML-lite | LLM needed? | Choice |
|------|-------------------|------------|---------|-------------|--------|
| Composition analysis | Yes | — | — | No | Rules |
| Block quality eval | Yes | — | — | No | Rules |
| Anti-pattern detection | Yes | — | — | No | Rules |
| Next-best-action | Yes | Scoring weights | — | No | Rules + scoring |
| Readiness engines | Yes | — | — | No | Rules |
| Niche packs | Yes (config) | — | — | No | Config |
| Preset selection | — | Scoring | — | No | Heuristic ranking |
| Reorder suggestions | Yes | Position scoring | — | No | Rules + scoring |
| Personalization (P4) | — | — | Bandit | Optional | Deferred |
| Friction prediction (P4) | — | Session patterns | — | No | Deferred |

| Improvement | Expected UX gain | Dev complexity | Runtime cost | Priority |
|------------|-----------------|---------------|-------------|----------|
| Next-best-action engine | High — guides every session | Medium | ~0ms | 1 |
| Composition analyzer | High — reveals gaps instantly | Medium | ~0ms | 2 |
| Block quality evaluator | Medium — prevents weak blocks | Low | ~0ms | 3 |
| Structural repair | Medium — fixes ordering issues | Medium | ~0ms | 4 |
| Readiness engines | High — drives publish/activation | Low | ~0ms | 5 |
| Niche heuristic packs | High — makes all engines smarter | Low | ~0ms | 6 |
| Smart preset selection | Medium — faster block assembly | Low | ~0ms | 7 |

