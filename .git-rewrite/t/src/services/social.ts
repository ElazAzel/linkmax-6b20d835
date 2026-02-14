/**
 * Social features service - gifts, boosts, challenges, activities
 */
import { supabase } from '@/integrations/supabase/client';

// ==================== TYPES ====================

export interface WeeklyChallenge {
  id: string;
  challenge_key: string;
  title: string;
  description: string;
  target_count: number;
  reward_hours: number;
  week_start: string;
}

export interface ChallengeProgress {
  id: string;
  challenge_id: string;
  current_count: number;
  is_completed: boolean;
  reward_claimed: boolean;
  challenge?: WeeklyChallenge;
}

export interface PremiumGift {
  id: string;
  sender_id: string;
  recipient_id: string;
  days_gifted: number;
  message: string | null;
  is_claimed: boolean;
  created_at: string;
  claimed_at: string | null;
  sender_profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface PageBoost {
  id: string;
  page_id: string;
  boost_type: string;
  started_at: string;
  ends_at: string;
  is_active: boolean;
}

export interface FriendActivity {
  id: string;
  user_id: string;
  activity_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user_profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

// ==================== CHALLENGES ====================

export async function getWeeklyChallenges(): Promise<WeeklyChallenge[]> {
  const { data, error } = await supabase
    .from('weekly_challenges')
    .select('*')
    .eq('is_active', true)
    .eq('week_start', getWeekStart());

  if (error) {
    console.error('Error fetching challenges:', error);
    return [];
  }

  return data || [];
}

export async function getChallengeProgress(userId: string): Promise<ChallengeProgress[]> {
  const challenges = await getWeeklyChallenges();
  if (challenges.length === 0) return [];

  const challengeIds = challenges.map(c => c.id);
  
  const { data, error } = await supabase
    .from('challenge_progress')
    .select('*')
    .eq('user_id', userId)
    .in('challenge_id', challengeIds);

  if (error) {
    console.error('Error fetching progress:', error);
    return [];
  }

  // Merge progress with challenges
  return challenges.map(challenge => {
    const progress = data?.find(p => p.challenge_id === challenge.id);
    return {
      id: progress?.id || '',
      challenge_id: challenge.id,
      current_count: progress?.current_count || 0,
      is_completed: progress?.is_completed || false,
      reward_claimed: progress?.reward_claimed || false,
      challenge
    };
  });
}

export async function incrementChallengeProgress(challengeKey: string): Promise<void> {
  const { error } = await supabase.rpc('increment_challenge_progress', {
    p_challenge_key: challengeKey
  });

  if (error) {
    console.error('Error incrementing challenge:', error);
  }
}

export async function claimChallengeReward(challengeId: string): Promise<{ success: boolean; hours?: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get challenge info
  const { data: challengeInfo } = await supabase
    .from('weekly_challenges')
    .select('title')
    .eq('id', challengeId)
    .single();

  const { data, error } = await supabase.rpc('complete_weekly_challenge', {
    p_challenge_id: challengeId
  });

  if (error) {
    console.error('Error claiming reward:', error);
    return { success: false };
  }

  const result = data as { success: boolean; hours?: number };
  
  if (result.success && user) {
    // Send notification to user
    try {
      await supabase.functions.invoke('send-social-notification', {
        body: {
          type: 'challenge_completed',
          recipientId: user.id,
          data: {
            challengeTitle: challengeInfo?.title || 'Еженедельный челлендж'
          }
        }
      });
    } catch (e) {
      console.error('Failed to send challenge notification:', e);
    }

    // Notify friends about completed challenge
    await notifyFriendsAboutChallenge(user.id, challengeInfo?.title || 'Челлендж');
  }
  
  return result;
}

async function notifyFriendsAboutChallenge(userId: string, challengeTitle: string): Promise<void> {
  // Get user's display name
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('display_name, username')
    .eq('id', userId)
    .single();

  // Get friends (accepted friendships)
  const { data: friendships } = await supabase
    .from('friendships')
    .select('friend_id, user_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted')
    .limit(10); // Limit to prevent spam

  if (!friendships || friendships.length === 0) return;

  const friendIds = friendships.map(f => f.user_id === userId ? f.friend_id : f.user_id);
  const friendName = userProfile?.display_name || userProfile?.username || 'Друг';

  // Notify each friend (in parallel, but limited)
  await Promise.all(
    friendIds.slice(0, 5).map(friendId =>
      supabase.functions.invoke('send-social-notification', {
        body: {
          type: 'friend_challenge_completed',
          recipientId: friendId,
          data: {
            friendName,
            challengeTitle
          }
        }
      }).catch(e => console.error('Failed to notify friend:', e))
    )
  );
}

// ==================== PREMIUM GIFTS ====================

export async function sendPremiumGift(
  recipientId: string, 
  days: number = 7, 
  message?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'not_authenticated' };

  // Get sender's display name
  const { data: senderProfile } = await supabase
    .from('user_profiles')
    .select('display_name, username')
    .eq('id', user.id)
    .single();

  const { error } = await supabase
    .from('premium_gifts')
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      days_gifted: days,
      message: message || null
    });

  if (error) {
    console.error('Error sending gift:', error);
    return { success: false, error: 'failed' };
  }

  // Record activity
  await recordActivity('gift_sent', { recipient_id: recipientId, days });

  // Send Telegram notification to recipient
  try {
    await supabase.functions.invoke('send-social-notification', {
      body: {
        type: 'gift_received',
        recipientId,
        data: {
          senderName: senderProfile?.display_name || senderProfile?.username || 'Пользователь',
          days,
          message
        }
      }
    });
  } catch (e) {
    console.error('Failed to send gift notification:', e);
  }

  return { success: true };
}

export async function getPendingGifts(): Promise<PremiumGift[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('premium_gifts')
    .select('*')
    .eq('recipient_id', user.id)
    .eq('is_claimed', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching gifts:', error);
    return [];
  }

  // Fetch sender profiles
  if (data && data.length > 0) {
    const senderIds = [...new Set(data.map(g => g.sender_id))];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', senderIds);

    return data.map(gift => ({
      ...gift,
      sender_profile: profiles?.find(p => p.id === gift.sender_id)
    }));
  }

  return data || [];
}

export async function claimPremiumGift(giftId: string): Promise<{ success: boolean; days?: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get gift info before claiming
  const { data: giftInfo } = await supabase
    .from('premium_gifts')
    .select('sender_id')
    .eq('id', giftId)
    .single();

  const { data, error } = await supabase.rpc('claim_premium_gift', {
    p_gift_id: giftId
  });

  if (error) {
    console.error('Error claiming gift:', error);
    return { success: false };
  }

  const result = data as { success: boolean; days?: number };
  
  if (result.success) {
    await recordActivity('gift_received', { days: result.days });

    // Notify sender that gift was claimed
    if (giftInfo?.sender_id && user) {
      const { data: recipientProfile } = await supabase
        .from('user_profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single();

      try {
        await supabase.functions.invoke('send-social-notification', {
          body: {
            type: 'gift_claimed',
            recipientId: giftInfo.sender_id,
            data: {
              senderName: recipientProfile?.display_name || recipientProfile?.username || 'Получатель'
            }
          }
        });
      } catch (e) {
        console.error('Failed to send claim notification:', e);
      }
    }
  }

  return result;
}

// ==================== PAGE BOOSTS ====================

export async function boostPage(
  pageId: string, 
  boostType: 'standard' | 'premium' | 'super' = 'standard',
  durationHours: number = 24
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'not_authenticated' };

  const endsAt = new Date();
  endsAt.setHours(endsAt.getHours() + durationHours);

  const { error } = await supabase
    .from('page_boosts')
    .insert({
      page_id: pageId,
      user_id: user.id,
      boost_type: boostType,
      ends_at: endsAt.toISOString()
    });

  if (error) {
    console.error('Error boosting page:', error);
    return { success: false, error: 'failed' };
  }

  await recordActivity('page_boosted', { boost_type: boostType, duration_hours: durationHours });

  return { success: true };
}

export async function getActiveBoosts(pageId: string): Promise<PageBoost[]> {
  const { data, error } = await supabase
    .from('page_boosts')
    .select('*')
    .eq('page_id', pageId)
    .eq('is_active', true)
    .gte('ends_at', new Date().toISOString());

  if (error) {
    console.error('Error fetching boosts:', error);
    return [];
  }

  return data || [];
}

// ==================== FRIEND ACTIVITIES ====================

export async function recordActivity(
  activityType: string, 
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('friend_activities')
    .insert([{
      user_id: user.id,
      activity_type: activityType,
      metadata: JSON.parse(JSON.stringify(metadata))
    }]);

  if (error) {
    console.error('Error recording activity:', error);
  }
}

export async function getFriendActivities(limit: number = 20): Promise<FriendActivity[]> {
  const { data, error } = await supabase
    .from('friend_activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Fetch user profiles
  const userIds = [...new Set(data.map(a => a.user_id))];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, avatar_url')
    .in('id', userIds);

  return data.map(activity => ({
    id: activity.id,
    user_id: activity.user_id,
    activity_type: activity.activity_type,
    metadata: (activity.metadata || {}) as Record<string, unknown>,
    created_at: activity.created_at,
    user_profile: profiles?.find(p => p.id === activity.user_id)
  }));
}

// ==================== HELPERS ====================

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}
