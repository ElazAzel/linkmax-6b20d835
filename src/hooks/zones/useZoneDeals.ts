/**
 * Hook: Manage deals and stages for a zone (React Query)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import type { ZoneDeal, ZoneDealStage, ZoneDealActivity, ZonePipeline } from '@/types/zones';
import type { Json } from '@/platform/supabase/types';

// ─── Query Keys ───
export const zoneDealsKeys = {
  stages: (zoneId: string, pipelineId?: string | null) => ['zone-deal-stages', zoneId, pipelineId || 'all'] as const,
  all: (zoneId: string, pipelineId?: string | null) => ['zone-deals', zoneId, pipelineId || 'all'] as const,
  zoneActivities: (zoneId: string) => ['zone-activities', zoneId] as const,
  activities: (zoneId: string, dealId: string) => ['zone-deal-activities', zoneId, dealId] as const,
  dealProducts: (zoneId: string, dealId: string) => ['zone-deal-products', zoneId, dealId] as const,
  products: (zoneId: string) => ['zone-products', zoneId] as const,
  pipelines: (zoneId: string) => ['zone-pipelines', zoneId] as const,
  comments: (zoneId: string, dealId: string) => ['zone-deal-comments', zoneId, dealId] as const,
};

// ─── Fetch functions ───
async function fetchStages(zoneId: string, pipelineId?: string | null): Promise<ZoneDealStage[]> {
  let query = supabase
    .from('zone_deal_stages')
    .select('*')
    .eq('zone_id', zoneId);
    
  if (pipelineId) {
    query.eq('pipeline_id', pipelineId);
  }
    
  const { data, error } = await query.order('order_index');
  if (error) throw error;
  return (data || []) as unknown as ZoneDealStage[];
}

async function fetchPipelines(zoneId: string): Promise<ZonePipeline[]> {
  const { data, error } = await supabase
    .from('zone_pipelines')
    .select('*')
    .eq('zone_id', zoneId)
    .order('order_index');
  if (error) throw error;
  return (data || []) as ZonePipeline[];
}

async function fetchDeals(zoneId: string, pipelineId?: string | null): Promise<ZoneDeal[]> {
  let query = supabase
    .from('zone_deals')
    .select('*, zone_contacts(*), zone_deal_stages(*)');
    
  if (pipelineId) query = query.eq('pipeline_id', pipelineId);

  const { data, error } = await query
    .eq('zone_id', zoneId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: Record<string, any>) => ({
    ...d,
    contact: d.zone_contacts || undefined,
    stage: d.zone_deal_stages || undefined,
  })) as ZoneDeal[];
}

async function fetchZoneActivities(zoneId: string): Promise<ZoneDealActivity[]> {
  const { data, error } = await supabase
    .from('zone_deal_activities')
    .select('*')
    .eq('zone_id', zoneId)
    .order('happened_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []) as unknown as ZoneDealActivity[];
}

async function fetchActivities(zoneId: string, dealId: string): Promise<ZoneDealActivity[]> {
  const { data, error } = await supabase
    .from('zone_deal_activities')
    .select('*')
    .eq('deal_id', dealId)
    .order('happened_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as ZoneDealActivity[];
}

async function fetchDealProducts(zoneId: string, dealId: string) {
  const { data, error } = await (supabase
    .from('zone_deal_products' as any)
    .select('*, zone_products(*)')
    .eq('deal_id', dealId) as any);
  if (error) throw error;
  return (data || []) as any[];
}

async function fetchDealComments(zoneId: string, dealId: string) {
  const { data, error } = await (supabase
    .from('zone_deal_comments' as any)
    .select('*, user:user_id(email, raw_user_meta_data)')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true }) as any);
  if (error) throw error;
  return data || [];
}

// ─── Hooks ───
export function useZoneDeals(zoneId: string | null, pipelineId?: string | null) {
  const queryClient = useQueryClient();
  const safeZoneId = zoneId || '';

  const { data: pipelines = [] } = useQuery({
    queryKey: zoneDealsKeys.pipelines(safeZoneId),
    queryFn: () => fetchPipelines(safeZoneId),
    enabled: !!zoneId,
    staleTime: 60_000,
  });

  const { data: stages = [] } = useQuery({
    queryKey: zoneDealsKeys.stages(safeZoneId, pipelineId),
    queryFn: () => fetchStages(safeZoneId, pipelineId),
    enabled: !!zoneId,
    staleTime: 60_000,
  });

  const { data: deals = [], isLoading: loading } = useQuery({
    queryKey: zoneDealsKeys.all(safeZoneId, pipelineId),
    queryFn: () => fetchDeals(safeZoneId, pipelineId),
    enabled: !!zoneId,
    staleTime: 15_000,
  });

  const { data: activities = [] } = useQuery({
    queryKey: zoneDealsKeys.zoneActivities(safeZoneId),
    queryFn: () => fetchZoneActivities(safeZoneId),
    enabled: !!zoneId,
    staleTime: 10_000,
  });

  const invalidateDeals = () => {
    queryClient.invalidateQueries({ queryKey: zoneDealsKeys.all(safeZoneId, pipelineId) });
    queryClient.invalidateQueries({ queryKey: zoneDealsKeys.all(safeZoneId, 'all') });
    queryClient.invalidateQueries({ queryKey: zoneDealsKeys.zoneActivities(safeZoneId) });
  };

  const createDealMutation = useMutation({
    mutationFn: async (deal: Partial<ZoneDeal>) => {
      if (!zoneId) throw new Error('No zone selected');
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from('zone_deals')
        .insert({ ...deal, zone_id: zoneId, assigned_to: userId } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ZoneDeal;
    },
    onSuccess: invalidateDeals,
  });

  const createPipelineMutation = useMutation({
    mutationFn: async (pipeline: Partial<ZonePipeline>) => {
      const { data, error } = await (supabase
        .from('zone_pipelines' as any)
        .insert({ ...pipeline, zone_id: zoneId } as any)
        .select()
        .single() as any);
      if (error) throw error;
      return data as ZonePipeline;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zoneDealsKeys.pipelines(safeZoneId) }),
  });

  const updatePipelineMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ZonePipeline> }) => {
      const { error } = await (supabase.from('zone_pipelines' as any).update(updates as any).eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zoneDealsKeys.pipelines(safeZoneId) }),
  });

  const deletePipelineMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('zone_pipelines' as any).delete().eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneDealsKeys.pipelines(safeZoneId) });
      invalidateDeals();
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async ({ dealId, updates }: { dealId: string; updates: Partial<ZoneDeal> }) => {
      const { error } = await supabase
        .from('zone_deals')
        .update(updates as any)
        .eq('id', dealId);
      if (error) throw error;
    },
    onSuccess: (data, variables) => {
      invalidateDeals();
      queryClient.invalidateQueries({ queryKey: zoneDealsKeys.activities(safeZoneId, variables.dealId) });
    },
  });

  const moveDealToStageMutation = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const { error } = await supabase
        .from('zone_deals')
        .update({ stage_id: stageId })
        .eq('id', dealId);
      if (error) throw error;
      supabase.functions.invoke('run-zone-automations', {
        body: { zone_id: zoneId, trigger_type: 'deal_stage_change', deal_id: dealId, stage_id: stageId },
      }).catch(() => { });
    },
    onSuccess: (data, variables) => {
      invalidateDeals();
      queryClient.invalidateQueries({ queryKey: zoneDealsKeys.activities(safeZoneId, variables.dealId) });
    },
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
        } as any);
      if (error) throw error;
    },
    onSuccess: (data, variables) => {
      invalidateDeals();
      queryClient.invalidateQueries({ queryKey: zoneDealsKeys.activities(safeZoneId, variables.dealId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('zone_deals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateDeals();
    },
  });

  return {
    pipelines,
    deals,
    stages,
    activities,
    loading,
    createDeal: (deal: Partial<ZoneDeal>) => createDealMutation.mutateAsync(deal),
    updateDeal: (dealId: string, updates: Partial<ZoneDeal>) => updateDealMutation.mutateAsync({ dealId, updates }),
    moveDealToStage: (dealId: string, stageId: string) => moveDealToStageMutation.mutateAsync({ dealId, stageId }),
    addActivity: (dealId: string, type: string, summary: string) => addActivityMutation.mutateAsync({ dealId, type, summary }),
    deleteDeal: (id: string) => deleteMutation.mutateAsync(id),
    refetch: invalidateDeals,
    refetchPipelines: () => queryClient.invalidateQueries({ queryKey: zoneDealsKeys.pipelines(safeZoneId) }),
    refetchStages: () => queryClient.invalidateQueries({ queryKey: zoneDealsKeys.stages(safeZoneId, pipelineId) }),
    createPipeline: (pipeline: Partial<ZonePipeline>) => createPipelineMutation.mutateAsync(pipeline),
    updatePipeline: (id: string, updates: Partial<ZonePipeline>) => updatePipelineMutation.mutateAsync({ id, updates }),
    deletePipeline: (id: string) => deletePipelineMutation.mutateAsync(id),
  };
}

export function useZoneDealActivities(zoneId: string | null, dealId: string | null) {
  const safeZoneId = zoneId || '';
  const safeDealId = dealId || '';

  const { data: activities = [], isLoading: loading } = useQuery({
    queryKey: zoneDealsKeys.activities(safeZoneId, safeDealId),
    queryFn: () => fetchActivities(safeZoneId, safeDealId),
    enabled: !!zoneId && !!dealId,
    staleTime: 10_000,
  });

  return { activities, loading };
}

export function useZoneDealProducts(zoneId: string | null, dealId: string | null) {
  const queryClient = useQueryClient();
  const safeZoneId = zoneId || '';
  const safeDealId = dealId || '';

  const { data: dealProducts = [], isLoading: loading } = useQuery({
    queryKey: zoneDealsKeys.dealProducts(safeZoneId, safeDealId),
    queryFn: () => fetchDealProducts(safeZoneId, safeDealId),
    enabled: !!zoneId && !!dealId,
    staleTime: 30_000,
  });

  const addProduct = useMutation({
    mutationFn: async ({ productId, quantity, unitPrice }: { productId: string; quantity: number; unitPrice: number }) => {
      const { error } = await (supabase
        .from('zone_deal_products' as any)
        .insert({
          deal_id: dealId,
          product_id: productId,
          quantity,
          unit_price: unitPrice,
          subtotal: quantity * unitPrice
        }) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneDealsKeys.dealProducts(safeZoneId, safeDealId) });
    },
  });

  const removeProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('zone_deal_products' as any)
        .delete()
        .eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneDealsKeys.dealProducts(safeZoneId, safeDealId) });
    },
  });

  return {
    dealProducts,
    loading,
    addProduct: (p: { productId: string; quantity: number; unitPrice: number }) => addProduct.mutateAsync(p),
    removeProduct: (id: string) => removeProduct.mutateAsync(id)
  };
}

// ─── Hook: Deal Comments ───
export function useZoneDealComments(zoneId: string | null, dealId: string | null) {
  const queryClient = useQueryClient();
  const safeZoneId = zoneId || '';
  const safeDealId = dealId || '';

  const { data: comments = [], isLoading: loading } = useQuery({
    queryKey: zoneDealsKeys.comments(safeZoneId, safeDealId),
    queryFn: () => fetchDealComments(safeZoneId, safeDealId),
    enabled: !!zoneId && !!dealId,
    staleTime: 30_000,
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ content, mentionedUserIds }: { content: string; mentionedUserIds?: string[] }) => {
      if (!zoneId || !dealId) throw new Error('No zone or deal selected');
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await (supabase
        .from('zone_deal_comments' as any)
        .insert({
          zone_id: zoneId,
          deal_id: dealId,
          user_id: userId,
          content,
          mentioned_user_ids: mentionedUserIds || [],
        }) as any);
      if (error) throw error;
      
      // Send Telegram notification to mentioned users
      if (mentionedUserIds && mentionedUserIds.length > 0) {
        supabase.functions.invoke('send-zone-notification', {
          body: {
            type: 'deal_comment_mention',
            zone_id: zoneId,
            data: {
              deal_id: dealId,
              mentioned_user_ids: mentionedUserIds,
              comment_preview: content.slice(0, 100),
              commenter_name: 'User',
            },
          },
        }).catch(() => {});
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zoneDealsKeys.comments(safeZoneId, safeDealId) }),
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await (supabase
        .from('zone_deal_comments' as any)
        .update({ content })
        .eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zoneDealsKeys.comments(safeZoneId, safeDealId) }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('zone_deal_comments' as any)
        .delete()
        .eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zoneDealsKeys.comments(safeZoneId, safeDealId) }),
  });

  return {
    comments: comments as any[],
    loading,
    addComment: async (content: string, mentionedUserIds?: string[]) => addCommentMutation.mutateAsync({ content, mentionedUserIds }),
    updateComment: async (id: string, content: string) => updateCommentMutation.mutateAsync({ id, content }),
    deleteComment: async (id: string) => deleteCommentMutation.mutateAsync(id),
  };
}
