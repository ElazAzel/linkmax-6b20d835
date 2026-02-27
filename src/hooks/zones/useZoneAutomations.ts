/**
 * Hook: Manage automations for a zone
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';

export interface ZoneAutomation {
  id: string;
  zone_id: string;
  trigger_type: string;
  action_type: string;
  config: Record<string, any>;
  is_active: boolean;
  name: string;
  created_at: string;
  updated_at: string;
}

export function useZoneAutomations(zoneId: string | null) {
  const [automations, setAutomations] = useState<ZoneAutomation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!zoneId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('zone_automations')
        .select('*')
        .eq('zone_id', zoneId)
        .order('created_at', { ascending: false });
      setAutomations((data as ZoneAutomation[]) || []);
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = useCallback(async (automation: Partial<ZoneAutomation>) => {
    if (!zoneId) throw new Error('No zone');
    const { error } = await supabase
      .from('zone_automations')
      .insert({ ...automation, zone_id: zoneId } as any);
    if (error) throw error;
    await fetch();
  }, [zoneId, fetch]);

  const update = useCallback(async (id: string, updates: Partial<ZoneAutomation>) => {
    const { error } = await supabase
      .from('zone_automations')
      .update(updates as any)
      .eq('id', id);
    if (error) throw error;
    await fetch();
  }, [fetch]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('zone_automations')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetch();
  }, [fetch]);

  const toggle = useCallback(async (id: string, active: boolean) => {
    await update(id, { is_active: active });
  }, [update]);

  return { automations, loading, create, update, remove, toggle, refetch: fetch };
}
