import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendMessage } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch pending notifications
    // We process in small batches to stay within Edge Function execution limits and respect rate limits
    const { data: queue, error: fetchError } = await supabase
      .from("notification_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;
    if (!queue || queue.length === 0) {
      return new Response(JSON.stringify({ message: "No pending notifications" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${queue.length} notifications...`);
    const results = [];

    for (const item of queue) {
      // 2. Mark as processing to prevent race conditions
      await supabase
        .from("notification_queue")
        .update({ status: "processing" })
        .eq("id", item.id);

      try {
        const { channel, telegram, email } = item.payload;
        let success = true;
        let error = null;

        // 3. Deliver via Telegram
        if ((channel === "telegram" || channel === "all") && telegram) {
          try {
            await sendMessage(telegram.chat_id, telegram.text, {
              parse_mode: telegram.parse_mode || "HTML",
              reply_markup: telegram.reply_markup,
            });
          } catch (err) {
            success = false;
            error = `Telegram error: ${err.message}`;
          }
        }

        // 4. Deliver via Email (using Resend)
        if (success && (channel === "email" || channel === "all") && email) {
          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          if (!resendApiKey) {
            success = false;
            error = "RESEND_API_KEY not configured";
          } else {
            const emailResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "lnkmx.my <admin@lnkmx.my>",
                to: [email.to],
                subject: email.subject,
                html: email.html,
              }),
            });

            if (!emailResponse.ok) {
              const emailErr = await emailResponse.json();
              success = false;
              error = `Email error: ${JSON.stringify(emailErr)}`;
            }
          }
        }

        // 5. Update final status
        if (success) {
          await supabase
            .from("notification_queue")
            .update({ 
              status: "sent", 
              processed_at: new Date().toISOString(),
              last_error: null 
            })
            .eq("id", item.id);
          results.push({ id: item.id, status: "sent" });
        } else {
          throw new Error(error || "Unknown delivery failure");
        }

      } catch (err) {
        const retryCount = (item.retry_count || 0) + 1;
        const shouldRetry = retryCount <= 3;
        const nextStatus = shouldRetry ? "pending" : "failed";

        await supabase
          .from("notification_queue")
          .update({ 
            status: nextStatus, 
            retry_count: retryCount,
            last_error: err.message,
            processed_at: new Date().toISOString()
          })
          .eq("id", item.id);
        
        results.push({ id: item.id, status: nextStatus, error: err.message });
      }

      // Respect rate limits (Telegram max 30 msgs/sec overall)
      await new Promise(r => setTimeout(r, 100));
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Orchestrator error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
