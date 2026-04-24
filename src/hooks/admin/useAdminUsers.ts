import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import { useToast } from '@/hooks/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { normalizeDatabasePremiumTier, type DatabasePremiumTier } from '@/domain/billing/tiers';

export type AdminPremiumTier = DatabasePremiumTier;

export interface AdminUserData {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  is_premium: boolean;
  premium_tier: AdminPremiumTier | null;
  premium_expires_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
  current_streak: number;
  is_verified: boolean | null;
}

async function fetchUsers(): Promise<AdminUserData[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, is_premium, premium_tier, premium_expires_at, trial_ends_at, created_at, current_streak, is_verified')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data || []).map(u => ({
    ...u,
    premium_tier: normalizeDatabasePremiumTier(u.premium_tier),
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

export function useSetUserTier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ userId, tier }: { userId: string; tier: AdminPremiumTier }) => {
      const updates: Record<string, unknown> = {
        premium_tier: tier,
        is_premium: tier === 'pro' || tier === 'business',
      };

      // Free and Starter are not paid subscriptions, so expiry/trial state should not linger.
      if (tier === 'free' || tier === 'starter') {
        updates.premium_expires_at = null;
        updates.trial_ends_at = null;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      return tier;
    },
    onSuccess: (tier) => {
      const tierNames: Record<AdminPremiumTier, string> = {
        free: 'Free',
        starter: 'Starter',
        pro: 'Pro',
        business: 'Business',
      };
      toast({
        title: t('admin.statusUpdated') || 'Статус обновлён',
        description: `Тариф: ${tierNames[tier]}`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-platform-stats'] });
    },
    onError: () => {
      toast({
        title: t('admin.error') || 'Ошибка',
        description: t('admin.updateFailed') || 'Не удалось обновить',
        variant: 'destructive',
      });
    },
  });
}

export function useSetPremiumExpiry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const { error } = await supabase
        .from('user_profiles')
        .update({ premium_expires_at: expiresAt.toISOString() })
        .eq('id', userId);

      if (error) throw error;
      return days;
    },
    onSuccess: (days) => {
      toast({
        title: 'Срок подписки установлен',
        description: `+${days} дней`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast({
        title: t('admin.error') || 'Ошибка',
        description: t('admin.updateFailed') || 'Не удалось обновить',
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
        title: t('admin.trialExtended') || 'Триал продлён',
        description: `+${days} ${t('admin.days') || 'дней'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast({
        title: t('admin.error') || 'Ошибка',
        description: t('admin.extendFailed') || 'Не удалось продлить',
        variant: 'destructive',
      });
    },
  });
}

export function useToggleVerification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, currentStatus }: { userId: string; currentStatus: boolean }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      return !currentStatus;
    },
    onSuccess: (newStatus) => {
      toast({
        title: 'Верификация обновлена',
        description: newStatus ? 'Пользователь верифицирован' : 'Верификация снята',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast({ title: 'Ошибка', description: 'Не удалось обновить верификацию', variant: 'destructive' });
    },
  });
}

// Keep legacy export for backward compat
export function useTogglePremium() {
  return useSetUserTier();
}
