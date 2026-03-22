import { supabase } from '@/integrations/supabase/client';
import type { PageExperiment, BlockVariation, Block } from '@/types/page';
import type { Json } from '@/integrations/supabase/types';

/**
 * Create a new experiment with initial variants
 */
export async function createExperiment(
    pageId: string,
    name: string,
    baseBlockId: string,
    variants: Omit<BlockVariation, 'id' | 'experiment_id' | 'base_block_id'>[]
) {
    try {
        // 1. Create the experiment
        const { data: experiment, error: expError } = await (supabase as unknown as { from: (schema: string) => any })
            .from('experiments')
            .insert({
                page_id: pageId,
                block_id: baseBlockId,
                name,
                status: 'draft'
            })
            .select()
            .single();

        if (expError) throw expError;

        // 2. Create the variants
        const variantsToInsert = variants.map((v, index) => ({
            experiment_id: experiment.id,
            variant_key: v.variant_label || `variant_${index}`,
            block_data: v.block_data as unknown as Json
        }));

        const { error: varError } = await (supabase as unknown as { from: (schema: string) => any })
            .from('experiment_variants')
            .insert(variantsToInsert);

        if (varError) {
            // Cleanup experiment if variants fail
            await (supabase as unknown as { from: (schema: string) => any }).from('experiments').delete().eq('id', experiment.id);
            throw varError;
        }

        return { data: experiment, error: null };
    } catch (error: unknown) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
}

/**
 * Update experiment status
 */
export async function updateExperimentStatus(
    experimentId: string,
    status: PageExperiment['status']
) {
    try {
        const updateData: { status: PageExperiment['status']; started_at?: string; ended_at?: string } = { status };
        if (status === 'running') {
            updateData.started_at = new Date().toISOString();
        } else if (status === 'ended') {
            updateData.ended_at = new Date().toISOString();
        }

        const { data, error } = await (supabase as unknown as { from: (schema: string) => any })
            .from('experiments')
            .update(updateData)
            .eq('id', experimentId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
}

/**
 * Delete an experiment (variants are deleted via CASCADE)
 */
export async function deleteExperiment(experimentId: string) {
    try {
        const { error } = await (supabase as unknown as { from: (schema: string) => any })
            .from('experiments')
            .delete()
            .eq('id', experimentId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
    }
}

/**
 * Set the winning variant and end the experiment
 */
export async function setWinningVariant(
    experimentId: string,
    variantId: string,
    applyToPage: boolean = false
) {
    try {
        // 1. Mark experiment as ended with winner
        const { data: experiment, error: expError } = await (supabase as unknown as { from: (schema: string) => any })
            .from('experiments')
            .update({
                status: 'ended',
                winning_variant_id: variantId,
                ended_at: new Date().toISOString()
            })
            .eq('id', experimentId)
            .select('*, experiment_variants(*)')
            .single();

        if (expError) throw expError;

        // 2. If applyToPage is true, update the base block with variant data
        if (applyToPage) {
            const variant = experiment.experiment_variants.find((v: { id: string }) => v.id === variantId);
            if (variant) {
                const { error: blockError } = await supabase
                    .from('blocks')
                    .update({
                        content: variant.block_data
                    } as unknown as Record<string, unknown>)
                    .eq('id', experiment.block_id);

                if (blockError) throw blockError;
            }
        }

        return { data: experiment, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
}
