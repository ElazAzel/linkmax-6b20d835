/**
 * Hook: Manage zone product catalog (React Query)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import type { ZoneProduct } from '@/types/zones';

// ─── Query Keys ───
export const zoneProductsKeys = {
    all: (zoneId: string) => ['zone-products', zoneId] as const,
};

// ─── Fetch functions ───
async function fetchProducts(zoneId: string): Promise<ZoneProduct[]> {
    const { data, error } = await supabase
        .from('zone_products')
        .select('*')
        .eq('zone_id', zoneId)
        .order('name');
    if (error) throw error;
    return (data || []) as ZoneProduct[];
}

// ─── Hook ───
export function useZoneProducts(zoneId: string | null) {
    const queryClient = useQueryClient();
    const safeZoneId = zoneId || '';

    const { data: products = [], isLoading: loading } = useQuery({
        queryKey: zoneProductsKeys.all(safeZoneId),
        queryFn: () => fetchProducts(safeZoneId),
        enabled: !!zoneId,
        staleTime: 60_000,
    });

    const invalidateProducts = () => {
        queryClient.invalidateQueries({ queryKey: zoneProductsKeys.all(safeZoneId) });
    };

    const createProduct = useMutation({
        mutationFn: async (product: Partial<ZoneProduct>) => {
            if (!zoneId) throw new Error('No zone selected');
            const { data, error } = await (supabase as any)
                .from('zone_products')
                .insert({ ...product, zone_id: zoneId })
                .select()
                .single();
            if (error) throw error;
            return data as ZoneProduct;
        },
        onSuccess: invalidateProducts,
    });

    const updateProduct = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<ZoneProduct> }) => {
            const { error } = await supabase
                .from('zone_products')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: invalidateProducts,
    });

    const deleteProduct = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('zone_products')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: invalidateProducts,
    });

    return {
        products,
        loading,
        createProduct: (p: Partial<ZoneProduct>) => createProduct.mutateAsync(p),
        updateProduct: (id: string, updates: Partial<ZoneProduct>) => updateProduct.mutateAsync({ id, updates }),
        deleteProduct: (id: string) => deleteProduct.mutateAsync(id),
    };
}
