import { useEffect } from 'react';
import { useAuth } from '@/hooks/user/useAuth';
import {
  clearRememberedGrowthReferralCode,
  getGrowthSessionKey,
  getRememberedGrowthReferralCode,
  rememberGrowthReferralCode,
} from '@/lib/growth/visitor';
import { recordGrowthEvent } from '@/services/viral-growth';

const VISIT_MARKER_PREFIX = 'linkmax_growth_visit_';

export function useGrowthAttribution(): void {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const code = new URLSearchParams(window.location.search).get('ref');
    if (!code) return;
    rememberGrowthReferralCode(code);

    const markerKey = `${VISIT_MARKER_PREFIX}${code}:${getGrowthSessionKey()}`;
    try {
      if (window.sessionStorage.getItem(markerKey)) return;
      window.sessionStorage.setItem(markerKey, '1');
    } catch {
      // Attribution remains best-effort when browser storage is blocked.
    }

    void recordGrowthEvent({
      code,
      eventName: 'referral_visit',
      metadata: {
        path: window.location.pathname,
        visitor_key_version: 1,
        has_auth: Boolean(user),
      },
    });
  }, [user]);

  useEffect(() => {
    const code = getRememberedGrowthReferralCode();
    if (!user || !code) return;
    void recordGrowthEvent({
      code,
      eventName: 'referral_signup',
      metadata: { conversion: 'authenticated_session', visitor_key_version: 1 },
    }).then((success) => {
      if (success) clearRememberedGrowthReferralCode();
    });
  }, [user]);
}
