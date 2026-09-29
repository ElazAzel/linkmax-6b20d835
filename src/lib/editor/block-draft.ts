import type { Block } from '@/types/page';

/** Merge editor patches without dropping fields from the current draft. */
export function mergeBlockDraft(
  current: Partial<Block>,
  updates: Partial<Block>,
): Partial<Block> {
  return {
    ...current,
    ...updates,
    ...(current.blockStyle || updates.blockStyle
      ? {
          blockStyle: {
            ...current.blockStyle,
            ...updates.blockStyle,
          },
        }
      : {}),
  } as Partial<Block>;
}

/**
 * Patch that returns a block to `snapshot`. Block updates are shallow merges
 * (`{ ...block, ...updates }`), so fields added since the snapshot must be
 * cleared explicitly with `undefined` (dropped when the page is serialised).
 */
export function buildRevertPatch(
  snapshot: Partial<Block>,
  current: Partial<Block>,
): Partial<Block> {
  const patch: Record<string, unknown> = { ...snapshot };
  for (const key of Object.keys(current)) {
    if (!(key in snapshot)) patch[key] = undefined;
  }
  return patch as Partial<Block>;
}
