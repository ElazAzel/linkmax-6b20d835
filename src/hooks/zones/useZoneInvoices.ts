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
    const { data: inserted, error } = await supabase
      .from('zone_invoices')
      .insert({ ...invoice, zone_id: zoneId, status: 'created' } as any)
      .select()
      .single();
    if (error) throw error;
    const invoiceId = inserted.id;
    try {
      const { data: zone } = await supabase.from('zones').select('owner_user_id').eq('id', zoneId).single();
      const ownerId = zone?.owner_user_id;
      if (ownerId && inserted.amount) {
        const { data: payData } = await supabase.functions.invoke('robokassa', {
          body: {
            type: 'payment',
            userId: ownerId,
            amount: Number(inserted.amount),
            description: inserted.description || `Invoice #${invoiceId.slice(0, 8)}`,
            relatedId: invoiceId,
          },
        });
        if (payData?.url && payData?.invId) {
          await supabase
            .from('zone_invoices')
            .update({ pay_url: payData.url, robokassa_invoice_id: payData.invId } as any)
            .eq('id', invoiceId);
        }
      }
    } catch (_) { /* non-blocking */ }
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
