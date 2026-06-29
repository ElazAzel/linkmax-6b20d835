import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireCronAuth } from "../_shared/cron-auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendMessage, isConfigured } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Automation {
  id: string;
  user_id: string;
  automation_type: 'follow_up' | 'time_clarification' | 'review_request';
  trigger_hours: number;
  template_message: string;
}

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  user_id: string;
  created_at: string;
  last_automation_check: string | null;
  automation_sent_count: number;
}

interface UserProfile {
  telegram_chat_id: string | null;
  telegram_notifications_enabled: boolean;
  display_name: string | null;
  username: string | null;
}

// Send Telegram message
async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  if (!isConfigured()) {
    console.log("Telegram gateway not configured");
    return false;
  }

  try {
    await sendMessage(chatId, message, { parse_mode: "Markdown" });
    return true;
  } catch (error) {
    console.error("Telegram send error:", error);
    return false;
  }
}

// Process template message with variables
function processTemplate(template: string, lead: Lead, profile: UserProfile): string {
  return template
    .replace(/\{lead_name\}/g, lead.name)
    .replace(/\{owner_name\}/g, profile.display_name || profile.username || 'Мастер')
    .replace(/\{lead_email\}/g, lead.email || '')
    .replace(/\{lead_phone\}/g, lead.phone || '');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting CRM automation processing...");
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all enabled automations
    const { data: automations, error: autoError } = await supabase
      .from('crm_automations')
      .select('*')
      .eq('is_enabled', true);

    if (autoError) {
      console.error("Error fetching automations:", autoError);
      throw autoError;
    }

    if (!automations || automations.length === 0) {
      console.log("No enabled automations found");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${automations.length} enabled automations`);

    let processedCount = 0;
    let sentCount = 0;

    for (const automation of automations as Automation[]) {
      // Get user profile for Telegram chat ID
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('telegram_chat_id, telegram_notifications_enabled, display_name, username')
        .eq('id', automation.user_id)
        .maybeSingle();

      if (profileError || !profile?.telegram_chat_id || !profile.telegram_notifications_enabled) {
        console.log(`Skipping automation ${automation.id}: Telegram not configured for user`);
        continue;
      }

      // Calculate cutoff time
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - automation.trigger_hours);

      // Find leads that match automation criteria
      let query = supabase
        .from('leads')
        .select('*')
        .eq('user_id', automation.user_id)
        .lt('created_at', cutoffTime.toISOString())
        .or(`last_automation_check.is.null,last_automation_check.lt.${cutoffTime.toISOString()}`);

      // Apply status filter based on automation type
      switch (automation.automation_type) {
        case 'follow_up':
          query = query.eq('status', 'new');
          break;
        case 'time_clarification':
          query = query.in('status', ['new', 'contacted']);
          break;
        case 'review_request':
          query = query.eq('status', 'converted');
          break;
      }

      const { data: leads, error: leadsError } = await query.limit(10);

      if (leadsError) {
        console.error(`Error fetching leads for automation ${automation.id}:`, leadsError);
        continue;
      }

      if (!leads || leads.length === 0) {
        continue;
      }

      console.log(`Processing ${leads.length} leads for automation ${automation.id} (${automation.automation_type})`);

      for (const lead of leads as Lead[]) {
        // Skip if already sent too many automations
        if (lead.automation_sent_count >= 3) {
          console.log(`Skipping lead ${lead.id}: max automations reached`);
          continue;
        }

        processedCount++;

        // Generate message from template
        const message = processTemplate(automation.template_message, lead, profile);

        // Send notification to page owner about the lead
        let ownerMessage = '';
        switch (automation.automation_type) {
          case 'follow_up':
            ownerMessage = `🔔 *Напоминание о лиде*\n\n👤 ${lead.name}\n`;
            if (lead.email) ownerMessage += `📧 ${lead.email}\n`;
            if (lead.phone) ownerMessage += `📱 ${lead.phone}\n`;
            ownerMessage += `\n💡 _${message}_`;
            break;
          case 'time_clarification':
            ownerMessage = `📅 *Уточните время*\n\n👤 ${lead.name} интересуется услугой\n`;
            if (lead.phone) ownerMessage += `📱 ${lead.phone}\n`;
            ownerMessage += `\n💡 _${message}_`;
            break;
          case 'review_request':
            ownerMessage = `⭐ *Запрос отзыва*\n\n👤 ${lead.name} завершил сделку\n`;
            ownerMessage += `\n💡 _${message}_`;
            break;
        }

        const sent = await sendTelegramMessage(profile.telegram_chat_id!, ownerMessage);

        // Log the automation
        await supabase.from('automation_logs').insert({
          automation_id: automation.id,
          lead_id: lead.id,
          status: sent ? 'sent' : 'failed',
          sent_at: sent ? new Date().toISOString() : null,
          error_message: sent ? null : 'Failed to send Telegram message'
        });

        // Update lead
        await supabase
          .from('leads')
          .update({
            last_automation_check: new Date().toISOString(),
            automation_sent_count: (lead.automation_sent_count || 0) + 1
          })
          .eq('id', lead.id);

        if (sent) {
          sentCount++;
        }
      }
    }

    console.log(`Automation processing complete. Processed: ${processedCount}, Sent: ${sentCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        sent: sentCount 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing CRM automations:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
