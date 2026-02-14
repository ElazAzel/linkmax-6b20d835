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

async function fetchPlatformStats(): Promise<PlatformStats> {
  const now = new Date().toISOString();
  
  // Batch all count queries together for efficiency
  const [
    { count: totalUsers },
    { count: premiumUsers },
    { count: activeTrials },
    { count: usersWithStreak },
    { count: totalPages },
    { count: publishedPages },
    { count: galleryPages },
    { data: viewData },
    { count: totalClicks },
    { count: totalShares },
    { count: totalBlocks },
    { count: totalFriendships },
    { count: acceptedFriendships },
    { count: pendingFriendships },
    { count: totalCollaborations },
    { count: acceptedCollaborations },
    { count: totalTeams },
    { count: totalTeamMembers },
    { count: totalLeads },
    { count: totalReferrals },
    { count: totalAchievements },
    { count: totalShoutouts }
  ] = await Promise.all([
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gt('trial_ends_at', now),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gt('current_streak', 0),
    supabase.from('pages').select('*', { count: 'exact', head: true }),
    supabase.from('pages').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('pages').select('*', { count: 'exact', head: true }).eq('is_in_gallery', true),
    supabase.from('pages').select('view_count'),
    supabase.from('analytics').select('*', { count: 'exact', head: true }).eq('event_type', 'click'),
    supabase.from('analytics').select('*', { count: 'exact', head: true }).eq('event_type', 'share'),
    supabase.from('blocks').select('*', { count: 'exact', head: true }),
    supabase.from('friendships').select('*', { count: 'exact', head: true }),
    supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
    supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('collaborations').select('*', { count: 'exact', head: true }),
    supabase.from('collaborations').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
    supabase.from('teams').select('*', { count: 'exact', head: true }),
    supabase.from('team_members').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('referrals').select('*', { count: 'exact', head: true }),
    supabase.from('user_achievements').select('*', { count: 'exact', head: true }),
    supabase.from('shoutouts').select('*', { count: 'exact', head: true })
  ]);

  const totalViews = viewData?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;

  return {
    totalUsers: totalUsers || 0,
    totalPages: totalPages || 0,
    publishedPages: publishedPages || 0,
    totalViews,
    totalClicks: totalClicks || 0,
    totalShares: totalShares || 0,
    premiumUsers: premiumUsers || 0,
    activeTrials: activeTrials || 0,
    totalBlocks: totalBlocks || 0,
    totalFriendships: totalFriendships || 0,
    acceptedFriendships: acceptedFriendships || 0,
    pendingFriendships: pendingFriendships || 0,
    totalCollaborations: totalCollaborations || 0,
    acceptedCollaborations: acceptedCollaborations || 0,
    totalTeams: totalTeams || 0,
    totalTeamMembers: totalTeamMembers || 0,
    totalLeads: totalLeads || 0,
    galleryPages: galleryPages || 0,
    totalReferrals: totalReferrals || 0,
    totalAchievements: totalAchievements || 0,
    usersWithStreak: usersWithStreak || 0,
    totalShoutouts: totalShoutouts || 0
  };
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-platform-stats'],
    queryFn: fetchPlatformStats,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}
