import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the number of inbound leads for the current user within the current
 * calendar month. Skips the query when there is no user or premium is not
 * required for the consumer. The `deps` array forces a refetch when the
 * caller's lead list changes.
 */
export function useMonthlyInboundCount(
  userId: string | undefined,
  _enabled: boolean = true,
  deps: ReadonlyArray<unknown> = [],
): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }
    let cancelled = false;
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    (async () => {
      const { count: c, error } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', start.toISOString());
      if (cancelled) return;
      if (error) {
        setCount(0);
        return;
      }
      setCount(c ?? 0);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, ...deps]);

  return count;
}

export default useMonthlyInboundCount;
