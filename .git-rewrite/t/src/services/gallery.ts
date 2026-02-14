import { supabase } from '@/integrations/supabase/client';
import { incrementChallengeProgress } from '@/services/social';
import type { Niche } from '@/lib/niches';

export interface GalleryPage {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  avatar_url: string | null;
  preview_url: string | null;
  gallery_likes: number;
  gallery_featured_at: string | null;
  view_count: number | null;
  niche: string | null;
  is_premium?: boolean;
}

export type LeaderboardPeriod = 'week' | 'month' | 'all';

// Fetch all published pages for gallery with premium and popular pages first
export async function getGalleryPages(niche?: Niche | null): Promise<GalleryPage[]> {
  let query = supabase
    .from('pages')
    .select('id, slug, title, description, avatar_url, preview_url, gallery_likes, gallery_featured_at, view_count, niche, user_id')
    .eq('is_published', true);

  if (niche) {
    query = query.eq('niche', niche);
  }

  const { data, error } = await query
    .order('view_count', { ascending: false, nullsFirst: false })
    .order('gallery_likes', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching gallery pages:', error);
    return [];
  }

  // Get premium status for each page owner
  const userIds = [...new Set((data || []).map(p => p.user_id))];
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, is_premium, trial_ends_at')
    .in('id', userIds);
  
  const premiumMap = new Map<string, boolean>();
  profiles?.forEach(p => {
    const isPremium = p.is_premium || (p.trial_ends_at && new Date(p.trial_ends_at) > new Date());
    premiumMap.set(p.id, isPremium);
  });
  
  // Add premium flag and sort: premium first, then by views
  const pagesWithPremium = (data || []).map(p => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    avatar_url: p.avatar_url,
    preview_url: p.preview_url,
    gallery_likes: p.gallery_likes,
    gallery_featured_at: p.gallery_featured_at,
    view_count: p.view_count,
    niche: p.niche,
    is_premium: premiumMap.get(p.user_id) || false
  }));
  
  pagesWithPremium.sort((a, b) => {
    // Premium pages first
    if (a.is_premium && !b.is_premium) return -1;
    if (!a.is_premium && b.is_premium) return 1;
    // Then by views
    if ((b.view_count || 0) !== (a.view_count || 0)) {
      return (b.view_count || 0) - (a.view_count || 0);
    }
    // Then by likes
    return (b.gallery_likes || 0) - (a.gallery_likes || 0);
  });
  
  return pagesWithPremium;
}

// Fetch top premium pages with most views for landing page
export async function getTopPremiumPages(limit: number = 5): Promise<GalleryPage[]> {
  // First get premium users
  const { data: premiumProfiles } = await supabase
    .from('user_profiles')
    .select('id')
    .or('is_premium.eq.true,trial_ends_at.gt.now()');
  
  if (!premiumProfiles || premiumProfiles.length === 0) {
    return [];
  }
  
  const premiumUserIds = premiumProfiles.map(p => p.id);
  
  const { data, error } = await supabase
    .from('pages')
    .select('id, slug, title, description, avatar_url, preview_url, gallery_likes, gallery_featured_at, view_count, niche')
    .eq('is_published', true)
    .in('user_id', premiumUserIds)
    .order('view_count', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top premium pages:', error);
    return [];
  }

  return (data || []).map(p => ({ ...p, is_premium: true }));
}

export async function getNicheCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('pages')
    .select('niche')
    .eq('is_published', true);

  if (error) {
    console.error('Error fetching niche counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  (data || []).forEach((page) => {
    const niche = page.niche || 'other';
    counts[niche] = (counts[niche] || 0) + 1;
  });

  return counts;
}

export async function getLeaderboardPages(period: LeaderboardPeriod = 'week'): Promise<GalleryPage[]> {
  let query = supabase
    .from('pages')
    .select('id, slug, title, description, avatar_url, preview_url, gallery_likes, gallery_featured_at, view_count, niche')
    .eq('is_published', true);

  // Filter by period
  if (period === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    query = query.gte('gallery_featured_at', weekAgo.toISOString());
  } else if (period === 'month') {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    query = query.gte('gallery_featured_at', monthAgo.toISOString());
  }

  const { data, error } = await query
    .order('gallery_likes', { ascending: false })
    .order('view_count', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return (data || []) as GalleryPage[];
}

export async function toggleGalleryStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_gallery_status', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error toggling gallery status:', error);
    throw error;
  }

  return data as boolean;
}

export async function likeGalleryPage(pageId: string): Promise<void> {
  const { error } = await supabase.rpc('like_gallery_page', {
    p_page_id: pageId,
  });

  if (error) {
    console.error('Error liking page:', error);
    throw error;
  }

  // Track challenge progress
  incrementChallengeProgress('like_pages');
}

export async function unlikeGalleryPage(pageId: string): Promise<void> {
  const { error } = await supabase.rpc('unlike_gallery_page', {
    p_page_id: pageId,
  });

  if (error) {
    console.error('Error unliking page:', error);
    throw error;
  }
}

export async function getPageByUserId(userId: string): Promise<{ id: string; slug: string } | null> {
  const { data, error } = await supabase
    .from('pages')
    .select('id, slug')
    .eq('user_id', userId)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getMyGalleryStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('pages')
    .select('is_in_gallery')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error getting gallery status:', error);
    return false;
  }

  return data?.is_in_gallery ?? false;
}
