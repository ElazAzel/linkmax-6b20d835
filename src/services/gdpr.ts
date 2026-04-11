import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface ExportDataResult {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * GDPR Service - handles user data export and account deletion
 * Wraps RPC calls implemented in the 20260218200001_gdpr_compliance.sql migration
 */
export const gdprService = {
  /**
   * Request all personal data stored in LinkMAX
   * Triggers a secure export via the database RPC
   */
  async exportUserData(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      logger.info('GDPR: Requesting user data export');
      
      const { data, error } = await supabase.rpc('export_user_data');
      
      if (error) {
        logger.error('GDPR: Export failed', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      logger.error('GDPR: Unexpected error during export', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  /**
   * Permanently delete user account and all associated data
   * This is IRREVERSIBLE.
   */
  async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      logger.warn('GDPR: Requesting account deletion');
      
      const { data, error } = await supabase.rpc('delete_user_account');
      
      if (error) {
        logger.error('GDPR: Deletion failed', error);
        return { success: false, error: error.message };
      }
      
      // If successful, sign out the user
      await supabase.auth.signOut();
      
      return { success: true };
    } catch (error) {
      logger.error('GDPR: Unexpected error during deletion', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
};
