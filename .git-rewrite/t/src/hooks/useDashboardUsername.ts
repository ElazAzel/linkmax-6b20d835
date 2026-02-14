import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
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
      toast.error('User not authenticated');
      return false;
    }

    const trimmed = usernameInput.trim();
    if (!trimmed) {
      toast.error('Please enter a username');
      return false;
    }

    // Validate before API call
    const validation = validateUsername(trimmed);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid username');
      return false;
    }

    setSaving(true);

    try {
      const result = await updateUsernameService(userId, trimmed);

      if (!result.success) {
        toast.error(result.error || 'Failed to update username');
        return false;
      }

      toast.success('Username updated successfully!');
      await onSaveSuccess();
      return true;
    } catch (error) {
      toast.error('Failed to update username');
      console.error('Username update error:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId, usernameInput, onSaveSuccess]);

  return {
    usernameInput,
    setUsernameInput: handleUsernameChange,
    saving,
    handleUpdateUsername,
  };
}
