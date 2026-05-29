import { supabase } from '@/platform/supabase/client';
import type { Lead } from '@/hooks/crm/useLeads';
import type { ZoneDeal } from '@/types/zones';
import { logger } from '@/lib/utils/logger';

export interface CrmMetrics {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  pipelineValue: number;
  averageCheck: number;
  activeBookings: number;
}

export class CrmService {
  /**
   * Calculate aggregated CRM metrics for a user
   */
  static async getMetrics(userId: string): Promise<CrmMetrics> {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthStartISO = monthStart.toISOString();

    // 1. Fetch Leads
    const { data: leads } = await supabase
      .from('leads')
      .select('status')
      .eq('user_id', userId)
      .gte('created_at', monthStartISO);

    // 2. Fetch Zone Deals (only if user has a zone)
    const primaryZoneId = await this.getPrimaryZoneId(userId);
    let zoneDeals: any[] | null = null;
    if (primaryZoneId) {
      const { data } = await supabase
        .from('zone_deals')
        .select('status, value_amount')
        .eq('zone_id', primaryZoneId)
        .is('deleted_at', null);
      zoneDeals = data;
    }

    // 3. Fetch Bookings count
    const { count: activeBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .gte('start_time', new Date().toISOString());

    const allLeads = (leads || []) as any[];
    const totalLeads = allLeads.length;
    const convertedLeads = allLeads.filter((l: any) => l.status === 'converted' || l.status === 'qualified').length;
    
    const pipelineValue = (zoneDeals || []).reduce((sum: number, d: any) => sum + (Number(d.value_amount) || 0), 0);

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const averageCheck = convertedLeads > 0 ? pipelineValue / convertedLeads : 0;

    return {
      totalLeads,
      convertedLeads,
      conversionRate,
      pipelineValue,
      averageCheck,
      activeBookings: activeBookings || 0
    };
  }

  /**
   * Centralized transition logic with side effects
   */
  static async transitionLeadStatus(leadId: string, newStatus: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus as any, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) throw error;

    // Trigger side effects
    if (newStatus === 'converted') {
      // Could trigger automation or specific analytics event
      logger.info(`Lead ${leadId} successfully converted`, { context: 'crm-service' });
    }
  }

  /**
   * Create a lead from a public source (like chatbot)
   */
  static async createPublicLead(data: {
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
    source?: string;
    metadata?: any;
    pageId?: string;
    blockId?: string;
    formData?: Record<string, any>;
  }): Promise<{ data: any; error: any }> {
    // Prepare payload compatible with both legacy and new schema
    const payload = {
      user_id: data.userId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      notes: data.notes || null,
      source: (data.source as any) || 'form',
      status: 'new',
      // form_data is used in the 2026-02-20 schema
      form_data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        ...data.formData
      },
      // metadata is used in the 2025-12-06 schema
      metadata: data.metadata || {},
      page_id: data.pageId || null,
      block_id: data.blockId || null,
    };

    const { data: lead, error } = await supabase
      .from('leads')
      .insert(payload as any)
      .select()
      .single();

    if (lead && !error) {
      this.notifyExpert(lead as any);
    }

    return { data: lead, error };
  }

  /**
   * Send Telegram notification to the expert/owner
   */
  private static async notifyExpert(lead: Lead): Promise<void> {
    try {
      // 1. Fetch expert's Telegram settings
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('telegram_notifications_enabled, telegram_chat_id, display_name')
        .eq('id', lead.user_id)
        .maybeSingle();

      if (!profile?.telegram_notifications_enabled || !profile?.telegram_chat_id) {
        return;
      }

      // 2. Prepare AI Insights
      const intent = lead.metadata?.intent === 'commercial' ? '🔥 Коммерческий интерес' : 'ℹ️ Инфо-запрос';
      const lastQuery = lead.metadata?.last_query || '—';
      const crmLink = `https://lnkmx.my/crm?lead=${lead.id}`;

      // 3. Invoke Edge Function
      await supabase.functions.invoke('send-social-notification', {
        body: {
          type: 'new_chatbot_lead',
          recipientId: lead.user_id,
          data: {
            name: lead.name,
            phone: lead.phone || '—',
            intent,
            query: lastQuery,
            link: crmLink
          }
        }
      });
    } catch (e) {
      logger.error('Failed to notify expert via Telegram', e, { context: 'crm-service' });
    }
  }

  private static async getPrimaryZoneId(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('zones')
      .select('id')
      .eq('owner_user_id', userId)
      .limit(1)
      .maybeSingle();
    return data?.id || null;
  }
}
