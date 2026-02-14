import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

interface UseDashboardAuthGuardOptions {
  isLoading?: boolean;
  redirectTo?: string;
}

/**
 * Hook to handle authentication guard for dashboard
 * Redirects unauthenticated users to the auth page
 */
export function useDashboardAuthGuard({
  isLoading = false,
  redirectTo = '/auth',
}: UseDashboardAuthGuardOptions = {}) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Don't redirect while still loading
    if (authLoading || isLoading) return;

    // Redirect if not authenticated
    if (!user) {
      navigate(redirectTo);
    }
  }, [user, authLoading, isLoading, navigate, redirectTo]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading: authLoading || isLoading,
  };
}
