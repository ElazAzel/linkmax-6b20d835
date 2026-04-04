import { supabase } from '@/platform/supabase/client';
import type { Lead } from '@/hooks/crm/useLeads';
import type { ZoneDeal } from '@/types/zones';

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
      .select('status, value_amount')
      .eq('user_id', userId)
      .gte('created_at', monthStartISO);

    // 2. Fetch Zone Deals
    const { data: zoneDeals } = await supabase
      .from('zone_deals')
      .select('status, value_amount')
      .eq('zone_id', (await this.getPrimaryZoneId(userId)) || '')
      .is('deleted_at', null);

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
    
    const pipelineValue = allLeads.reduce((sum: number, l: any) => sum + (Number(l.value_amount) || 0), 0) +
                         (zoneDeals || []).reduce((sum, d) => sum + (Number(d.value_amount) || 0), 0);

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
       console.log(`CRM: Lead ${leadId} successfully converted.`);
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
  }): Promise<{ data: any; error: any }> {
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        user_id: data.userId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        notes: data.notes || null,
        source: (data.source as any) || 'form',
        status: 'new',
        metadata: data.metadata || {},
      })
      .select()
      .single();

    return { data: lead, error };
  }

  private static async getPrimaryZoneId(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('zones')
      .select('id')
      .eq('owner_id', userId)
      .limit(1)
      .single();
    return data?.id || null;
  }
}
