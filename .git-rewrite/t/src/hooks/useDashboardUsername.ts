import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useTranslation } from 'react-i18next';
import { updateUsername as updateUsernameService, validateUsername } from '@/services/user';

interface UseDashboardUsernameOptions {
  userId: string | undefined;
  initialUsername: string | null | undefined;
  onSaveSuccess: () => Promise<void>;
}

/**
 * Hook to manage username editing in the dashboard
 */
export function useDashboardUsername({
  userId,
  initialUsername,
  onSaveSuccess,
}: UseDashboardUsernameOptions) {
  const { t } = useTranslation();
  const [usernameInput, setUsernameInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize from profile
  useEffect(() => {
    if (initialUsername) {
      setUsernameInput(initialUsername);
    }
  }, [initialUsername]);

  const handleUsernameChange = useCallback((value: string) => {
    // Normalize input: lowercase, only allowed characters
    const normalized = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setUsernameInput(normalized);
  }, []);

  const handleUpdateUsername = useCallback(async () => {
    if (!userId) {
      toast.error(t('toasts.username.authRequired'));
      return false;
    }

    const trimmed = usernameInput.trim();
    if (!trimmed) {
      toast.error(t('toasts.username.enterUsername'));
      return false;
    }

    // Validate before API call
    const validation = validateUsername(trimmed);
    if (!validation.valid) {
      toast.error(validation.error || t('toasts.username.invalid'));
      return false;
    }

    setSaving(true);

    try {
      const result = await updateUsernameService(userId, trimmed);

      if (!result.success) {
        toast.error(result.error || t('toasts.username.updateError'));
        return false;
      }

      toast.success(t('toasts.username.updated'));
      await onSaveSuccess();
      return true;
    } catch (error) {
      toast.error(t('toasts.username.updateError'));
      logger.error('Username update error:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId, usernameInput, onSaveSuccess, t]);

  return {
    usernameInput,
    setUsernameInput: handleUsernameChange,
    saving,
    handleUpdateUsername,
  };
}
