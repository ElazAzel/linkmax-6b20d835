import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';
import { normalizeAppError } from '@/lib/errors/app-error-normalizer';

export type CollabStatus = 'pending' | 'accepted' | 'rejected';

export interface Collaboration {
  id: string;
  requester_id: string;
  target_id: string;
  requester_page_id: string;
  target_page_id: string | null;
  status: CollabStatus;
  message: string | null;
  collab_slug: string | null;
  created_at: string;
  updated_at: string;
  requester?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  target?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  slug: string;
  owner_id: string;
  niche: string | null;
  is_public: boolean;
  invite_code: string | null;
  created_at: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface Shoutout {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string | null;
  is_featured: boolean;
  created_at: string;
  to_user?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  from_user?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Send collab notification via edge function
async function sendCollabNotification(
  targetUserId: string,
  requesterName: string,
  message: string | undefined,
  type: 'request' | 'accepted' | 'rejected'
): Promise<void> {
  try {
    await supabase.functions.invoke('send-collab-notification', {
      body: { targetUserId, requesterName, message, type }
    });
  } catch (error) {
    logger.error('Failed to send collab notification', error, { context: 'collaboration' });
  }
}

// Collaboration functions
export async function sendCollabRequest(
  targetId: string,
  pageId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Get requester's display name
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, username')
    .eq('id', user.id)
    .maybeSingle();

  const requesterName = profile?.display_name || profile?.username || 'Someone';

  const { error } = await supabase
    .from('collaborations')
    .insert({
      requester_id: user.id,
      target_id: targetId,
      requester_page_id: pageId,
      message: message || null,
    });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Collaboration request already exists' };
    }
    return { success: false, error: normalizeAppError(error).safeMessage };
  }

  // Send notification to target user
  await sendCollabNotification(targetId, requesterName, message, 'request');

  return { success: true };
}

export async function getMyCollaborations(): Promise<Collaboration[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('collaborations')
    .select('*')
    .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`) // FIXED: user.id is verified UUID from auth
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching collaborations', error, { context: 'collaboration' });
    return [];
  }

  // Fetch user profiles for each collaboration
  const collaborations = data || [];
  const userIds = Array.from(new Set(collaborations.flatMap(c => [c.requester_id, c.target_id])));

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return collaborations.map(c => ({
    ...c,
    status: c.status as CollabStatus,
    requester: profileMap.get(c.requester_id),
    target: profileMap.get(c.target_id),
  }));
}

export async function respondToCollab(
  collabId: string,
  accept: boolean,
  pageId?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Get the collaboration to find requester
  const { data: collab } = await supabase
    .from('collaborations')
    .select('requester_id')
    .eq('id', collabId)
    .maybeSingle();

  const updates: Record<string, unknown> = {
    status: accept ? 'accepted' : 'rejected',
    updated_at: new Date().toISOString(),
  };

  if (accept && pageId) {
    updates.target_page_id = pageId;
    
    // Generate unique collab_slug when accepting (LOW-10 fix)
    let isUnique = false;
    let slug = '';
    let attempts = 0;
    
    while (!isUnique && attempts < 5) {
      slug = `collab-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const { data: existing } = await supabase
        .from('collaborations')
        .select('id')
        .eq('collab_slug', slug)
        .maybeSingle();
      
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    
    updates.collab_slug = slug;
  }

  const { error } = await supabase
    .from('collaborations')
    .update(updates)
    .eq('id', collabId);

  if (error) return { success: false, error: normalizeAppError(error).safeMessage };

  // Send notification to requester
  if (collab?.requester_id) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .maybeSingle();

    const responderName = profile?.display_name || profile?.username || 'Someone';
    await sendCollabNotification(collab.requester_id, responderName, undefined, accept ? 'accepted' : 'rejected');
  }

  return { success: true };
}

export async function deleteCollab(collabId: string): Promise<boolean> {
  const { error } = await supabase
    .from('collaborations')
    .delete()
    .eq('id', collabId);

  return !error;
}

// Team functions
export async function createTeam(
  name: string,
  slug: string,
  description?: string,
  niche?: string
): Promise<{ success: boolean; team?: Team; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('teams')
    .insert({
      name,
      slug,
      description: description || null,
      niche: niche || 'other',
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Team slug already exists' };
    }
    return { success: false, error: normalizeAppError(error).safeMessage };
  }

  // Add owner as member
  await supabase
    .from('team_members')
    .insert({
      team_id: data.id,
      user_id: user.id,
      role: 'owner',
    });

  return { success: true, team: { ...data, is_public: data.is_public ?? true } as Team };
}

export async function getMyTeams(): Promise<Team[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get teams where user is owner or member
  const { data: memberTeams } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id);

  const teamIds = memberTeams?.map(m => m.team_id) || [];

  if (teamIds.length === 0) return [];

  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .in('id', teamIds);

  if (error) {
    logger.error('Error fetching teams', error, { context: 'collaboration' });
    return [];
  }

  return (data || []).map(t => ({ ...t, is_public: t.is_public ?? true })) as Team[];
}

export async function getTeamWithMembers(teamId: string): Promise<Team | null> {
  const { data: team, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .maybeSingle();

  if (error || !team) return null;

  const { data: members } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId);

  const userIds = members?.map(m => m.user_id) || [];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return {
    ...team,
    is_public: team.is_public ?? true,
    members: members?.map(m => ({
      ...m,
      profile: profileMap.get(m.user_id),
    })) || [],
  } as Team;
}

export async function inviteToTeam(
  teamId: string,
  userId: string,
  role: string = 'member'
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: userId,
      role,
    });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'User already in team' };
    }
    return { success: false, error: normalizeAppError(error).safeMessage };
  }

  // Send notification to new member
  try {
    const { data: teamData } = await supabase
      .from('teams')
      .select('name')
      .eq('id', teamId)
      .single();

    if (teamData) {
      await supabase.functions.invoke('send-team-notification', {
        body: {
          targetUserId: userId,
          teamName: teamData.name,
          type: 'invited'
        }
      });
    }
  } catch (e) {
    logger.error('Failed to send invite notification', e, { context: 'collaboration' });
  }

  return { success: true };
}

export async function leaveTeam(teamId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', user.id);

  return !error;
}

export async function deleteTeam(teamId: string): Promise<boolean> {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId);

  return !error;
}

// Remove member from team (owner only)
export async function removeMemberFromTeam(
  teamId: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Check if current user is team owner
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id, name')
    .eq('id', teamId)
    .maybeSingle();

  if (!team) return { success: false, error: 'Team not found' };
  if (team.owner_id !== user.id) return { success: false, error: 'Only owner can remove members' };
  if (team.owner_id === memberId) return { success: false, error: 'Cannot remove owner' };

  // Get member info for notification
  const { data: memberProfile } = await supabase
    .from('user_profiles')
    .select('telegram_chat_id, telegram_notifications_enabled')
    .eq('id', memberId)
    .maybeSingle();

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', memberId);

  if (error) return { success: false, error: normalizeAppError(error).safeMessage };

  // Send notification if member has Telegram enabled
  if (memberProfile?.telegram_notifications_enabled && memberProfile?.telegram_chat_id) {
    try {
      await supabase.functions.invoke('send-team-notification', {
        body: {
          targetUserId: memberId,
          teamName: team.name,
          type: 'removed'
        }
      });
    } catch (e) {
      logger.error('Failed to send removal notification', e, { context: 'collaboration' });
    }
  }

  return { success: true };
}

// Generate or get invite code for team
export async function generateTeamInviteCode(teamId: string): Promise<string | null> {
  // First check if code already exists
  const { data: team } = await supabase
    .from('teams')
    .select('invite_code')
    .eq('id', teamId)
    .maybeSingle();

  if (team?.invite_code) {
    return team.invite_code;
  }

  // Generate new code
  const code = `team-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

  const { error } = await supabase
    .from('teams')
    .update({ invite_code: code })
    .eq('id', teamId);

  if (error) {
    logger.error('Error generating invite code', error, { context: 'collaboration', data: { teamId } });
    return null;
  }

  return code;
}

// Reset invite code
export async function resetTeamInviteCode(teamId: string): Promise<string | null> {
  const code = `team-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

  const { error } = await supabase
    .from('teams')
    .update({ invite_code: code })
    .eq('id', teamId);

  if (error) {
    logger.error('Error resetting invite code', error, { context: 'collaboration', data: { teamId } });
    return null;
  }

  return code;
}

// Join team by invite code
export async function joinTeamByInviteCode(inviteCode: string): Promise<{ success: boolean; team?: Team; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Find team by invite code via secure RPC
  const { data: teams, error: teamError } = await supabase
    .rpc('get_team_by_invite_code', { p_code: inviteCode });

  if (teamError || !teams || teams.length === 0) {
    return { success: false, error: 'Invalid invite code' };
  }
  const team = teams[0] as unknown as Team & { id: string; name: string; owner_id?: string };

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMember) {
    return { success: false, error: 'Already a member of this team' };
  }

  // Add user to team
  const { error: joinError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: 'member',
    });

  if (joinError) {
    return { success: false, error: normalizeAppError(joinError).safeMessage };
  }

  // Get user's display name for notification
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, username')
    .eq('id', user.id)
    .maybeSingle();

  const memberName = profile?.display_name || profile?.username || 'Someone';

  // Notify team owner
  try {
    await supabase.functions.invoke('send-team-notification', {
      body: {
        targetUserId: team.owner_id,
        teamName: team.name,
        inviterName: memberName,
        type: 'joined'
      }
    });
  } catch (e) {
    logger.error('Failed to send join notification', e, { context: 'collaboration' });
  }

  return { success: true, team: { ...team, is_public: team.is_public ?? true } as Team };
}

// Get team by invite code (for preview)
export async function getTeamByInviteCode(inviteCode: string): Promise<Team | null> {
  const { data: teams, error } = await supabase
    .rpc('get_team_by_invite_code', { p_code: inviteCode });

  if (error || !teams || teams.length === 0) return null;
  return { ...teams[0], is_public: (teams[0] as Record<string, unknown>).is_public ?? true } as Team;
}

// Shoutout functions
export async function createShoutout(
  toUserId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  if (user.id === toUserId) {
    return { success: false, error: 'Cannot shoutout yourself' };
  }

  const { error } = await supabase
    .from('shoutouts')
    .insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      message: message || null,
    });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Shoutout already exists' };
    }
    return { success: false, error: normalizeAppError(error).safeMessage };
  }

  return { success: true };
}

export async function getMyShoutouts(): Promise<Shoutout[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('shoutouts')
    .select('*')
    .eq('from_user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return [];

  const userIds = data?.map(s => s.to_user_id) || [];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return data?.map(s => ({
    ...s,
    is_featured: s.is_featured ?? false,
    to_user: profileMap.get(s.to_user_id),
  })) || [];
}

export async function getShoutoutsForUser(userId: string): Promise<Shoutout[]> {
  const { data, error } = await supabase
    .from('shoutouts')
    .select('*')
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];

  const fromUserIds = data?.map(s => s.from_user_id) || [];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', fromUserIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return data?.map(s => ({
    ...s,
    is_featured: s.is_featured ?? false,
    from_user: profileMap.get(s.from_user_id),
  })) || [];
}

export async function deleteShoutout(shoutoutId: string): Promise<boolean> {
  const { error } = await supabase
    .from('shoutouts')
    .delete()
    .eq('id', shoutoutId);

  return !error;
}

// Search users for collaboration — delegates to shared service (MED-4 fix)
export { searchUsers } from '@/services/userSearch';
// Re-export with niche by default for collaboration context
import { searchUsers as _searchUsersBase } from '@/services/userSearch';
export async function searchUsersWithNiche(query: string) {
  return _searchUsersBase(query, { includeNiche: true });
}

// Get users by niche for mutual promo
export async function getUsersByNiche(niche: string): Promise<Array<{
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}>> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: pages } = await supabase
    .from('pages')
    .select('user_id')
    .eq('niche', niche)
    .eq('is_published', true)
    .neq('user_id', user?.id || '')
    .limit(20);

  const userIds = pages?.map(p => p.user_id) || [];
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds);

  return profiles || [];
}
