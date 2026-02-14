import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { supabase } from '@/platform/supabase/client';

interface UseDashboardAuthGuardOptions {
  isLoading?: boolean;
  redirectTo?: string;
}

/**
 * Hook to handle authentication guard for dashboard
 * Redirects unauthenticated users to the auth page
 * Also handles saving pending Telegram chat ID after signup
 */
export function useDashboardAuthGuard({
  isLoading = false,
  redirectTo = '/auth',
}: UseDashboardAuthGuardOptions = {}) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Handle redirect for unauthenticated users
  useEffect(() => {
    // Don't redirect while still loading
    if (authLoading || isLoading) return;

    // Redirect if not authenticated
    if (!user) {
      navigate(redirectTo);
    }
  }, [user, authLoading, isLoading, navigate, redirectTo]);

  // Handle saving pending Telegram chat ID after signup
  useEffect(() => {
    if (!user || authLoading) return;

    const pendingTelegramChatId = localStorage.getItem('pending_telegram_chat_id');
    if (pendingTelegramChatId) {
      // Save to user profile
      supabase
        .from('user_profiles')
        .update({
          telegram_chat_id: pendingTelegramChatId,
          telegram_notifications_enabled: true,
        })
        .eq('id', user.id)
        .then(({ error }) => {
          if (!error) {
            // Clear from localStorage after successful save
            localStorage.removeItem('pending_telegram_chat_id');
            console.log('Telegram chat ID saved to profile');
          } else {
            console.error('Failed to save telegram chat ID:', error);
          }
        });
    }
  }, [user, authLoading]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading: authLoading || isLoading,
  };
}
