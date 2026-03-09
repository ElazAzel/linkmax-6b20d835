/**
 * Preset Recommender
 * Niche-aware preset selection using composition gaps + niche pack config.
 */

import type { Block } from '@/types/page';
import { BLOCK_PRESETS, type BlockPreset } from '@/lib/editor/editor-presets';
import { getNichePack } from './niche-packs';

/**
 * Return presets sorted by relevance to current page state.
 */
export function getRecommendedPresets(
  blocks: Block[],
  niche: string | undefined,
  maxResults = 5
): BlockPreset[] {
  const pack = getNichePack(niche);
  const typeSet = new Set(blocks.map((b) => b.type));
  const preferredIds = new Set(pack.presetIds);

  // Score each preset
  const scored = BLOCK_PRESETS.map((preset) => {
    let score = 0;

    // Boost if in niche pack's recommended presets
    if (preferredIds.has(preset.id)) score += 30;

    // Boost if block type is missing from page
    if (!typeSet.has(preset.blockType)) score += 20;

    // Boost if block type is in niche critical list
    if (pack.criticalBlocks.includes(preset.blockType)) score += 15;

    // Weight from niche pack
    const weight = pack.blockWeights[preset.blockType];
    if (weight) score += Math.round((weight - 1) * 30);

    // Slight penalty if block type already exists (still show, just lower)
    if (typeSet.has(preset.blockType)) score -= 10;

    return { preset, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map((s) => s.preset);
}
