import { describe, expect, it } from 'vitest';
import {
  applyArtDirection,
  applyRecipeToNewSection,
  detectPageRecipeId,
  hasArtDirection,
} from '@/lib/design/art-direction';
import type { Block } from '@/types/blocks';

const mk = (id: string, type: string): Block => ({ id, type, content: {} }) as unknown as Block;

describe('applyRecipeToNewSection (Phase 8)', () => {
  it('annotates a newly inserted section with a shared sectionId', () => {
    const out = applyRecipeToNewSection([], [mk('a', 'text'), mk('b', 'button')]);
    expect(out[0].sectionId).toBeTruthy();
    expect(out[1].sectionId).toBe(out[0].sectionId);
    expect(out[0].composition).toBeTruthy();
    expect(out[1].composition).toBeUndefined();
  });

  it('does not mutate existing blocks', () => {
    const existing = applyArtDirection([mk('a', 'text'), mk('b', 'image')], { recipeId: 'editorial-quiet' }).blocks;
    const before = JSON.stringify(existing);
    applyRecipeToNewSection(existing, [mk('c', 'text')]);
    expect(JSON.stringify(existing)).toBe(before);
  });

  it('detects the page recipe and reports art direction presence', () => {
    const styled = applyArtDirection([mk('a', 'text'), mk('b', 'image')], { recipeId: 'bold-statement' }).blocks;
    expect(detectPageRecipeId(styled)).toBe('bold-statement');
    expect(hasArtDirection(styled)).toBe(true);
    expect(hasArtDirection([mk('x', 'text')])).toBe(false);
  });
});
