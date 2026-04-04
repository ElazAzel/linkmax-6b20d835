import { useState, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface ZoneResource {
  id: string;
  zone_id: string;
  name: string;
  description: string | null;
  type: 'room' | 'equipment' | 'other';
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useZoneResources(zoneId: string) {
  const [resources, setResources] = useState<ZoneResource[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const fetchResources = useCallback(async () => {
    if (!zoneId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('zone_resources' as any)
        .select('*')
        .eq('zone_id', zoneId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources((data as any) || []);
    } catch (err: any) {
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  const upsertResource = async (resource: Partial<ZoneResource>) => {
    setLoading(true);
    try {
      const isNew = !resource.id;
      const payload = {
        ...resource,
        zone_id: zoneId,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (isNew) {
        ({ error } = await supabase
          .from('zone_resources' as any)
          .insert([payload]));
      } else {
        ({ error } = await supabase
          .from('zone_resources' as any)
          .update(payload)
          .eq('id', resource.id));
      }

      if (error) throw error;
      
      toast.success(t('common.saved', 'Saved'));
      await fetchResources();
      return true;
    } catch (err: any) {
      console.error('Error saving resource:', err);
      toast.error(err.message || t('common.error', 'An error occurred'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteResource = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('zone_resources' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success(t('common.deleted', 'Deleted'));
      setResources(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error deleting resource:', err);
      toast.error(err.message || t('common.error', 'An error occurred'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    resources,
    loading,
    fetchResources,
    upsertResource,
    deleteResource
  };
}
