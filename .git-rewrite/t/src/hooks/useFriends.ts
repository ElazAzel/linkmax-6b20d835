import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  type Friendship
} from '@/services/friends';

export function useFriends() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFriends = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const [friendsData, pendingData, sentData] = await Promise.all([
        getFriends(),
        getPendingRequests(),
        getSentRequests()
      ]);

      setFriends(friendsData);
      setPendingRequests(pendingData);
      setSentRequests(sentData);
    } catch (error) {
      logger.error('Failed to load friends:', error, { context: 'useFriends' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const handleSendRequest = useCallback(async (friendId: string) => {
    const result = await sendFriendRequest(friendId);
    if (result.success) {
      toast.success(t('friends.requestSent', 'Запрос в друзья отправлен'));
      loadFriends();
    } else {
      const errorMessages: Record<string, string> = {
        cannot_add_self: t('friends.errors.cannotAddSelf', 'Нельзя добавить себя в друзья'),
        friendship_exists: t('friends.errors.friendshipExists', 'Вы уже друзья или запрос отправлен'),
        not_authenticated: t('friends.errors.notAuthenticated', 'Необходимо войти в аккаунт'),
      };
      toast.error(errorMessages[result.error || ''] || t('friends.errors.sendRequest', 'Ошибка отправки запроса'));
    }
    return result;
  }, [loadFriends, t]);

  const handleAcceptRequest = useCallback(async (friendshipId: string) => {
    const result = await acceptFriendRequest(friendshipId);
    if (result.success) {
      toast.success(t('friends.requestAccepted', 'Запрос принят!'));
      loadFriends();
    } else {
      toast.error(t('friends.errors.acceptRequest', 'Ошибка принятия запроса'));
    }
    return result;
  }, [loadFriends, t]);

  const handleRejectRequest = useCallback(async (friendshipId: string) => {
    const result = await rejectFriendRequest(friendshipId);
    if (result.success) {
      toast.success(t('friends.requestRejected', 'Запрос отклонён'));
      loadFriends();
    } else {
      toast.error(t('friends.errors.rejectRequest', 'Ошибка отклонения запроса'));
    }
    return result;
  }, [loadFriends, t]);

  const handleRemoveFriend = useCallback(async (friendshipId: string) => {
    const result = await removeFriend(friendshipId);
    if (result.success) {
      toast.success(t('friends.friendRemoved', 'Друг удалён'));
      loadFriends();
    } else {
      toast.error(t('friends.errors.removeFriend', 'Ошибка удаления'));
    }
    return result;
  }, [loadFriends, t]);

  const handleSearchUsers = useCallback(async (query: string) => {
    return searchUsers(query);
  }, []);

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    refresh: loadFriends,
    sendRequest: handleSendRequest,
    acceptRequest: handleAcceptRequest,
    rejectRequest: handleRejectRequest,
    removeFriend: handleRemoveFriend,
    searchUsers: handleSearchUsers,
    friendsCount: friends.length,
    pendingCount: pendingRequests.length
  };
}
