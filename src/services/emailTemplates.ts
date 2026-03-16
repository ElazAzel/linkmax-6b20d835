import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  content_html: string;
  created_at: string;
  updated_at: string;
}

export const emailTemplatesService = {
  async listTemplates() {
    try {
      const { data, error } = await (supabase as any)
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as EmailTemplate[], error: null };
    } catch (error) {
      logger.error('Error listing email templates', error);
      return { data: null, error };
    }
  },

  async getTemplate(id: string) {
    try {
      const { data, error } = await (supabase as any)
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data: data as EmailTemplate, error: null };
    } catch (error) {
      logger.error('Error getting email template', error);
      return { data: null, error };
    }
  },

  async createTemplate(template: Omit<EmailTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await (supabase as any)
        .from('email_templates')
        .insert({
          ...template,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as EmailTemplate, error: null };
    } catch (error) {
      logger.error('Error creating email template', error);
      return { data: null, error };
    }
  },

  async updateTemplate(id: string, updates: Partial<EmailTemplate>) {
    try {
      const { data, error } = await (supabase as any)
        .from('email_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as EmailTemplate, error: null };
    } catch (error) {
      logger.error('Error updating email template', error);
      return { data: null, error };
    }
  },

  async deleteTemplate(id: string) {
    try {
      const { error } = await (supabase as any)
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      logger.error('Error deleting email template', error);
      return { error };
    }
  }
};
