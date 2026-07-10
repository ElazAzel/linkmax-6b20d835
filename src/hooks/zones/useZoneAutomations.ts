/**
 * Hook: Manage automations for a zone (React Query)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';

export interface ZoneAutomation {
  id: string;
  zone_id: string;
  trigger_type: string;
  action_type: string;
  config?: Record<string, unknown>;
  is_active: boolean;
  name?: string;
  created_at: string;
  updated_at: string;
}

// Columns readable by authenticated members (see migration 20260619052025).
// `name`, `config`, `template_message` are admin-only and must be fetched via a
// dedicated admin RPC/view — not selected here.
const AUTOMATION_MEMBER_COLUMNS =
  'id, zone_id, trigger_type, action_type, is_active, created_at, updated_at';

// ─── Query Keys ───
export const zoneAutomationsKeys = {
  all: (zoneId: string) => ['zone-automations', zoneId] as const,
};

// ─── Fetch ───
async function fetchAutomations(zoneId: string): Promise<ZoneAutomation[]> {
  const { data, error } = await supabase
    .from('zone_automations')
    .select(AUTOMATION_MEMBER_COLUMNS)
    .eq('zone_id', zoneId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as ZoneAutomation[];
}

// ─── Hook ───
export function useZoneAutomations(zoneId: string | null) {
  const queryClient = useQueryClient();
  const safeZoneId = zoneId || '';

  const { data: automations = [], isLoading: loading } = useQuery({
    queryKey: zoneAutomationsKeys.all(safeZoneId),
    queryFn: () => fetchAutomations(safeZoneId),
    enabled: !!zoneId,
    staleTime: 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: zoneAutomationsKeys.all(safeZoneId) });
  };

  const createMutation = useMutation({
    mutationFn: async (automation: Partial<ZoneAutomation>) => {
      if (!zoneId) throw new Error('No zone');
      const { error } = await (supabase as any)
        .from('zone_automations')
        .insert({ ...automation, zone_id: zoneId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ZoneAutomation> }) => {
      const { error } = await supabase
        .from('zone_automations')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('zone_automations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const create = async (automation: Partial<ZoneAutomation>) => createMutation.mutateAsync(automation);
  const update = async (id: string, updates: Partial<ZoneAutomation>) => updateMutation.mutateAsync({ id, updates });
  const remove = async (id: string) => removeMutation.mutateAsync(id);
  const toggle = async (id: string, active: boolean) => updateMutation.mutateAsync({ id, updates: { is_active: active } });

  return { automations, loading, create, update, remove, toggle, refetch: invalidate };
}
