import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import type { PageExperiment, BlockVariation } from '@/types/page';

export interface VariantWithStats extends BlockVariation {
    stats: {
        views: number;
        clicks: number;
        ctr: number;
    };
}

export interface ExperimentWithStats extends Omit<PageExperiment, 'variants'> {
    variants: VariantWithStats[];
}

export function useExperimentAnalytics(pageId: string | null) {
    const [experiments, setExperiments] = useState<ExperimentWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchExperiments = useCallback(async () => {
        if (!pageId) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Fetch experiments with variants
            const { data: exps, error: expError } = await (supabase as any)
                .from('experiments')
                .select('*, variants:experiment_variants(*)')
                .eq('page_id', pageId)
                .order('created_at', { ascending: false });

            if (expError) throw expError;

            // 2. Enrich with stats from analytics
            const enrichedExps = await Promise.all((exps || []).map(async (exp: any) => {
                const { data: events, error: analError } = await supabase
                    .from('analytics')
                    .select('event_type, metadata')
                    .eq('page_id', pageId)
                    .contains('metadata', { experimentId: exp.id });

                if (analError) {
                    console.warn(`Could not fetch stats for experiment ${exp.id}:`, analError);
                    return {
                        ...exp,
                        variants: exp.variants.map((v: any) => ({
                            ...v,
                            stats: { views: 0, clicks: 0, ctr: 0 }
                        }))
                    };
                }

                const eventsList = (events || []) as any[];

                const variantsWithStats = exp.variants.map((v: any) => {
                    const vEvents = eventsList.filter((e: any) => e.metadata?.variantLabel === v.variant_label);
                    const views = vEvents.filter((e: any) => e.event_type === 'view').length;
                    const clicks = vEvents.filter((e: any) => e.event_type === 'click').length;
                    const ctr = views > 0 ? (clicks / views) * 100 : 0;

                    return {
                        ...v,
                        stats: { views, clicks, ctr }
                    };
                });

                return {
                    ...exp,
                    variants: variantsWithStats
                };
            }));

            setExperiments(enrichedExps);
        } catch (err: any) {
            setError(err instanceof Error ? err : new Error(String(err)));
            console.error('Error fetching experiment analytics:', err);
        } finally {
            setLoading(false);
        }
    }, [pageId]);

    useEffect(() => {
        if (pageId) {
            fetchExperiments();
        }
    }, [fetchExperiments, pageId]);

    return {
        experiments,
        loading,
        error,
        refresh: fetchExperiments
    };
}
