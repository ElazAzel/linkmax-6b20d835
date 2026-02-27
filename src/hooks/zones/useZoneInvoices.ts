/**
 * Hook: Manage invoices for a zone
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import type { ZoneInvoice } from '@/types/zones';

export function useZoneInvoices(zoneId: string | null) {
  const [invoices, setInvoices] = useState<ZoneInvoice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!zoneId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('zone_invoices')
        .select('*')
        .eq('zone_id', zoneId)
        .order('created_at', { ascending: false });
      setInvoices((data as ZoneInvoice[]) || []);
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = useCallback(async (invoice: Partial<ZoneInvoice>) => {
    if (!zoneId) throw new Error('No zone');
    const { error } = await supabase
      .from('zone_invoices')
      .insert({ ...invoice, zone_id: zoneId } as any);
    if (error) throw error;
    await fetch();
  }, [zoneId, fetch]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    const { error } = await supabase
      .from('zone_invoices')
      .update({ status } as any)
      .eq('id', id);
    if (error) throw error;
    await fetch();
  }, [fetch]);

  return { invoices, loading, create, updateStatus, refetch: fetch };
}
