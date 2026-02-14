import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type LeadSource = 'page_view' | 'form' | 'messenger' | 'manual' | 'other';
export type InteractionType = 'note' | 'call' | 'email' | 'message' | 'meeting';

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  status: LeadStatus;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LeadInteraction {
  id: string;
  lead_id: string;
  user_id: string;
  type: InteractionType;
  content: string;
  created_at: string;
}

export function useLeads() {
  const { user } = useAuth();
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
      setLeads((data as Lead[]) || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [user]);

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
          source: leadData.source || 'manual',
          status: leadData.status || 'new',
          notes: leadData.notes || null,
          metadata: leadData.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      
      setLeads(prev => [data as Lead, ...prev]);
      toast.success('Lead created');
      return data as Lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Failed to create lead');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (!user) return false;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setLeads(prev => prev.map(lead => 
        lead.id === id ? { ...lead, ...updates } : lead
      ));
      toast.success('Lead updated');
      return true;
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
      return false;
    } finally {
      setSaving(false);
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
      toast.success('Lead deleted');
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
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
    getLeadStats,
  };
}

export function useLeadInteractions(leadId: string | null) {
  const { user } = useAuth();
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
      setInteractions((data as LeadInteraction[]) || []);
    } catch (error) {
      console.error('Error fetching interactions:', error);
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
      
      setInteractions(prev => [data as LeadInteraction, ...prev]);
      return data as LeadInteraction;
    } catch (error) {
      console.error('Error adding interaction:', error);
      toast.error('Failed to add interaction');
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
