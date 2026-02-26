import { useMemo } from 'react';
import type { PageData, Block, PageExperiment, BlockVariation } from '@/types/page';

/**
 * Deterministic hash function for variant allocation
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Hook to resolve which blocks to show based on active experiments
 */
export function usePageExperiments(pageData: PageData | null, visitorId: string | null) {
    const resolvedBlocks = useMemo((): { blocks: Block[]; assignments: Array<{ experimentId: string; variantLabel: string }> } => {
        if (!pageData || !pageData.blocks) return { blocks: [], assignments: [] };
        if (!pageData.experiments || pageData.experiments.length === 0) {
            return { blocks: pageData.blocks, assignments: [] };
        }

        const { blocks, experiments } = pageData;
        const runningExperiments = experiments.filter(exp => exp.status === 'running');

        if (runningExperiments.length === 0) {
            return { blocks, assignments: [] };
        }

        // Map of base block ID to the resolved variant block
        const variantMap = new Map<string, Block>();
        const assignments: Array<{ experimentId: string; variantLabel: string }> = [];

        runningExperiments.forEach(experiment => {
            if (!experiment.variants || experiment.variants.length === 0) return;

            // Deterministic allocation based on visitorId and experimentId
            const seed = `${visitorId || 'anonymous'}-${experiment.id}`;
            const hash = hashString(seed);
            const bucket = hash % 100; // 0-99

            let cumulativeWeight = 0;
            let selectedVariant: BlockVariation | null = null;

            for (const variant of experiment.variants) {
                cumulativeWeight += variant.traffic_weight;
                if (bucket < cumulativeWeight) {
                    selectedVariant = variant;
                    break;
                }
            }

            // If no variant matched (shouldn't happen with 100% weight sum), pick the last one
            if (!selectedVariant && experiment.variants.length > 0) {
                selectedVariant = experiment.variants[experiment.variants.length - 1];
            }

            if (selectedVariant) {
                // Find the base block to get its ID and properties
                const baseBlock = blocks.find(b => b.id === selectedVariant?.base_block_id);
                if (baseBlock) {
                    // Merge variant data over base block
                    variantMap.set(baseBlock.id, {
                        ...baseBlock,
                        ...selectedVariant.block_data,
                        // Ensure ID remains the same for layout consistency
                        id: baseBlock.id,
                        experimentId: experiment.id,
                        variantLabel: selectedVariant.variant_label
                    } as Block);

                    assignments.push({
                        experimentId: experiment.id,
                        variantLabel: selectedVariant.variant_label
                    });
                }
            }
        });

        // Replace base blocks with their variants in the final list
        const finalBlocks = blocks.map(block => {
            return variantMap.get(block.id) || block;
        });

        return { blocks: finalBlocks, assignments };
    }, [pageData, visitorId]);

    return resolvedBlocks;
}
