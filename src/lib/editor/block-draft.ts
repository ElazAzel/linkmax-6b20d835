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
