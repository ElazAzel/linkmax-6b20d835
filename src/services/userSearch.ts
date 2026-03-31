/**
 * Shared user search service — single source of truth for user search across features.
 * Replaces duplicated searchUsers in collaboration.ts and friends.ts (MED-4 audit fix).
 */
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface UserSearchResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  niche?: string | null;
}

/**
 * Search users by username or display name.
 * @param query - search string (min 2 chars)
 * @param options.includeNiche - also fetch niche from pages table
 * @param options.limit - max results (default 10)
 */
export async function searchUsers(
  query: string,
  options: { includeNiche?: boolean; limit?: number } = {}
): Promise<UserSearchResult[]> {
  const { includeNiche = false, limit = 10 } = options;

  if (!query || query.length < 2) return [];

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .neq('id', user?.id || '')
    .limit(limit);

  if (error) {
    logger.error('User search error', error, { context: 'userSearch', data: { query } });
    return [];
  }

  if (!data || data.length === 0) return [];

  // Optionally enrich with niche
  if (includeNiche) {
    const userIds = data.map(u => u.id);
    const { data: pages } = await supabase
      .from('pages')
      .select('user_id, niche')
      .in('user_id', userIds);

    const nicheMap = new Map(pages?.map(p => [p.user_id, p.niche]) || []);

    return data.map(u => ({
      ...u,
      niche: nicheMap.get(u.id),
    }));
  }

  return data;
}
