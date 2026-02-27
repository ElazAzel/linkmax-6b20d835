/**
 * Hook: Manage contacts for a zone
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import type { ZoneContact } from '@/types/zones';

export function useZoneContacts(zoneId: string | null) {
  const [contacts, setContacts] = useState<ZoneContact[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContacts = useCallback(async () => {
    if (!zoneId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('zone_contacts')
        .select('*')
        .eq('zone_id', zoneId)
        .order('created_at', { ascending: false });
      setContacts((data as ZoneContact[]) || []);
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const createContact = useCallback(async (contact: Partial<ZoneContact>) => {
    if (!zoneId) throw new Error('No zone selected');
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('zone_contacts')
      .insert({ ...contact, zone_id: zoneId, owner_user_id: userId } as any)
      .select()
      .single();
    if (error) throw error;
    await fetchContacts();
    return data;
  }, [zoneId, fetchContacts]);

  const updateContact = useCallback(async (id: string, updates: Partial<ZoneContact>) => {
    const { error } = await supabase
      .from('zone_contacts')
      .update(updates as any)
      .eq('id', id);
    if (error) throw error;
    await fetchContacts();
  }, [fetchContacts]);

  const deleteContact = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('zone_contacts')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchContacts();
  }, [fetchContacts]);

  return { contacts, loading, createContact, updateContact, deleteContact, refetch: fetchContacts };
}
