/**
 * useLeadAging - Detects stale and missed leads for urgency cues
 */
import { useMemo } from 'react';
import { differenceInHours, differenceInDays } from 'date-fns';
import type { Lead } from '@/hooks/crm/useLeads';

export interface AgingStats {
  staleCount: number;      // new + > 4h
  missedCount: number;     // new + > 24h
  needsFollowup: number;  // contacted + > 3 days without interaction
  urgentTotal: number;     // stale + missed
}

export function useLeadAging(leads: Lead[]): AgingStats {
  return useMemo(() => {
    const now = new Date();
    let staleCount = 0;
    let missedCount = 0;
    let needsFollowup = 0;

    for (const lead of leads) {
      const createdAt = new Date(lead.created_at);
      const updatedAt = new Date(lead.updated_at);
      const hoursSinceCreated = differenceInHours(now, createdAt);
      const daysSinceUpdated = differenceInDays(now, updatedAt);

      if (lead.status === 'new') {
        if (hoursSinceCreated >= 24) {
          missedCount++;
        } else if (hoursSinceCreated >= 4) {
          staleCount++;
        }
      }

      if (lead.status === 'contacted' && daysSinceUpdated >= 3) {
        needsFollowup++;
      }
    }

    return {
      staleCount,
      missedCount,
      needsFollowup,
      urgentTotal: staleCount + missedCount,
    };
  }, [leads]);
}
