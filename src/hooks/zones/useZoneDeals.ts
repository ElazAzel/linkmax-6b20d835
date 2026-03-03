/**
 * Hook: Manage deals and stages for a zone (React Query)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import type { ZoneDeal, ZoneDealStage, ZoneDealActivity } from '@/types/zones';

// ─── Query Keys ───
export const zoneDealsKeys = {
  stages: (zoneId: string) => ['zone-deal-stages', zoneId] as const,
  all: (zoneId: string) => ['zone-deals', zoneId] as const,
  activities: (zoneId: string, dealId: string) => ['zone-deal-activities', zoneId, dealId] as const,
};

// ─── Fetch functions ───
async function fetchStages(zoneId: string): Promise<ZoneDealStage[]> {
  const { data, error } = await supabase
    .from('zone_deal_stages')
    .select('*')
    .eq('zone_id', zoneId)
    .order('order_index');
  if (error) throw error;
  return (data || []) as ZoneDealStage[];
}

async function fetchDeals(zoneId: string): Promise<ZoneDeal[]> {
  const { data, error } = await supabase
    .from('zone_deals')
    .select('*, zone_contacts(*), zone_deal_stages(*)')
    .eq('zone_id', zoneId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: Record<string, unknown>) => ({
    ...d,
    contact: d.zone_contacts || undefined,
    stage: d.zone_deal_stages || undefined,
  })) as ZoneDeal[];
}

// ─── Hooks ───
export function useZoneDeals(zoneId: string | null) {
  const queryClient = useQueryClient();
  const safeZoneId = zoneId || '';

  const { data: stages = [] } = useQuery({
    queryKey: zoneDealsKeys.stages(safeZoneId),
    queryFn: () => fetchStages(safeZoneId),
    enabled: !!zoneId,
    staleTime: 60_000,
  });

  const { data: deals = [], isLoading: loading } = useQuery({
    queryKey: zoneDealsKeys.all(safeZoneId),
    queryFn: () => fetchDeals(safeZoneId),
    enabled: !!zoneId,
    staleTime: 15_000,
  });

  const invalidateDeals = () => {
    queryClient.invalidateQueries({ queryKey: zoneDealsKeys.all(safeZoneId) });
  };

  const createDealMutation = useMutation({
    mutationFn: async (deal: Partial<ZoneDeal>) => {
      if (!zoneId) throw new Error('No zone selected');
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from('zone_deals')
        .insert({ ...deal, zone_id: zoneId, assigned_to: userId })
        .select()
        .single();
      if (error) throw error;
      return data as ZoneDeal;
    },
    onSuccess: invalidateDeals,
  });

  const updateDealMutation = useMutation({
    mutationFn: async ({ dealId, updates }: { dealId: string; updates: Partial<ZoneDeal> }) => {
      const { error } = await supabase
        .from('zone_deals')
        .update(updates)
        .eq('id', dealId);
      if (error) throw error;
    },
    onSuccess: invalidateDeals,
  });

  const moveDealToStageMutation = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const { error } = await supabase
        .from('zone_deals')
        .update({ stage_id: stageId })
        .eq('id', dealId);
      if (error) throw error;
      // Fire automations (non-blocking)
      supabase.functions.invoke('run-zone-automations', {
        body: { zone_id: zoneId, trigger_type: 'deal_stage_change', deal_id: dealId, stage_id: stageId },
      }).catch(() => { });
    },
    onSuccess: invalidateDeals,
  });

  const addActivityMutation = useMutation({
    mutationFn: async ({ dealId, type, summary }: { dealId: string; type: string; summary: string }) => {
      if (!zoneId) return;
      const { error } = await supabase
        .from('zone_deal_activities')
        .insert({
          deal_id: dealId,
          zone_id: zoneId,
          type,
          summary,
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
        });
      if (error) throw error;
    },
  });

  // Backward-compatible API
  const createDeal = async (deal: Partial<ZoneDeal>) => createDealMutation.mutateAsync(deal);
  const updateDeal = async (dealId: string, updates: Partial<ZoneDeal>) => updateDealMutation.mutateAsync({ dealId, updates });
  const moveDealToStage = async (dealId: string, stageId: string) => moveDealToStageMutation.mutateAsync({ dealId, stageId });
  const addActivity = async (dealId: string, type: string, summary: string) => addActivityMutation.mutateAsync({ dealId, type, summary });

  return {
    deals,
    stages,
    loading,
    createDeal,
    updateDeal,
    moveDealToStage,
    addActivity,
    refetch: invalidateDeals,
    refetchStages: () => queryClient.invalidateQueries({ queryKey: zoneDealsKeys.stages(safeZoneId) }),
  };
}
