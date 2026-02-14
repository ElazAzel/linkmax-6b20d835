import { useState, useEffect, useCallback } from 'react';
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
      console.error('Failed to load friends:', error);
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
      toast.success('Запрос в друзья отправлен');
      loadFriends();
    } else {
      const errorMessages: Record<string, string> = {
        cannot_add_self: 'Нельзя добавить себя в друзья',
        friendship_exists: 'Вы уже друзья или запрос отправлен',
        not_authenticated: 'Необходимо войти в аккаунт'
      };
      toast.error(errorMessages[result.error || ''] || 'Ошибка отправки запроса');
    }
    return result;
  }, [loadFriends]);

  const handleAcceptRequest = useCallback(async (friendshipId: string) => {
    const result = await acceptFriendRequest(friendshipId);
    if (result.success) {
      toast.success('Запрос принят!');
      loadFriends();
    } else {
      toast.error('Ошибка принятия запроса');
    }
    return result;
  }, [loadFriends]);

  const handleRejectRequest = useCallback(async (friendshipId: string) => {
    const result = await rejectFriendRequest(friendshipId);
    if (result.success) {
      toast.success('Запрос отклонён');
      loadFriends();
    } else {
      toast.error('Ошибка отклонения запроса');
    }
    return result;
  }, [loadFriends]);

  const handleRemoveFriend = useCallback(async (friendshipId: string) => {
    const result = await removeFriend(friendshipId);
    if (result.success) {
      toast.success('Друг удалён');
      loadFriends();
    } else {
      toast.error('Ошибка удаления');
    }
    return result;
  }, [loadFriends]);

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
