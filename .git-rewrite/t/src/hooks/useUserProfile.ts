import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUsername = async (username: string): Promise<boolean> => {
    if (!userId) return false;

    // Validate username format
    const usernameRegex = /^[a-z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      toast.error('Username can only contain lowercase letters, numbers, hyphens, and underscores');
      return false;
    }

    if (username.length < 3 || username.length > 30) {
      toast.error('Username must be between 3 and 30 characters');
      return false;
    }

    setSaving(true);

    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username)
        .neq('id', userId)
        .maybeSingle();

      if (existingUser) {
        toast.error('This username is already taken');
        setSaving(false);
        return false;
      }

      // Update username
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          username: username.toLowerCase(),
        });

      if (error) {
        toast.error('Failed to update username');
        console.error('Error updating username:', error);
        setSaving(false);
        return false;
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, username: username.toLowerCase() } : null);
      
      // Also update the page slug
      await supabase
        .from('pages')
        .update({ slug: username.toLowerCase() })
        .eq('user_id', userId);

      toast.success('Username updated successfully!');
      setSaving(false);
      return true;
    } catch (error) {
      toast.error('Failed to update username');
      console.error('Error updating username:', error);
      setSaving(false);
      return false;
    }
  };

  return {
    profile,
    loading,
    saving,
    updateUsername,
    refresh: loadProfile,
  };
}
