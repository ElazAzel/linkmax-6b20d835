/**
 * Hook: Manage deals and stages for a zone
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import type { ZoneDeal, ZoneDealStage, ZoneDealActivity } from '@/types/zones';

export function useZoneDeals(zoneId: string | null) {
  const [deals, setDeals] = useState<ZoneDeal[]>([]);
  const [stages, setStages] = useState<ZoneDealStage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStages = useCallback(async () => {
    if (!zoneId) return;
    const { data } = await supabase
      .from('zone_deal_stages')
      .select('*')
      .eq('zone_id', zoneId)
      .order('order_index');
    setStages((data as ZoneDealStage[]) || []);
  }, [zoneId]);

  const fetchDeals = useCallback(async () => {
    if (!zoneId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('zone_deals')
        .select('*, zone_contacts(*), zone_deal_stages(*)')
        .eq('zone_id', zoneId)
        .order('created_at', { ascending: false });

      const mapped = (data || []).map((d: any) => ({
        ...d,
        contact: d.zone_contacts || undefined,
        stage: d.zone_deal_stages || undefined,
      }));
      setDeals(mapped as ZoneDeal[]);
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  useEffect(() => { fetchStages(); fetchDeals(); }, [fetchStages, fetchDeals]);

  const createDeal = useCallback(async (deal: Partial<ZoneDeal>) => {
    if (!zoneId) throw new Error('No zone selected');
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('zone_deals')
      .insert({ ...deal, zone_id: zoneId, assigned_to: userId } as any)
      .select()
      .single();
    if (error) throw error;
    await fetchDeals();
    return data;
  }, [zoneId, fetchDeals]);

  const updateDeal = useCallback(async (dealId: string, updates: Partial<ZoneDeal>) => {
    const { error } = await supabase
      .from('zone_deals')
      .update(updates as any)
      .eq('id', dealId);
    if (error) throw error;
    await fetchDeals();
  }, [fetchDeals]);

  const moveDealToStage = useCallback(async (dealId: string, stageId: string) => {
    await updateDeal(dealId, { stage_id: stageId } as any);
  }, [updateDeal]);

  const addActivity = useCallback(async (dealId: string, type: string, summary: string) => {
    if (!zoneId) return;
    const { error } = await supabase
      .from('zone_deal_activities')
      .insert({
        deal_id: dealId,
        zone_id: zoneId,
        type,
        summary,
        created_by: (await supabase.auth.getUser()).data.user?.id || '',
      } as any);
    if (error) throw error;
  }, [zoneId]);

  return {
    deals,
    stages,
    loading,
    createDeal,
    updateDeal,
    moveDealToStage,
    addActivity,
    refetch: fetchDeals,
    refetchStages: fetchStages,
  };
}
