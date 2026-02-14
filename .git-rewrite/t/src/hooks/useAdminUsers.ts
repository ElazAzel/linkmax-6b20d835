import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface AdminUserData {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  is_premium: boolean;
  trial_ends_at: string | null;
  created_at: string;
  current_streak: number;
}

async function fetchUsers(): Promise<AdminUserData[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, is_premium, trial_ends_at, created_at, current_streak')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data || []).map(u => ({
    ...u,
    email: 'hidden@example.com'
  })) as AdminUserData[];
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useTogglePremium() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ userId, currentStatus }: { userId: string; currentStatus: boolean }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_premium: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
      return !currentStatus;
    },
    onSuccess: (newStatus) => {
      toast({
        title: t('admin.statusUpdated'),
        description: newStatus ? t('admin.premiumEnabled') : t('admin.premiumDisabled'),
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-platform-stats'] });
    },
    onError: () => {
      toast({
        title: t('admin.error'),
        description: t('admin.updateFailed'),
        variant: 'destructive',
      });
    },
  });
}

export function useExtendTrial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      const newTrialEnd = new Date();
      newTrialEnd.setDate(newTrialEnd.getDate() + days);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ trial_ends_at: newTrialEnd.toISOString() })
        .eq('id', userId);
      
      if (error) throw error;
      return days;
    },
    onSuccess: (days) => {
      toast({
        title: t('admin.trialExtended'),
        description: `+${days} ${t('admin.days')}`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast({
        title: t('admin.error'),
        description: t('admin.extendFailed'),
        variant: 'destructive',
      });
    },
  });
}
