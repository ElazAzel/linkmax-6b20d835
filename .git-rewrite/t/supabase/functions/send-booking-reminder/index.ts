import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    if (!telegramBotToken) {
      console.error("TELEGRAM_BOT_TOKEN not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Telegram not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get current time in Kazakhstan timezone (UTC+5)
    const now = new Date();
    const kazakhstanOffset = 5 * 60; // UTC+5 in minutes
    const localTime = new Date(now.getTime() + (kazakhstanOffset + now.getTimezoneOffset()) * 60000);
    const currentHour = localTime.getHours();
    const currentMinute = localTime.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Get today's date in YYYY-MM-DD format
    const todayStr = localTime.toISOString().split('T')[0];
    
    console.log(`Checking reminders at ${currentTimeStr} for date: ${todayStr}`);

    // Get all bookings for today with their owners
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        client_name,
        client_phone,
        slot_time,
        slot_end_time,
        owner_id,
        block_id,
        page_id,
        status
      `)
      .eq("slot_date", todayStr)
      .in("status", ["confirmed", "pending"]);

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      throw new Error("Failed to fetch bookings");
    }

    if (!bookings || bookings.length === 0) {
      console.log("No bookings for today");
      return new Response(
        JSON.stringify({ success: true, message: "No bookings for today", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${bookings.length} bookings for today`);

    // Get unique page IDs
    const pageIds = [...new Set(bookings.map(b => b.page_id))];
    
    // Get booking blocks to check reminder settings
    const { data: blocks, error: blocksError } = await supabase
      .from("blocks")
      .select("id, content, page_id")
      .in("page_id", pageIds)
      .eq("type", "booking");

    if (blocksError) {
      console.error("Error fetching blocks:", blocksError);
    }

    // Create a map of page_id to block settings
    const blockSettingsByPage = new Map<string, { enabled: boolean; time: string }>();
    if (blocks) {
      for (const block of blocks) {
        const content = block.content as Record<string, unknown>;
        if (content?.dailyReminderEnabled === true) {
          const reminderTime = (content?.dailyReminderTime as string) || '08:50';
          blockSettingsByPage.set(block.page_id, { enabled: true, time: reminderTime });
        }
      }
    }

    // Group bookings by owner, filtering by matching reminder time
    const bookingsByOwner = new Map<string, typeof bookings>();
    for (const booking of bookings) {
      const settings = blockSettingsByPage.get(booking.page_id);
      if (!settings?.enabled) continue;
      
      // Check if current time matches the configured reminder time (within 10 min window)
      const [reminderHour, reminderMinute] = settings.time.split(':').map(Number);
      const reminderTotalMinutes = reminderHour * 60 + reminderMinute;
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      
      // Match if within 10-minute window (cron runs every 10 minutes)
      if (Math.abs(currentTotalMinutes - reminderTotalMinutes) > 5) {
        continue;
      }
      
      const ownerBookings = bookingsByOwner.get(booking.owner_id) || [];
      ownerBookings.push(booking);
      bookingsByOwner.set(booking.owner_id, ownerBookings);
    }

    if (bookingsByOwner.size === 0) {
      console.log("No bookings matching reminder time at", currentTimeStr);
      return new Response(
        JSON.stringify({ success: true, message: "No matching reminder times", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get owner profiles with Telegram settings
    const ownerIds = Array.from(bookingsByOwner.keys());
    const { data: owners, error: ownersError } = await supabase
      .from("user_profiles")
      .select("id, telegram_chat_id, telegram_notifications_enabled, telegram_language, display_name")
      .in("id", ownerIds);

    if (ownersError) {
      console.error("Error fetching owners:", ownersError);
      throw new Error("Failed to fetch owner profiles");
    }

    let sentCount = 0;

    for (const owner of owners || []) {
      if (!owner.telegram_notifications_enabled || !owner.telegram_chat_id) {
        console.log(`Skipping owner ${owner.id}: Telegram not enabled`);
        continue;
      }

      const ownerBookings = bookingsByOwner.get(owner.id) || [];
      if (ownerBookings.length === 0) continue;

      // Format the message based on language
      const lang = owner.telegram_language || 'ru';
      const isRu = lang === 'ru' || lang === 'kk';
      
      const greeting = isRu ? 'Доброе утро' : 'Good morning';
      const todaySchedule = isRu ? 'Ваше расписание на сегодня' : 'Your schedule for today';
      const bookingsWord = isRu ? 'записей' : 'appointments';
      
      // Sort bookings by time
      ownerBookings.sort((a, b) => a.slot_time.localeCompare(b.slot_time));
      
      let message = `☀️ *${greeting}${owner.display_name ? `, ${owner.display_name}` : ''}!*\n\n`;
      message += `📋 *${todaySchedule}:*\n`;
      message += `_${ownerBookings.length} ${bookingsWord}_\n\n`;
      
      for (let i = 0; i < ownerBookings.length; i++) {
        const booking = ownerBookings[i];
        const timeStr = booking.slot_time.substring(0, 5);
        const endTimeStr = booking.slot_end_time ? ` - ${booking.slot_end_time.substring(0, 5)}` : '';
        
        message += `${i + 1}. *${timeStr}${endTimeStr}*\n`;
        message += `   👤 ${booking.client_name}\n`;
        if (booking.client_phone) {
          message += `   📞 ${booking.client_phone}\n`;
        }
        message += '\n';
      }
      
      const successWish = isRu ? '✨ Удачного дня!' : '✨ Have a great day!';
      message += successWish;

      try {
        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: owner.telegram_chat_id,
              text: message,
              parse_mode: "Markdown",
            }),
          }
        );

        if (!telegramResponse.ok) {
          const errorData = await telegramResponse.text();
          console.error(`Telegram API error for owner ${owner.id}:`, errorData);
        } else {
          console.log(`Reminder sent to owner ${owner.id} at ${currentTimeStr}`);
          sentCount++;
        }
      } catch (telegramError) {
        console.error(`Error sending Telegram to owner ${owner.id}:`, telegramError);
      }
    }

    console.log(`Daily reminder completed at ${currentTimeStr}. Sent ${sentCount} notifications.`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, time: currentTimeStr }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-booking-reminder:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
