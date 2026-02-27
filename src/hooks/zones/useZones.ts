/**
 * Hook: Manage zones for the current user
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/user/useAuth';
import type { Zone, ZoneMember, ZoneMemberRole } from '@/types/zones';

export function useZones() {
  const { user } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [currentZoneId, setCurrentZoneId] = useState<string | null>(null);
  const [members, setMembers] = useState<ZoneMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch zones
  const fetchZones = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setZones((data as Zone[]) || []);

      // Auto-select first zone if none selected
      if (!currentZoneId && data && data.length > 0) {
        setCurrentZoneId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching zones:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentZoneId]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  // Current zone
  const currentZone = useMemo(() =>
    zones.find(z => z.id === currentZoneId) || null
    , [zones, currentZoneId]);

  // Fetch members when zone changes (join user_profiles for display info)
  useEffect(() => {
    if (!currentZoneId) { setMembers([]); return; }

    const fetchMembers = async () => {
      const { data } = await supabase
        .from('zone_members')
        .select('*, user_profiles!user_id(display_name, avatar_url, username)')
        .eq('zone_id', currentZoneId);
      const mapped = (data || []).map((m: any) => ({
        ...m,
        display_name: m.user_profiles?.display_name || m.user_profiles?.username || null,
        avatar_url: m.user_profiles?.avatar_url || null,
      }));
      setMembers(mapped as ZoneMember[]);
    };
    fetchMembers();
  }, [currentZoneId]);

  // My role in current zone
  const myRole = useMemo<ZoneMemberRole | null>(() => {
    if (!user?.id || !currentZoneId) return null;
    const m = members.find(m => m.user_id === user.id && m.status === 'active');
    return (m?.role as ZoneMemberRole) || null;
  }, [members, user?.id, currentZoneId]);

  // Is read-only (grace/locked)
  const isReadOnly = useMemo(() => {
    if (!currentZone) return true;
    return ['grace', 'locked'].includes(currentZone.plan_status);
  }, [currentZone]);

  // Create zone
  const createZone = useCallback(async (name: string, slug: string, planCode = 'business_5_m', planCycle = 'monthly') => {
    const { data, error } = await supabase.rpc('create_zone', {
      p_name: name,
      p_slug: slug,
      p_plan_code: planCode,
      p_plan_cycle: planCycle,
    });
    if (error) throw error;
    await fetchZones();
    if (data) setCurrentZoneId(data as string);
    return data;
  }, [fetchZones]);

  return {
    zones,
    currentZone,
    currentZoneId,
    setCurrentZoneId,
    members,
    myRole,
    isReadOnly,
    loading,
    createZone,
    refetch: fetchZones,
  };
}
