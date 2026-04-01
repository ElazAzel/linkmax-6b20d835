import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import type { ZoneInvoice, ZoneInvoiceItem } from '@/types/zones';

export type { ZoneInvoice, ZoneInvoiceItem };

// ─── Query Keys ───
export const zoneInvoicesKeys = {
  all: (zoneId: string) => ['zone-invoices', zoneId] as const,
  items: (zoneId: string, invoiceId: string) => ['zone-invoice-items', zoneId, invoiceId] as const,
};

// ─── Fetch ───
async function fetchInvoices(zoneId: string): Promise<ZoneInvoice[]> {
  const { data, error } = await supabase
    .from('zone_invoices')
    .select('*, items:zone_invoice_items(*)')
    .eq('zone_id', zoneId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as ZoneInvoice[];
}

async function fetchInvoiceItems(zoneId: string, invoiceId: string): Promise<ZoneInvoiceItem[]> {
  const { data, error } = await supabase
    .from('zone_invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at');
  if (error) throw error;
  return (data || []) as unknown as ZoneInvoiceItem[];
}

// ─── Hook: All Zone Invoices ───
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
      return data as unknown as ZoneInvoice;
    },
    onSuccess: invalidateInvoices,
  });

  const createWithItemsMutation = useMutation({
    mutationFn: async ({ invoice, items }: { invoice: Partial<ZoneInvoice>; items: Partial<ZoneInvoiceItem>[] }) => {
      if (!zoneId) throw new Error('No zone selected');

      const { data: invData, error: invError } = await supabase
        .from('zone_invoices')
        .insert({ ...invoice, zone_id: zoneId })
        .select()
        .single();
      if (invError) throw invError;

      if (items.length > 0) {
        const { error: itemsError } = await (supabase
          .from('zone_invoice_items' as any)
          .insert(items.map(item => ({
            ...item,
            invoice_id: invData.id,
            zone_id: zoneId,
          }))) as any);
        if (itemsError) throw itemsError;
      }

      return invData as unknown as ZoneInvoice;
    },
    onSuccess: invalidateInvoices,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: ZoneInvoice['status'] }) => {
      const { error } = await supabase
        .from('zone_invoices')
        .update({ status } as any)
        .eq('id', invoiceId);
      if (error) throw error;
    },
    onSuccess: invalidateInvoices,
  });

  return {
    invoices,
    loading,
    create: (inv: Partial<ZoneInvoice>) => createMutation.mutateAsync(inv),
    createWithItems: (invoice: Partial<ZoneInvoice>, items: Partial<ZoneInvoiceItem>[]) =>
      createWithItemsMutation.mutateAsync({ invoice, items }),
    updateStatus: (invoiceId: string, status: ZoneInvoice['status']) =>
      updateStatusMutation.mutateAsync({ invoiceId, status }),
    refetch: invalidateInvoices
  };
}

// ─── Hook: Invoice Items ───
export function useZoneInvoiceItems(zoneId: string | null, invoiceId: string | null) {
  const safeZoneId = zoneId || '';
  const safeInvoiceId = invoiceId || '';

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: zoneInvoicesKeys.items(safeZoneId, safeInvoiceId),
    queryFn: () => fetchInvoiceItems(safeZoneId, safeInvoiceId),
    enabled: !!zoneId && !!invoiceId,
    staleTime: 60_000,
  });

  return { items, loading };
}
