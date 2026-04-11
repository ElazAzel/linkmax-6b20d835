import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface ExportDataResult {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * GDPR Service - handles user data export and account deletion
 */
export const gdprService = {
  async exportUserData(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      logger.info('GDPR: Requesting user data export');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      // Gather user data from accessible tables
      const [profiles, pages, leads] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', user.id).single(),
        supabase.from('pages').select('*').eq('user_id', user.id),
        supabase.from('leads').select('*').eq('user_id', user.id),
      ]);

      return {
        success: true,
        data: {
          profile: profiles.data,
          pages: pages.data,
          leads: leads.data,
          email: user.email,
          created_at: user.created_at,
        },
      };
    } catch (error) {
      logger.error('GDPR: Unexpected error during export', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      logger.warn('GDPR: Requesting account deletion');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      // Delete user-owned data (cascades handle related records)
      await supabase.from('pages').delete().eq('user_id', user.id);
      await supabase.from('leads').delete().eq('user_id', user.id);
      await supabase.from('user_profiles').delete().eq('id', user.id);

      // Sign out
      await supabase.auth.signOut();
      
      return { success: true };
    } catch (error) {
      logger.error('GDPR: Unexpected error during deletion', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
};
