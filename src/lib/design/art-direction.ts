/**
 * Art Direction pass (Phase 2 of the design hierarchy).
 *
 * "User provides meaning. LinkMAX provides art direction."
 *
 * Takes a FLAT list of blocks (Smart Builder output, template output, or an
 * existing page) and returns the same blocks — same order, same content —
 * annotated with `sectionId`, `composition` and `variant` so the renderer can
 * lay them out as designed sections instead of a stack of identical cards.
 *
 * Deterministic: no LLM, no randomness beyond a seeded pick, so the same input
 * always produces the same page. Never adds, removes or reorders blocks.
 */
import type { BlockType } from '@/types/blocks/base';
import type { Block } from '@/types/blocks';
import { getBlockMeta, type BusinessIntent } from '@/lib/blocks/block-meta';
import { getComposition, type CompositionId } from '@/lib/design/composition';

export type ArtDirectionMood = 'editorial' | 'bold' | 'calm';

export interface PageRecipe {
  id: string;
  labelKey: string;
  labelFallback: string;
  mood: ArtDirectionMood;
  /** Composition used for the opening section. */
  hero: CompositionId;
  /** Compositions used, in order, for the sections after the hero. */
  body: CompositionId[];
  /** Composition for the closing contact/capture section. */
  closing: CompositionId;
  /** Variant applied to the first text block of the hero section. */
  heroTextVariant?: string;
  /** Variant applied to media blocks. */
  mediaVariant?: string;
}

export const PAGE_RECIPES: PageRecipe[] = [
  {
    id: 'editorial-quiet',
    labelKey: 'design.recipe.editorialQuiet',
    labelFallback: 'Редакционный',
    mood: 'editorial',
    hero: 'editorial-hero',
    body: ['stack', 'horizontal-projects', 'bento-proof', 'stack'],
    closing: 'fullscreen-contact',
    heroTextVariant: 'editorial-lead',
    mediaVariant: 'media-editorial-crop',
  },
  {
    id: 'bold-statement',
    labelKey: 'design.recipe.boldStatement',
    labelFallback: 'Смелый',
    mood: 'bold',
    hero: 'split-hero',
    body: ['cinematic-video', 'bento-proof', 'project-spotlight', 'stack'],
    closing: 'fullscreen-contact',
    heroTextVariant: 'display-oversized',
    mediaVariant: 'media-full-bleed',
  },
  {
    id: 'calm-portrait',
    labelKey: 'design.recipe.calmPortrait',
    labelFallback: 'Спокойный',
    mood: 'calm',
    hero: 'overlap-portrait',
    body: ['stack', 'bento-proof', 'horizontal-projects', 'stack'],
    closing: 'stack',
    heroTextVariant: 'editorial-lead',
    mediaVariant: 'media-floating',
  },
];

export function getPageRecipe(id?: string | null): PageRecipe {
  return PAGE_RECIPES.find((r) => r.id === id) ?? PAGE_RECIPES[0];
}

/** Stable string hash so the same niche/slug always resolves to the same recipe. */
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) % 100000;
  }
  return h;
}

export function pickRecipeForSeed(seed: string): PageRecipe {
  if (!seed) return PAGE_RECIPES[0];
  return PAGE_RECIPES[hashSeed(seed) % PAGE_RECIPES.length];
}

const MEDIA_TYPES = new Set<BlockType>(['image', 'gallery', 'carousel', 'video'] as BlockType[]);

/** Primary intent of a block, used to decide where one section ends. */
function primaryIntent(block: Block): BusinessIntent {
  const meta = getBlockMeta(block.type);
  return meta.intents?.[0] ?? 'explain';
}

/** Intents that belong to the same visual section when adjacent. */
const INTENT_GROUP: Record<BusinessIntent, string> = {
  start: 'open',
  explain: 'story',
  show: 'work',
  trust: 'proof',
  sell: 'offer',
  book: 'act',
  capture: 'act',
  contact: 'act',
  events: 'offer',
  community: 'act',
};

export interface ArtDirectionOptions {
  /** Recipe id; when omitted a recipe is picked deterministically from `seed`. */
  recipeId?: string | null;
  /** Seed for recipe selection (niche, slug, or page id). */
  seed?: string;
  /** Keep manual design fields the user already set. */
  preserveExisting?: boolean;
}

export interface ArtDirectionResult {
  blocks: Block[];
  recipe: PageRecipe;
  sectionCount: number;
}

/**
 * Annotate blocks with section grouping + composition + variants.
 * The `profile` block is left untouched (it renders full-bleed above sections).
 */
export function applyArtDirection(
  blocks: Block[],
  options: ArtDirectionOptions = {},
): ArtDirectionResult {
  const recipe = options.recipeId
    ? getPageRecipe(options.recipeId)
    : pickRecipeForSeed(options.seed ?? '');

  if (!blocks || blocks.length === 0) {
    return { blocks: blocks ?? [], recipe, sectionCount: 0 };
  }

  // 1. Split into runs of adjacent blocks that share an intent group.
  const runs: Block[][] = [];
  let currentGroup: string | null = null;

  for (const block of blocks) {
    if (block.type === 'profile') {
      runs.push([block]);
      currentGroup = null;
      continue;
    }
    const group = INTENT_GROUP[primaryIntent(block)] ?? 'story';
    const last = runs[runs.length - 1];
    if (last && currentGroup === group && last[0]?.type !== 'profile' && last.length < 4) {
      last.push(block);
    } else {
      runs.push([block]);
      currentGroup = group;
    }
  }

  // 2. Assign a composition per run following the recipe.
  const sectionRuns = runs.filter((run) => run[0]?.type !== 'profile');
  const lastSectionRun = sectionRuns[sectionRuns.length - 1];
  let bodyIndex = 0;
  let sectionCount = 0;
  const stamp = Date.now().toString(36);

  const out = runs.map((run) => run); // keep reference structure
  const annotated: Block[] = [];

  out.forEach((run, runIndex) => {
    if (run[0]?.type === 'profile') {
      annotated.push(run[0]);
      return;
    }

    const isHero = sectionCount === 0;
    const isClosing = run === lastSectionRun && sectionRuns.length > 1;
    let compositionId: CompositionId;
    if (isHero) {
      compositionId = recipe.hero;
    } else if (isClosing) {
      compositionId = recipe.closing;
    } else {
      compositionId = recipe.body[bodyIndex % recipe.body.length];
      bodyIndex += 1;
    }

    // A single-block run in a multi-column composition looks empty — fall back.
    const def = getComposition(compositionId);
    if (run.length === 1 && def && (def.rhythm === 'split' || def.rhythm === 'bento')) {
      compositionId = 'stack';
    }

    const sectionId = `sec-${stamp}-${runIndex}`;
    sectionCount += 1;

    run.forEach((block, i) => {
      const existingVariant = options.preserveExisting ? block.designVariant : undefined;
      let variant = existingVariant;

      if (!variant) {
        if (isHero && i === 0 && block.type === 'text') {
          variant = recipe.heroTextVariant;
        } else if (MEDIA_TYPES.has(block.type)) {
          variant = recipe.mediaVariant;
        } else if (block.type === 'button') {
          variant = isHero ? 'button-solid-bold' : 'button-pill-quiet';
        }
      }

      annotated.push({
        ...block,
        sectionId: options.preserveExisting && block.sectionId ? block.sectionId : sectionId,
        composition:
          i === 0
            ? options.preserveExisting && block.composition
              ? block.composition
              : compositionId
            : undefined,
        designVariant: variant,
      });
    });
  });

  return { blocks: annotated, recipe, sectionCount };
}

/** Strip all art-direction fields (used by "reset design"). */
export function clearArtDirection(blocks: Block[]): Block[] {
  return (blocks || []).map(({ sectionId, composition, designVariant, ...rest }) => rest as Block);
}
