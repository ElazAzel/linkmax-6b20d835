import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/logger';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  friend_profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  user_profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export async function sendFriendRequest(friendId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'not_authenticated' };

  if (user.id === friendId) {
    return { success: false, error: 'cannot_add_self' };
  }

  // Check if friendship already exists
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'friendship_exists' };
  }

  const { error } = await supabase
    .from('friendships')
    .insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending'
    });

  if (error) {
    logger.error('Send friend request error', error, { context: 'friends', data: { friend_id: friendId } });
    return { success: false, error: error.message };
  }

  // Send Telegram notification
  try {
    await supabase.functions.invoke('send-friend-notification', {
      body: { targetUserId: friendId, type: 'request' }
    });
  } catch (e) {
    logger.debug('Friend notification failed', { data: e, context: 'friends' });
  }

  return { success: true };
}

export async function acceptFriendRequest(friendshipId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'not_authenticated' };

  const { data: friendship, error: fetchError } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', friendshipId)
    .single();

  if (fetchError || !friendship) {
    return { success: false, error: 'friendship_not_found' };
  }

  if (friendship.friend_id !== user.id) {
    return { success: false, error: 'not_authorized' };
  }

  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId);

  if (error) {
    logger.error('Accept friend request error', error, { context: 'friends', data: { friendshipId } });
    return { success: false, error: error.message };
  }

  // Update friends count for both users
  await updateFriendsCount(user.id);
  await updateFriendsCount(friendship.user_id);

  // Send notification
  try {
    await supabase.functions.invoke('send-friend-notification', {
      body: { targetUserId: friendship.user_id, type: 'accepted' }
    });
  } catch (e) {
    logger.debug('Friend notification failed', { data: e, context: 'friends' });
  }

  return { success: true };
}

export async function rejectFriendRequest(friendshipId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);

  if (error) {
    logger.error('Reject friend request error', error, { context: 'friends', data: { friendshipId } });
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function removeFriend(friendshipId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'not_authenticated' };

  const { data: friendship } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .eq('id', friendshipId)
    .single();

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);

  if (error) {
    logger.error('Remove friend error', error, { context: 'friends', data: { friendshipId } });
    return { success: false, error: error.message };
  }

  // Update friends count
  if (friendship) {
    await updateFriendsCount(friendship.user_id);
    await updateFriendsCount(friendship.friend_id);
  }

  return { success: true };
}

export async function getFriends(): Promise<Friendship[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('status', 'accepted')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  if (error || !friendships) return [];

  // Get all friend IDs
  const friendIds = friendships.map(f => f.user_id === user.id ? f.friend_id : f.user_id);

  // Fetch profiles
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', friendIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return friendships.map(f => {
    const friendId = f.user_id === user.id ? f.friend_id : f.user_id;
    return {
      ...f,
      status: f.status as FriendshipStatus,
      friend_profile: profileMap.get(friendId)
    };
  });
}

export async function getPendingRequests(): Promise<Friendship[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('status', 'pending')
    .eq('friend_id', user.id);

  if (error || !friendships) return [];

  const userIds = friendships.map(f => f.user_id);

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return friendships.map(f => ({
    ...f,
    status: f.status as FriendshipStatus,
    user_profile: profileMap.get(f.user_id)
  }));
}

export async function getSentRequests(): Promise<Friendship[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('status', 'pending')
    .eq('user_id', user.id);

  if (error || !friendships) return [];

  const friendIds = friendships.map(f => f.friend_id);

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', friendIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return friendships.map(f => ({
    ...f,
    status: f.status as FriendshipStatus,
    friend_profile: profileMap.get(f.friend_id)
  }));
}

async function updateFriendsCount(userId: string) {
  const { count } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  await supabase
    .from('user_profiles')
    .update({ friends_count: count || 0 })
    .eq('id', userId);
}

export async function searchUsers(query: string): Promise<Array<{ id: string; username: string | null; display_name: string | null; avatar_url: string | null }>> {
  if (!query || query.length < 2) return [];

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .neq('id', user?.id || '')
    .limit(10);

  if (error) {
    logger.error('Search users error', error, { context: 'friends', data: { query } });
    return [];
  }

  return data || [];
}

export async function getUserPageSlug(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('pages')
    .select('slug')
    .eq('user_id', userId)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) return null;
  return data.slug;
}
