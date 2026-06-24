import { supabase } from '@/platform/supabase/client';
import type { PageExperiment, BlockVariation, Block } from '@/types/page';
import type { Json } from '@/platform/supabase/types';

/**
 * Create a new experiment with initial variants
 */
export async function createExperiment(
    pageId: string,
    name: string,
    baseBlockId: string,
    variants: Omit<BlockVariation, 'id' | 'experiment_id' | 'created_at'>[]
) {
    try {
        // 0. Verify auth + page ownership (LOW-7 fix)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: page } = await supabase
            .from('pages')
            .select('user_id')
            .eq('id', pageId)
            .single();

        if (!page || page.user_id !== user.id) {
            throw new Error('Not authorized to create experiment on this page');
        }

        // 1. Create the experiment
        const { data: experiment, error: expError } = await supabase
            .from('experiments')
            .insert({
                page_id: pageId,
                block_id: baseBlockId,
                name,
                status: 'draft',
                created_by: user.id
            })
            .select()
            .single();

        if (expError) throw expError;

        // 2. Create the variants
        const variantsToInsert = variants.map((v, index) => ({
            experiment_id: experiment.id,
            variant_key: v.variant_key || `variant_${index}`,
            block_data: v.block_data as unknown as import('@/platform/supabase/types').Json,
        }));

        const { error: varError } = await supabase
            .from('experiment_variants')
            .insert(variantsToInsert as never);

        if (varError) {
            // Cleanup experiment if variants fail
            await supabase.from('experiments').delete().eq('id', experiment.id);
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

        const { data, error } = await supabase
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
        const { error } = await supabase
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
        const { data: experiment, error: expError } = await supabase
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
        if (applyToPage && experiment) {
            const variant = experiment.experiment_variants.find((v: { id: string }) => v.id === variantId);
            if (variant) {
                const { error: blockError } = await supabase
                    .from('blocks')
                    .update({
                        content: variant.block_data as unknown as import('@/platform/supabase/types').Json
                    })
                    .eq('id', experiment.block_id);

                if (blockError) throw blockError;
            }
        }

        return { data: experiment, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
}

/**
 * Track an impression (view) for an experiment variant.
 * Called when a visitor sees a specific variant of an A/B test.
 */
export async function trackImpression(
    experimentId: string,
    variantId: string,
    visitorId?: string
) {
    try {
        const { error } = await supabase
            .from('experiment_events')
            .insert({
                experiment_id: experimentId,
                variant_id: variantId,
                event_type: 'impression',
                visitor_id: visitorId || crypto.randomUUID(),
                created_at: new Date().toISOString()
            });

        if (error) {
            console.warn('Failed to track impression:', error.message);
        }
    } catch {
        // Non-blocking — tracking should never break user experience
    }
}

/**
 * Track a conversion event for an experiment variant.
 * Called when a visitor performs the desired action (click, signup, purchase).
 */
export async function trackConversion(
    experimentId: string,
    variantId: string,
    conversionType: string = 'click',
    visitorId?: string
) {
    try {
        const { error } = await supabase
            .from('experiment_events')
            .insert({
                experiment_id: experimentId,
                variant_id: variantId,
                event_type: 'conversion',
                conversion_type: conversionType,
                visitor_id: visitorId || crypto.randomUUID(),
                created_at: new Date().toISOString()
            });

        if (error) {
            console.warn('Failed to track conversion:', error.message);
        }
    } catch {
        // Non-blocking
    }
}

/**
 * Get experiment stats: impressions and conversions per variant.
 */
export async function getExperimentStats(experimentId: string) {
    try {
        const { data, error } = await supabase
            .from('experiment_events')
            .select('variant_id, event_type, conversion_type')
            .eq('experiment_id', experimentId);

        if (error) throw error;

        const stats: Record<string, { impressions: number; conversions: number; conversionRate: number }> = {};

        (data || []).forEach((event) => {
            if (!stats[event.variant_id]) {
                stats[event.variant_id] = { impressions: 0, conversions: 0, conversionRate: 0 };
            }
            if (event.event_type === 'impression') {
                stats[event.variant_id].impressions++;
            } else if (event.event_type === 'conversion') {
                stats[event.variant_id].conversions++;
            }
        });

        // Calculate conversion rates
        Object.values(stats).forEach(s => {
            s.conversionRate = s.impressions > 0 ? (s.conversions / s.impressions) * 100 : 0;
        });

        return { data: stats, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
}
