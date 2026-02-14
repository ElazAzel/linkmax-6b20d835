import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
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
      console.error('Error loading collaboration data:', error);
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
      toast.success('Запрос на коллаборацию отправлен!');
      await loadData();
    } else {
      toast.error(result.error || 'Ошибка при отправке запроса');
    }
    return result.success;
  }, [loadData]);

  const respondRequest = useCallback(async (collabId: string, accept: boolean, pageId?: string) => {
    const result = await respondToCollab(collabId, accept, pageId);
    if (result.success) {
      toast.success(accept ? 'Коллаборация принята!' : 'Запрос отклонён');
      await loadData();
    } else {
      toast.error(result.error || 'Ошибка');
    }
    return result.success;
  }, [loadData]);

  const removeCollab = useCallback(async (collabId: string) => {
    const success = await deleteCollab(collabId);
    if (success) {
      toast.success('Коллаборация удалена');
      await loadData();
    }
    return success;
  }, [loadData]);

  // Team actions
  const createNewTeam = useCallback(async (name: string, slug: string, description?: string, niche?: string) => {
    const result = await createTeam(name, slug, description, niche);
    if (result.success) {
      toast.success('Команда создана!');
      await loadData();
    } else {
      toast.error(result.error || 'Ошибка создания команды');
    }
    return result;
  }, [loadData]);

  const inviteMember = useCallback(async (teamId: string, userId: string, role?: string) => {
    const result = await inviteToTeam(teamId, userId, role);
    if (result.success) {
      toast.success('Пользователь приглашён в команду!');
    } else {
      toast.error(result.error || 'Ошибка приглашения');
    }
    return result.success;
  }, []);

  const leave = useCallback(async (teamId: string) => {
    const success = await leaveTeam(teamId);
    if (success) {
      toast.success('Вы покинули команду');
      await loadData();
    }
    return success;
  }, [loadData]);

  const removeTeam = useCallback(async (teamId: string) => {
    const success = await deleteTeam(teamId);
    if (success) {
      toast.success('Команда удалена');
      await loadData();
    }
    return success;
  }, [loadData]);

  // Shoutout actions
  const addShoutout = useCallback(async (toUserId: string, message?: string) => {
    const result = await createShoutout(toUserId, message);
    if (result.success) {
      toast.success('Шаут-аут добавлен!');
      await loadData();
    } else {
      toast.error(result.error || 'Ошибка');
    }
    return result.success;
  }, [loadData]);

  const removeShoutout = useCallback(async (shoutoutId: string) => {
    const success = await deleteShoutout(shoutoutId);
    if (success) {
      toast.success('Шаут-аут удалён');
      await loadData();
    }
    return success;
  }, [loadData]);

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
