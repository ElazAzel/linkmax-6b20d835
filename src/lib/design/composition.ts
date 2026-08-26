/**
 * Composition layer (Phase 1).
 *
 * A Composition describes HOW a group of blocks visually works together
 * inside one section — rhythm, grid, emphasis and background treatment.
 * It never changes block content and never introduces new block types.
 *
 * Storage: `block.composition` (optional) on the FIRST block of a section run.
 * Blocks without a composition keep the legacy bento rendering — fully
 * backward compatible.
 */

export type SectionRhythm =
  | 'contained'
  | 'full-bleed'
  | 'split'
  | 'overlap'
  | 'sticky'
  | 'horizontal'
  | 'bento'
  | 'editorial'
  | 'spotlight'
  | 'stack';

export type CompositionId =
  | 'stack'
  | 'split-hero'
  | 'editorial-hero'
  | 'overlap-portrait'
  | 'cinematic-video'
  | 'project-spotlight'
  | 'bento-proof'
  | 'fullscreen-contact'
  | 'horizontal-projects';

export interface CompositionDef {
  id: CompositionId;
  rhythm: SectionRhythm;
  labelKey: string;
  labelFallback: string;
  /** Outer section shell classes (background, padding, width behaviour). */
  shellClass: string;
  /** Inner container classes (grid / flex definition). */
  gridClass: string;
  /** Per-item classes, resolved by position in the section. */
  itemClass?: (index: number, total: number) => string;
  /** Suppress default card chrome so pages stop looking like repeated cards. */
  naked?: boolean;
}

const COMPOSITION_LIST: CompositionDef[] = [
  {
    id: 'stack',
    rhythm: 'stack',
    labelKey: 'editor.composition.stack',
    labelFallback: 'Стопка',
    shellClass: 'py-6',
    gridClass: 'flex flex-col gap-4',
  },
  {
    id: 'split-hero',
    rhythm: 'split',
    labelKey: 'editor.composition.splitHero',
    labelFallback: 'Split-герой',
    shellClass: 'py-8',
    gridClass: 'grid grid-cols-1 md:grid-cols-2 gap-6 md:items-center [&>*]:min-w-0',
    naked: true,
  },
  {
    id: 'editorial-hero',
    rhythm: 'editorial',
    labelKey: 'editor.composition.editorialHero',
    labelFallback: 'Редакционный герой',
    shellClass: 'py-8 sm:py-10',
    gridClass: 'flex flex-col gap-3 text-left [&>*]:min-w-0',
    itemClass: (i) => (i === 0 ? 'lm-display-scale max-w-[22ch]' : 'max-w-[46ch]'),
    naked: true,
  },
  {
    id: 'overlap-portrait',
    rhythm: 'overlap',
    labelKey: 'editor.composition.overlapPortrait',
    labelFallback: 'Портрет с наложением',
    shellClass: 'pt-8 pb-10',
    gridClass: 'relative flex flex-col gap-0',
    itemClass: (i) => (i === 0 ? 'z-10' : '-mt-8 md:-mt-12 z-20 relative'),
    naked: true,
  },
  {
    id: 'cinematic-video',
    rhythm: 'full-bleed',
    labelKey: 'editor.composition.cinematicVideo',
    labelFallback: 'Кинематографичное видео',
    shellClass: '-mx-4 sm:-mx-6 py-0',
    gridClass: 'flex flex-col gap-0',
    naked: true,
  },
  {
    id: 'project-spotlight',
    rhythm: 'spotlight',
    labelKey: 'editor.composition.projectSpotlight',
    labelFallback: 'Спотлайт проекта',
    shellClass: 'py-8',
    gridClass: 'grid grid-cols-1 gap-5 [&>*]:min-w-0',
    itemClass: (i) => (i === 0 ? 'md:scale-[1.02] origin-left' : ''),
  },
  {
    id: 'bento-proof',
    rhythm: 'bento',
    labelKey: 'editor.composition.bentoProof',
    labelFallback: 'Бенто-доказательства',
    shellClass: 'py-8',
    // Phase 10: one column on phones — two columns of tiny cards were unreadable.
    gridClass:
      'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 grid-flow-row-dense auto-rows-[minmax(0,auto)] [&>*]:min-w-0',
    itemClass: (i, total) => (total > 2 && i === 0 ? 'sm:col-span-2' : ''),
  },
  {
    id: 'fullscreen-contact',
    rhythm: 'full-bleed',
    labelKey: 'editor.composition.fullscreenContact',
    labelFallback: 'Контакт на весь экран',
    shellClass: 'py-10 sm:py-14 text-center',
    gridClass: 'flex flex-col items-center gap-5 w-full [&>*]:min-w-0 [&>*]:max-w-full',
    naked: true,
  },
  {
    id: 'horizontal-projects',
    rhythm: 'horizontal',
    labelKey: 'editor.composition.horizontalProjects',
    labelFallback: 'Горизонтальная лента',
    shellClass: 'py-8 -mx-4 px-4 sm:-mx-6 sm:px-6',
    gridClass:
      'flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    itemClass: () => 'snap-start shrink-0 w-[86%] xs:w-[78%] sm:w-[46%] min-w-0',
  },
];

export const COMPOSITIONS: Record<CompositionId, CompositionDef> = COMPOSITION_LIST.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CompositionId, CompositionDef>,
);

export const COMPOSITION_IDS = COMPOSITION_LIST.map((c) => c.id);

export function getComposition(id?: string | null): CompositionDef | undefined {
  if (!id) return undefined;
  return COMPOSITIONS[id as CompositionId];
}

export function isCompositionId(id?: string | null): id is CompositionId {
  return !!id && id in COMPOSITIONS;
}
