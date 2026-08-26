/**
 * BlockVariant layer (Phase 1).
 *
 * A variant is a named, structured visual preset for an existing block type.
 * It resolves to plain classes + a BlockStyle patch — never to free CSS, and
 * never to a new block type. Stored as `block.variant`.
 */

import type { BlockStyle } from '@/types/blocks/base';

export type SemanticRole =
  | 'display'
  | 'headline'
  | 'title'
  | 'body'
  | 'caption'
  | 'label'
  | 'metric';

export interface BlockVariantDef {
  id: string;
  labelKey: string;
  labelFallback: string;
  /** Applies to these block types (empty = any). */
  appliesTo: string[];
  /** Extra wrapper classes. */
  className?: string;
  /** Deterministic BlockStyle patch merged under the user's own settings. */
  stylePatch?: Partial<BlockStyle>;
  /** Typography role hint for text-like blocks. */
  role?: SemanticRole;
  /** Removes card chrome. */
  naked?: boolean;
}

export const BLOCK_VARIANTS: BlockVariantDef[] = [
  {
    id: 'display-oversized',
    labelKey: 'editor.variant.displayOversized',
    labelFallback: 'Крупный дисплейный',
    appliesTo: ['text', 'heading'],
    className: 'lm-display-scale tracking-tight',
    role: 'display',
    naked: true,
  },
  {
    id: 'editorial-lead',
    labelKey: 'editor.variant.editorialLead',
    labelFallback: 'Редакционный лид',
    appliesTo: ['text'],
    className: 'text-balance leading-relaxed max-w-[46ch]',
    role: 'body',
    naked: true,
  },
  {
    id: 'label-eyebrow',
    labelKey: 'editor.variant.labelEyebrow',
    labelFallback: 'Надзаголовок',
    appliesTo: ['text'],
    className: 'text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground',
    role: 'label',
    naked: true,
  },
  {
    id: 'metric-big',
    labelKey: 'editor.variant.metricBig',
    labelFallback: 'Метрика',
    appliesTo: ['text'],
    className: 'text-4xl font-semibold tabular-nums',
    role: 'metric',
  },
  {
    id: 'button-pill-quiet',
    labelKey: 'editor.variant.buttonPillQuiet',
    labelFallback: 'Тихая пилюля',
    appliesTo: ['button', 'link', 'messenger'],
    stylePatch: { borderRadius: 'full', shadow: 'none', borderWidth: 'thin' },
  },
  {
    id: 'button-solid-bold',
    labelKey: 'editor.variant.buttonSolidBold',
    labelFallback: 'Плотная кнопка',
    appliesTo: ['button', 'link', 'messenger'],
    stylePatch: { borderRadius: 'md', shadow: 'lg', padding: 'lg' },
  },
  {
    id: 'media-full-bleed',
    labelKey: 'editor.variant.mediaFullBleed',
    labelFallback: 'Во всю ширину',
    appliesTo: ['image', 'video', 'carousel', 'gallery'],
    className: 'w-full',
    stylePatch: { borderRadius: 'none', shadow: 'none', padding: 'none' },
    naked: true,
  },
  {
    id: 'media-editorial-crop',
    labelKey: 'editor.variant.mediaEditorialCrop',
    labelFallback: 'Редакционный кроп',
    appliesTo: ['image', 'carousel', 'gallery'],
    className: 'aspect-[4/5] overflow-hidden',
    stylePatch: { borderRadius: 'sm', shadow: 'none' },
  },
  {
    id: 'media-floating',
    labelKey: 'editor.variant.mediaFloating',
    labelFallback: 'Парящее медиа',
    appliesTo: ['image', 'video'],
    className: 'w-[86%] mx-auto',
    stylePatch: { borderRadius: 'lg', shadow: 'xl' },
  },
  {
    id: 'card-quiet',
    labelKey: 'editor.variant.cardQuiet',
    labelFallback: 'Тихая карточка',
    appliesTo: [],
    stylePatch: { shadow: 'none', borderWidth: 'thin', borderRadius: 'lg' },
  },
];

const VARIANT_MAP = new Map(BLOCK_VARIANTS.map((v) => [v.id, v]));

export function getBlockVariant(id?: string | null): BlockVariantDef | undefined {
  if (!id) return undefined;
  return VARIANT_MAP.get(id);
}

export function getVariantsForType(type: string): BlockVariantDef[] {
  return BLOCK_VARIANTS.filter((v) => v.appliesTo.length === 0 || v.appliesTo.includes(type));
}

/** Resolve a variant for a block, ignoring variants that do not apply to its type. */
export function resolveBlockVariant(type: string, variantId?: string | null) {
  const variant = getBlockVariant(variantId);
  if (!variant) return undefined;
  if (variant.appliesTo.length > 0 && !variant.appliesTo.includes(type)) return undefined;
  return variant;
}
