import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/user/useAuth';
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAdminRole() {
      if (authLoading) {
        setLoading(true);
        return;
      }

      if (!user) {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setIsAdmin(false);

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          logger.error('Error checking admin role:', error, { context: 'useAdminAuth' });
          if (!cancelled) setIsAdmin(false);
        } else {
          if (!cancelled) setIsAdmin(!!data);
        }
      } catch (err) {
        logger.error('Error checking admin role:', err, { context: 'useAdminAuth' });
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void checkAdminRole();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  return { isAdmin, loading: loading || authLoading, user };
}
