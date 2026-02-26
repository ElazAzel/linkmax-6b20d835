import { supabase } from '@/integrations/supabase/client';
import type { PageExperiment, BlockVariation, Block } from '@/types/page';

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
        const { data: experiment, error: expError } = await (supabase as any)
            .from('experiments')
            .insert({
                page_id: pageId,
                name,
                status: 'draft'
            })
            .select()
            .single();

        if (expError) throw expError;

        // 2. Create the variants
        const variantsToInsert = variants.map(v => ({
            experiment_id: experiment.id,
            base_block_id: baseBlockId,
            variant_label: v.variant_label,
            block_data: v.block_data,
            traffic_weight: v.traffic_weight
        }));

        const { error: varError } = await (supabase as any)
            .from('experiment_variants')
            .insert(variantsToInsert);

        if (varError) {
            // Cleanup experiment if variants fail
            await (supabase as any).from('experiments').delete().eq('id', experiment.id);
            throw varError;
        }

        return { data: experiment, error: null };
    } catch (error: any) {
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
        const updateData: any = { status };
        if (status === 'running') {
            updateData.started_at = new Date().toISOString();
        } else if (status === 'ended') {
            updateData.ended_at = new Date().toISOString();
        }

        const { data, error } = await (supabase as any)
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
        const { error } = await (supabase as any)
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
        const { data: experiment, error: expError } = await (supabase as any)
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
            const variant = experiment.experiment_variants.find((v: any) => v.id === variantId);
            if (variant) {
                const { error: blockError } = await supabase
                    .from('blocks')
                    .update({
                        content: variant.block_data
                    } as any)
                    .eq('id', variant.base_block_id);

                if (blockError) throw blockError;
            }
        }

        return { data: experiment, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
}
