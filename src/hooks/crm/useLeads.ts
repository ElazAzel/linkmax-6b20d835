import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';
import { useAuth } from '@/hooks/user/useAuth';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trackLeadReplied, trackLeadStatusChanged } from '@/lib/activation-events';

import type { AppDatabase } from '@/platform/supabase/extended-types';

export type Lead = AppDatabase['public']['Tables']['leads']['Row'];
export type LeadStatus = Lead['status'];
export type LeadSource = Lead['source'];
export type LeadInteraction = AppDatabase['public']['Tables']['lead_interactions']['Row'];
export type InteractionType = LeadInteraction['type'];
type LeadUpdate = AppDatabase['public']['Tables']['leads']['Update'];

function getLeadPageId(lead: Lead | undefined): string | null {
  const metadata = lead?.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  const pageId = (metadata as Record<string, unknown>).page_id;
  return typeof pageId === 'string' ? pageId : null;
}

export function useLeads() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchLeads = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      logger.error('Error fetching leads', error, { context: 'useLeads' });
      toast.error(t('toasts.leads.loadError'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const createLead = async (leadData: Partial<Lead>) => {
    if (!user) return null;

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('leads')
        .insert({
          user_id: user.id,
          name: leadData.name || '',
          email: leadData.email || null,
          phone: leadData.phone || null,
          source: leadData.source ?? 'manual',
          status: leadData.status ?? 'new',
          notes: leadData.notes || null,
          metadata: leadData.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setLeads(prev => [data, ...prev]);
        toast.success(t('toasts.leads.created'));
      }
      return data;
    } catch (error) {
      logger.error('Error creating lead', error, { context: 'useLeads' });
      toast.error(t('toasts.leads.createError'));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (!user) return false;

    try {
      setSaving(true);
      const previousLead = leads.find(lead => lead.id === id);
      const { error } = await supabase
        .from('leads')
        .update(updates as LeadUpdate)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setLeads(prev => prev.map(lead =>
        lead.id === id ? { ...lead, ...updates } : lead
      ));

      if (updates.status && previousLead && previousLead.status !== updates.status) {
        const pageId = getLeadPageId(previousLead);
        if (pageId) {
          trackLeadStatusChanged(pageId, id, String(previousLead.status), String(updates.status));
        }
      }

      toast.success(t('toasts.leads.updated'));
      return true;
    } catch (error) {
      logger.error('Error updating lead', error, { context: 'useLeads', data: { leadId: id } });
      toast.error(t('toasts.leads.updateError'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  /** Quick reply: auto-set status to contacted (silent, no toast) */
  const quickReply = async (id: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'contacted' })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      setLeads(prev => prev.map(lead =>
        lead.id === id ? { ...lead, status: 'contacted' } : lead
      ));

      const previousLead = leads.find(lead => lead.id === id);
      const pageId = getLeadPageId(previousLead);
      if (pageId) {
        trackLeadReplied(pageId, id, 'quick_reply');
      }

      return true;
    } catch (error) {
      logger.error('Error quick-replying lead', error, { context: 'useLeads', data: { leadId: id } });
      return false;
    }
  };

  const deleteLead = async (id: string) => {
    if (!user) return false;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast.success(t('toasts.leads.deleted'));
      return true;
    } catch (error) {
      logger.error('Error deleting lead', error, { context: 'useLeads', data: { leadId: id } });
      toast.error(t('toasts.leads.deleteError'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getLeadStats = () => {
    const stats = {
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      converted: leads.filter(l => l.status === 'converted').length,
      lost: leads.filter(l => l.status === 'lost').length,
    };
    return stats;
  };

  return {
    leads,
    loading,
    saving,
    createLead,
    updateLead,
    deleteLead,
    refreshLeads: fetchLeads,
    quickReply,
    getLeadStats,
  };
}

export function useLeadInteractions(leadId: string | null) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [interactions, setInteractions] = useState<LeadInteraction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInteractions = useCallback(async () => {
    if (!user || !leadId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_interactions')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInteractions(data || []);
    } catch (error) {
      logger.error('Error fetching interactions', error, { context: 'useLeads', data: { leadId } });
    } finally {
      setLoading(false);
    }
  }, [user, leadId]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const addInteraction = async (type: InteractionType, content: string) => {
    if (!user || !leadId) return null;

    try {
      const { data, error } = await supabase
        .from('lead_interactions')
        .insert({
          lead_id: leadId,
          user_id: user.id,
          type,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setInteractions(prev => [data, ...prev]);
      }
      return data;
    } catch (error) {
      logger.error('Error adding interaction', error, { context: 'useLeads', data: { leadId } });
      toast.error(t('toasts.leads.interactionError'));
      return null;
    }
  };

  return {
    interactions,
    loading,
    addInteraction,
    refreshInteractions: fetchInteractions,
  };
}
