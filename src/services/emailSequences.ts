import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface EmailSequence {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  template_id: string;
  delay_hours: number;
  step_order: number;
}

export const emailSequencesService = {
  async listSequences(options?: { page?: number; pageSize?: number }) {
    try {
      const page = options?.page || 0;
      const pageSize = options?.pageSize || 25;
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('email_sequences')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: data as EmailSequence[], total: count || 0, error: null };
    } catch (error) {
      logger.error('Error listing email sequences', error);
      return { data: null, total: 0, error };
    }
  },

  async getSequenceDetails(id: string) {
    try {
      const { data: sequence, error: seqError } = await supabase
        .from('email_sequences')
        .select('*')
        .eq('id', id)
        .single();

      if (seqError) throw seqError;

      const { data: steps, error: stepsError } = await supabase
        .from('email_sequence_steps')
        .select('*, template:email_templates(*)')
        .eq('sequence_id', id)
        .order('step_order', { ascending: true });

      if (stepsError) throw stepsError;

      return { 
        data: { 
          ...sequence as EmailSequence, 
          steps: steps || [] 
        }, 
        error: null 
      };
    } catch (error) {
      logger.error('Error getting email sequence details', error);
      return { data: null, error };
    }
  },

  async createSequence(name: string, description?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('email_sequences')
        .insert({
          name,
          description,
          user_id: user.id,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as EmailSequence, error: null };
    } catch (error) {
      logger.error('Error creating email sequence', error);
      return { data: null, error };
    }
  },

  async addStep(sequenceId: string, templateId: string, delayHours: number, order: number) {
    try {
      const { data, error } = await supabase
        .from('email_sequence_steps')
        .insert({
          sequence_id: sequenceId,
          template_id: templateId,
          delay_hours: delayHours,
          step_order: order
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as SequenceStep, error: null };
    } catch (error) {
      logger.error('Error adding sequence step', error);
      return { data: null, error };
    }
  },

  async deleteSequence(id: string) {
    try {
      const { error } = await supabase
        .from('email_sequences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      logger.error('Error deleting email sequence', error);
      return { error };
    }
  },

  async updateStatus(id: string, status: EmailSequence['status']) {
    try {
      const { error } = await supabase
        .from('email_sequences')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      logger.error('Error updating sequence status', error);
      return { error };
    }
  }
};
