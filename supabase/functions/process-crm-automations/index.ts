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

interface Booking {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  owner_id: string;
  page_id: string;
  slot_date: string;
  slot_time: string;
  completed_at: string | null;
}

interface UserProfile {
  telegram_chat_id: string | null;
  telegram_notifications_enabled: boolean;
  display_name: string | null;
  username: string | null;
}

interface ReviewRequestRpcResult {
  success: boolean;
  error?: string;
  review_request?: {
    id?: string;
    status?: string;
    booking_id?: string;
    expires_at?: string;
    token?: string;
    path?: string;
  };
}

interface ExistingReviewRequest {
  id: string;
  status: string;
  metadata: Record<string, unknown> | null;
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

function getAppOrigin(): string {
  return (
    Deno.env.get("PUBLIC_SITE_URL") ||
    Deno.env.get("SITE_URL") ||
    Deno.env.get("APP_URL") ||
    "https://lnkmx.my"
  ).replace(/\/+$/, "");
}

function buildReviewRequestUrl(pathOrToken: string): string {
  const path = pathOrToken.startsWith("/")
    ? pathOrToken
    : `/review/request/${encodeURIComponent(pathOrToken)}`;

  return `${getAppOrigin()}${path}`;
}

function processBookingTemplate(
  template: string,
  booking: Booking,
  profile: UserProfile,
  reviewRequestUrl: string
): string {
  return template
    .replace(/\{lead_name\}/g, booking.client_name)
    .replace(/\{owner_name\}/g, profile.display_name || profile.username || 'Мастер')
    .replace(/\{lead_email\}/g, booking.client_email || '')
    .replace(/\{lead_phone\}/g, booking.client_phone || '')
    .replace(/\{booking_date\}/g, booking.slot_date)
    .replace(/\{booking_time\}/g, booking.slot_time.slice(0, 5))
    .replace(/\{review_request_url\}/g, reviewRequestUrl);
}

async function insertBookingAutomationLog(
  supabase: ReturnType<typeof createClient>,
  automationId: string,
  bookingId: string,
  status: 'sent' | 'failed' | 'skipped',
  errorMessage: string | null = null
): Promise<void> {
  await supabase.from('automation_logs').insert({
    automation_id: automationId,
    booking_id: bookingId,
    lead_id: null,
    status,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
    error_message: errorMessage,
  });
}

async function processReviewRequestAutomation(
  supabase: ReturnType<typeof createClient>,
  automation: Automation,
  profile: UserProfile,
  cutoffTime: Date
): Promise<{ processed: number; sent: number }> {
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, client_name, client_email, client_phone, owner_id, page_id, slot_date, slot_time, completed_at')
    .eq('owner_id', automation.user_id)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .lt('completed_at', cutoffTime.toISOString())
    .order('completed_at', { ascending: true })
    .limit(10);

  if (bookingsError) {
    console.error(`Error fetching completed bookings for automation ${automation.id}:`, bookingsError);
    return { processed: 0, sent: 0 };
  }

  if (!bookings || bookings.length === 0) {
    return { processed: 0, sent: 0 };
  }

  let processed = 0;
  let sent = 0;

  for (const booking of bookings as Booking[]) {
    const { data: existingLogs } = await supabase
      .from('automation_logs')
      .select('id')
      .eq('automation_id', automation.id)
      .eq('booking_id', booking.id)
      .in('status', ['sent', 'skipped'])
      .limit(1);

    if (existingLogs && existingLogs.length > 0) {
      continue;
    }

    const { count: failedAttempts } = await supabase
      .from('automation_logs')
      .select('id', { count: 'exact', head: true })
      .eq('automation_id', automation.id)
      .eq('booking_id', booking.id)
      .eq('status', 'failed');

    if ((failedAttempts || 0) >= 3) {
      await insertBookingAutomationLog(supabase, automation.id, booking.id, 'skipped', 'max_attempts_reached');
      continue;
    }

    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking.id)
      .limit(1);

    if (existingReviews && existingReviews.length > 0) {
      await insertBookingAutomationLog(supabase, automation.id, booking.id, 'skipped', 'review_already_exists');
      continue;
    }

    const { data: existingRequest } = await supabase
      .from('review_requests')
      .select('id, status, metadata')
      .eq('booking_id', booking.id)
      .in('status', ['pending', 'used'])
      .maybeSingle();

    const currentRequest = existingRequest as ExistingReviewRequest | null;
    if (currentRequest?.status === 'used') {
      await insertBookingAutomationLog(supabase, automation.id, booking.id, 'skipped', 'review_request_already_exists');
      continue;
    }

    if (
      currentRequest?.status === 'pending' &&
      (
        currentRequest.metadata?.source !== 'crm_automation' ||
        currentRequest.metadata?.automation_id !== automation.id
      )
    ) {
      await insertBookingAutomationLog(supabase, automation.id, booking.id, 'skipped', 'review_request_already_exists');
      continue;
    }

    processed++;

    const { data: requestResult, error: requestError } = await supabase.rpc('create_booking_review_request', {
      p_booking_id: booking.id,
      p_expires_in: '14 days',
      p_metadata: {
        source: 'crm_automation',
        automation_id: automation.id,
        booking_id: booking.id,
      },
    });

    if (requestError) {
      console.error(`Error creating review request for booking ${booking.id}:`, requestError);
      await insertBookingAutomationLog(supabase, automation.id, booking.id, 'failed', 'review_request_create_failed');
      continue;
    }

    const result = requestResult as ReviewRequestRpcResult;
    if (!result.success || !result.review_request?.path) {
      await insertBookingAutomationLog(
        supabase,
        automation.id,
        booking.id,
        'failed',
        result.error || 'review_request_create_failed'
      );
      continue;
    }

    const reviewRequestUrl = buildReviewRequestUrl(result.review_request.path);
    const templateMessage = processBookingTemplate(
      automation.template_message,
      booking,
      profile,
      reviewRequestUrl
    );

    let ownerMessage = `⭐ *Запрос отзыва готов*\n\n`;
    ownerMessage += `Клиент: ${booking.client_name}\n`;
    ownerMessage += `Запись: ${booking.slot_date} ${booking.slot_time.slice(0, 5)}\n`;
    if (booking.client_phone) ownerMessage += `Телефон: ${booking.client_phone}\n`;
    if (booking.client_email) ownerMessage += `Email: ${booking.client_email}\n`;
    ownerMessage += `\n_${templateMessage}_`;

    if (!templateMessage.includes(reviewRequestUrl)) {
      ownerMessage += `\n\n${reviewRequestUrl}`;
    }

    const delivered = await sendTelegramMessage(profile.telegram_chat_id!, ownerMessage);
    await insertBookingAutomationLog(
      supabase,
      automation.id,
      booking.id,
      delivered ? 'sent' : 'failed',
      delivered ? null : 'Failed to send Telegram message'
    );

    if (delivered) {
      sent++;
    }
  }

  return { processed, sent };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const cronAuthError = requireCronAuth(req, corsHeaders);
  if (cronAuthError) return cronAuthError;

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

      if (automation.automation_type === 'review_request') {
        const result = await processReviewRequestAutomation(
          supabase,
          automation,
          profile,
          cutoffTime
        );
        processedCount += result.processed;
        sentCount += result.sent;
        continue;
      }

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
