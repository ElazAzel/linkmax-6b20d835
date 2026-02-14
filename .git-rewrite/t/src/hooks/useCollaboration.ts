import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import {
  Collaboration,
  Team,
  Shoutout,
  getMyCollaborations,
  sendCollabRequest,
  respondToCollab,
  deleteCollab,
  getMyTeams,
  createTeam,
  getTeamWithMembers,
  inviteToTeam,
  leaveTeam,
  deleteTeam,
  getMyShoutouts,
  createShoutout,
  deleteShoutout,
  searchUsers,
  getUsersByNiche,
} from '@/services/collaboration';

export function useCollaboration(userId: string | undefined) {
  const { t } = useTranslation();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [collabs, userTeams, userShoutouts] = await Promise.all([
        getMyCollaborations(),
        getMyTeams(),
        getMyShoutouts(),
      ]);

      setCollaborations(collabs);
      setTeams(userTeams);
      setShoutouts(userShoutouts);
    } catch (error) {
      logger.error('Error loading collaboration data:', error, { context: 'useCollaboration' });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Collaboration actions
  const sendRequest = useCallback(async (targetId: string, pageId: string, message?: string) => {
    const result = await sendCollabRequest(targetId, pageId, message);
    if (result.success) {
      toast.success(t('toasts.collaboration.requestSent'));
      await loadData();
    } else {
      toast.error(result.error || t('toasts.collaboration.requestError'));
    }
    return result.success;
  }, [loadData, t]);

  const respondRequest = useCallback(async (collabId: string, accept: boolean, pageId?: string) => {
    const result = await respondToCollab(collabId, accept, pageId);
    if (result.success) {
      toast.success(accept ? t('toasts.collaboration.accepted') : t('toasts.collaboration.rejected'));
      await loadData();
    } else {
      toast.error(result.error || t('toasts.collaboration.error'));
    }
    return result.success;
  }, [loadData, t]);

  const removeCollab = useCallback(async (collabId: string) => {
    const success = await deleteCollab(collabId);
    if (success) {
      toast.success(t('toasts.collaboration.deleted'));
      await loadData();
    }
    return success;
  }, [loadData, t]);

  // Team actions
  const createNewTeam = useCallback(async (name: string, slug: string, description?: string, niche?: string) => {
    const result = await createTeam(name, slug, description, niche);
    if (result.success) {
      toast.success(t('toasts.team.created'));
      await loadData();
    } else {
      toast.error(result.error || t('toasts.team.createError'));
    }
    return result;
  }, [loadData, t]);

  const inviteMember = useCallback(async (teamId: string, usrId: string, role?: string) => {
    const result = await inviteToTeam(teamId, usrId, role);
    if (result.success) {
      toast.success(t('toasts.team.memberInvited'));
    } else {
      toast.error(result.error || t('toasts.team.inviteError'));
    }
    return result.success;
  }, [t]);

  const leave = useCallback(async (teamId: string) => {
    const success = await leaveTeam(teamId);
    if (success) {
      toast.success(t('toasts.team.left'));
      await loadData();
    }
    return success;
  }, [loadData, t]);

  const removeTeam = useCallback(async (teamId: string) => {
    const success = await deleteTeam(teamId);
    if (success) {
      toast.success(t('toasts.team.deleted'));
      await loadData();
    }
    return success;
  }, [loadData, t]);

  // Shoutout actions
  const addShoutout = useCallback(async (toUserId: string, message?: string) => {
    const result = await createShoutout(toUserId, message);
    if (result.success) {
      toast.success(t('toasts.shoutout.added'));
      await loadData();
    } else {
      toast.error(result.error || t('toasts.shoutout.error'));
    }
    return result.success;
  }, [loadData, t]);

  const removeShoutout = useCallback(async (shoutoutId: string) => {
    const success = await deleteShoutout(shoutoutId);
    if (success) {
      toast.success(t('toasts.shoutout.deleted'));
      await loadData();
    }
    return success;
  }, [loadData, t]);

  // Search
  const search = useCallback(async (query: string) => {
    return searchUsers(query);
  }, []);

  const findByNiche = useCallback(async (niche: string) => {
    return getUsersByNiche(niche);
  }, []);

  const pendingRequests = collaborations.filter(
    c => c.status === 'pending' && c.target_id === userId
  );

  const activeCollabs = collaborations.filter(c => c.status === 'accepted');

  return {
    collaborations,
    teams,
    shoutouts,
    loading,
    pendingRequests,
    activeCollabs,
    // Collab actions
    sendRequest,
    respondRequest,
    removeCollab,
    // Team actions
    createNewTeam,
    inviteMember,
    leaveTeam: leave,
    removeTeam,
    getTeamWithMembers,
    // Shoutout actions
    addShoutout,
    removeShoutout,
    // Search
    search,
    findByNiche,
    // Refresh
    refresh: loadData,
  };
}
