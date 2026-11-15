import { useCallback, useState } from 'react';
import { supabase } from '@/platform/supabase/client';

type DomainCheckState = 'active' | 'pending' | 'error';

interface DomainCheck {
  state: DomainCheckState;
  hostname: string;
  checkedAt: string;
}

/**
 * Checks whether the DNS of a custom domain already points to the platform
 * (edge function `verify-domain`). The caller renders the result; the hook
 * shows no toasts of its own.
 */
export function useDomainVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [check, setCheck] = useState<DomainCheck | null>(null);

  const verifyDomain = useCallback(async (hostname: string): Promise<DomainCheck> => {
    const normalized = hostname.trim().toLowerCase();
    setIsVerifying(true);
    let state: DomainCheckState = 'error';
    try {
      const { data, error } = await supabase.functions.invoke<{ isConfigured?: boolean }>('verify-domain', {
        body: { hostname: normalized },
      });
      if (!error) state = data?.isConfigured ? 'active' : 'pending';
    } catch {
      state = 'error';
    }
    const result: DomainCheck = { state, hostname: normalized, checkedAt: new Date().toISOString() };
    setCheck(result);
    setIsVerifying(false);
    return result;
  }, []);

  const reset = useCallback(() => setCheck(null), []);

  return { verifyDomain, isVerifying, check, reset };
}
