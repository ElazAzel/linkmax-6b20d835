import { useState, useEffect, useCallback } from 'react';
import { 
  loadUserProfile, 
  updateEmailNotifications, 
  updateTelegramNotifications,
  type UserProfile 
} from '@/services/user';
import { toast } from 'sonner';

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await loadUserProfile(userId);
      if (!error) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleUpdateEmailNotifications = useCallback(async (enabled: boolean) => {
    if (!userId) return;
    
    setSaving(true);
    try {
      const { error } = await updateEmailNotifications(userId, enabled);
      if (error) {
        toast.error('Failed to update notification settings');
        return;
      }
      
      setProfile(prev => prev ? { ...prev, email_notifications_enabled: enabled } : null);
      toast.success(enabled ? 'Email notifications enabled' : 'Email notifications disabled');
    } catch (error) {
      console.error('Error updating email notifications:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  }, [userId]);

  const handleUpdateTelegramNotifications = useCallback(async (enabled: boolean, chatId: string | null) => {
    if (!userId) return;
    
    setSaving(true);
    try {
      const { error } = await updateTelegramNotifications(userId, enabled, chatId);
      if (error) {
        toast.error('Failed to update Telegram settings');
        return;
      }
      
      setProfile(prev => prev ? { 
        ...prev, 
        telegram_notifications_enabled: enabled,
        telegram_chat_id: chatId
      } : null);
      toast.success(enabled ? 'Telegram notifications enabled' : 'Telegram notifications disabled');
    } catch (error) {
      console.error('Error updating Telegram notifications:', error);
      toast.error('Failed to update Telegram settings');
    } finally {
      setSaving(false);
    }
  }, [userId]);

  return {
    profile,
    loading,
    saving,
    setSaving,
    setProfile,
    refresh: loadProfile,
    updateEmailNotifications: handleUpdateEmailNotifications,
    updateTelegramNotifications: handleUpdateTelegramNotifications,
  };
}
