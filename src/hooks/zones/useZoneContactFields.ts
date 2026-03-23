import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import type { ZoneContactField } from '@/types/zones';

export const zoneContactFieldsKeys = {
    all: (zoneId: string) => ['zone-contact-fields', zoneId] as const,
};

async function fetchFields(zoneId: string): Promise<ZoneContactField[]> {
    const { data, error } = await supabase
        .from('zone_contact_fields')
        .select('*')
        .eq('zone_id', zoneId)
        .order('order_index');
    if (error) throw error;
    return (data || []) as unknown as ZoneContactField[];
}

export function useZoneContactFields(zoneId: string | null) {
    const queryClient = useQueryClient();
    const safeZoneId = zoneId || '';

    const { data: fields = [], isLoading: loading } = useQuery({
        queryKey: zoneContactFieldsKeys.all(safeZoneId),
        queryFn: () => fetchFields(safeZoneId),
        enabled: !!zoneId,
        staleTime: 60_000,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: zoneContactFieldsKeys.all(safeZoneId) });
    };

    const createFieldMutation = useMutation({
        mutationFn: async (field: Partial<ZoneContactField>) => {
            if (!zoneId) throw new Error('No zone selected');
            const { data, error } = await supabase
                .from('zone_contact_fields')
                .insert({ ...field, zone_id: zoneId })
                .select()
                .single();
            if (error) throw error;
            return data as ZoneContactField;
        },
        onSuccess: invalidate,
    });

    const updateFieldMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<ZoneContactField> }) => {
            const { error } = await supabase
                .from('zone_contact_fields')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: invalidate,
    });

    const deleteFieldMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('zone_contact_fields')
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
            // Simple loop for reordering since Supabase bulk update is tricky without rpc
            for (const update of updates) {
                await supabase
                    .from('zone_contact_fields')
                    .update({ order_index: update.order_index })
                    .eq('id', update.id);
            }
        },
        onSuccess: invalidate,
    });

    return {
        fields,
        loading,
        createField: (field: Partial<ZoneContactField>) => createFieldMutation.mutateAsync(field),
        updateField: (id: string, updates: Partial<ZoneContactField>) => updateFieldMutation.mutateAsync({ id, updates }),
        deleteField: (id: string) => deleteFieldMutation.mutateAsync(id),
        reorderFields: (orderedIds: string[]) => reorderFieldsMutation.mutateAsync(orderedIds),
        refetch: invalidate,
    };
}
