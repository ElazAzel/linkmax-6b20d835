/**
 * Hook: Zone notifications (React Query)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';

export interface ZoneNotification {
  id: string;
  zone_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

const keys = {
  all: (zoneId: string) => ['zone-notifications', zoneId] as const,
  unread: (zoneId: string) => ['zone-notifications', zoneId, 'unread'] as const,
};

export function useZoneNotifications(zoneId: string | null) {
  const queryClient = useQueryClient();
  const safeId = zoneId || '';

  const { data: notifications = [], isLoading: loading } = useQuery({
    queryKey: keys.all(safeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zone_notifications')
        .select('*')
        .eq('zone_id', safeId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as ZoneNotification[];
    },
    enabled: !!zoneId,
    staleTime: 15_000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('zone_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all(safeId) });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!zoneId) return;
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase
        .from('zone_notifications')
        .update({ is_read: true })
        .eq('zone_id', zoneId)
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all(safeId) });
    },
  });

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead: (id: string) => markAsRead.mutateAsync(id),
    markAllRead: () => markAllRead.mutateAsync(),
  };
}
