import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import type { ZoneDealField } from '@/types/zones';

export const zoneDealFieldsKeys = {
    all: (zoneId: string) => ['zone-deal-fields', zoneId] as const,
};

async function fetchDealFields(zoneId: string): Promise<ZoneDealField[]> {
    const { data, error } = await supabase
        .from('zone_deal_fields' as any)
        .select('*')
        .eq('zone_id', zoneId)
        .order('order_index', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as ZoneDealField[];
}

export function useZoneDealFields(zoneId: string | null) {
    const queryClient = useQueryClient();
    const safeZoneId = zoneId || '';

    const { data: fields = [], isLoading: loading } = useQuery({
        queryKey: zoneDealFieldsKeys.all(safeZoneId),
        queryFn: () => fetchDealFields(safeZoneId),
        enabled: !!zoneId,
        staleTime: 60_000,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: zoneDealFieldsKeys.all(safeZoneId) });
    };

    const createFieldMutation = useMutation({
        mutationFn: async (field: Partial<ZoneDealField>) => {
            if (!zoneId) throw new Error('No zone selected');
            const { data, error } = await supabase
                .from('zone_deal_fields' as any)
                .insert({
                    ...field,
                    zone_id: zoneId,
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: invalidate,
    });

    const updateFieldMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<ZoneDealField> }) => {
            const { error } = await supabase
                .from('zone_deal_fields' as any)
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: invalidate,
    });

    const deleteFieldMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('zone_deal_fields' as any)
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: invalidate,
    });

    const reorderFieldsMutation = useMutation({
        mutationFn: async (orderedIds: string[]) => {
            const updates = orderedIds.map((id, index) => ({
                id,
                order_index: index,
            }));
            for (const update of updates) {
                const { error } = await supabase
                    .from('zone_deal_fields' as any)
                    .update({ order_index: update.order_index })
                    .eq('id', update.id);
                if (error) throw error;
            }
        },
        onSuccess: invalidate,
    });

    return {
        fields,
        loading,
        createField: async (f: Partial<ZoneDealField>) => createFieldMutation.mutateAsync(f),
        updateField: async (id: string, u: Partial<ZoneDealField>) => updateFieldMutation.mutateAsync({ id, updates: u }),
        deleteField: async (id: string) => deleteFieldMutation.mutateAsync(id),
        reorderFields: async (ids: string[]) => reorderFieldsMutation.mutateAsync(ids),
        refetch: invalidate,
    };
}
