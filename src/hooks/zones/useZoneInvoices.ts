/**
 * Hook: Manage invoices for a zone (React Query)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import type { ZoneInvoice } from '@/types/zones';

// ─── Query Keys ───
export const zoneInvoicesKeys = {
  all: (zoneId: string) => ['zone-invoices', zoneId] as const,
};

// ─── Fetch ───
async function fetchInvoices(zoneId: string): Promise<ZoneInvoice[]> {
  const { data, error } = await supabase
    .from('zone_invoices')
    .select('*')
    .eq('zone_id', zoneId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as ZoneInvoice[];
}

// ─── Hook ───
export function useZoneInvoices(zoneId: string | null) {
  const queryClient = useQueryClient();
  const safeZoneId = zoneId || '';

  const { data: invoices = [], isLoading: loading } = useQuery({
    queryKey: zoneInvoicesKeys.all(safeZoneId),
    queryFn: () => fetchInvoices(safeZoneId),
    enabled: !!zoneId,
    staleTime: 30_000,
  });

  const invalidateInvoices = () => {
    queryClient.invalidateQueries({ queryKey: zoneInvoicesKeys.all(safeZoneId) });
  };

  const createMutation = useMutation({
    mutationFn: async (invoice: Partial<ZoneInvoice>) => {
      if (!zoneId) throw new Error('No zone selected');
      const { data, error } = await supabase
        .from('zone_invoices')
        .insert({ ...invoice, zone_id: zoneId })
        .select()
        .single();
      if (error) throw error;
      return data as ZoneInvoice;
    },
    onSuccess: invalidateInvoices,
  });

  const create = async (invoice: Partial<ZoneInvoice>) => createMutation.mutateAsync(invoice);

  return { invoices, loading, create, refetch: invalidateInvoices };
}
