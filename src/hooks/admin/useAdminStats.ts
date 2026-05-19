import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';

export interface PlatformStats {
  totalUsers: number;
  totalPages: number;
  publishedPages: number;
  totalViews: number;
  totalClicks: number;
  totalShares: number;
  premiumUsers: number;
  activeTrials: number;
  totalBlocks: number;
  totalFriendships: number;
  acceptedFriendships: number;
  pendingFriendships: number;
  totalCollaborations: number;
  acceptedCollaborations: number;
  totalTeams: number;
  totalTeamMembers: number;
  totalLeads: number;
  galleryPages: number;
  totalReferrals: number;
  totalAchievements: number;
  usersWithStreak: number;
  totalShoutouts: number;
}

/**
 * Perf 2026-05-19: collapsed 22 parallel `count: 'exact'` round-trips
 * (which forced full table scans on `pages`, `analytics`, `blocks` and
 * also pulled every page row to sum `view_count` client-side) into a
 * single `get_admin_platform_stats` RPC. The RPC runs all aggregates
 * server-side in one transaction and is admin-gated via `has_role`.
 */
async function fetchPlatformStats(): Promise<PlatformStats> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- types regenerate after migration deploys
  const { data, error } = await (supabase.rpc as any)('get_admin_platform_stats');
  if (error) throw error;
  const s = (data ?? {}) as Partial<PlatformStats>;
  return {
    totalUsers: s.totalUsers ?? 0,
    totalPages: s.totalPages ?? 0,
    publishedPages: s.publishedPages ?? 0,
    totalViews: s.totalViews ?? 0,
    totalClicks: s.totalClicks ?? 0,
    totalShares: s.totalShares ?? 0,
    premiumUsers: s.premiumUsers ?? 0,
    activeTrials: s.activeTrials ?? 0,
    totalBlocks: s.totalBlocks ?? 0,
    totalFriendships: s.totalFriendships ?? 0,
    acceptedFriendships: s.acceptedFriendships ?? 0,
    pendingFriendships: s.pendingFriendships ?? 0,
    totalCollaborations: s.totalCollaborations ?? 0,
    acceptedCollaborations: s.acceptedCollaborations ?? 0,
    totalTeams: s.totalTeams ?? 0,
    totalTeamMembers: s.totalTeamMembers ?? 0,
    totalLeads: s.totalLeads ?? 0,
    galleryPages: s.galleryPages ?? 0,
    totalReferrals: s.totalReferrals ?? 0,
    totalAchievements: s.totalAchievements ?? 0,
    usersWithStreak: s.usersWithStreak ?? 0,
    totalShoutouts: s.totalShoutouts ?? 0,
  };
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-platform-stats'],
    queryFn: fetchPlatformStats,
    staleTime: 5 * 60_000, // 5 minutes — admin overview rarely needs sub-minute freshness
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
