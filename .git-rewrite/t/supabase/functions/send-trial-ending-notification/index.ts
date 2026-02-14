import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "LinkMAX <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to send email: ${error}`);
  }
  
  return res.json();
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find users whose trial ends in approximately 1 day (between 23 and 25 hours from now)
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const windowStart = new Date(oneDayFromNow.getTime() - 60 * 60 * 1000);
    const windowEnd = new Date(oneDayFromNow.getTime() + 60 * 60 * 1000);

    console.log(`Checking for trials ending between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

    const { data: expiringUsers, error: queryError } = await supabase
      .from("user_profiles")
      .select("id, display_name, username")
      .eq("is_premium", false)
      .gte("trial_ends_at", windowStart.toISOString())
      .lte("trial_ends_at", windowEnd.toISOString());

    if (queryError) {
      console.error("Error querying users:", queryError);
      throw queryError;
    }

    console.log(`Found ${expiringUsers?.length || 0} users with expiring trials`);

    if (!expiringUsers || expiringUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users with expiring trials found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching auth users:", authError);
      throw authError;
    }

    const emailsSent: string[] = [];
    const errors: string[] = [];

    for (const profile of expiringUsers) {
      const authUser = authUsers.users.find((u) => u.id === profile.id);
      if (!authUser?.email) {
        console.log(`No email found for user ${profile.id}`);
        continue;
      }

      const userName = profile.display_name || profile.username || "Пользователь";

      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 40px; text-align: center; color: white;">
                <h1 style="margin: 0 0 16px 0; font-size: 28px;">Привет, ${userName}! 👋</h1>
                <p style="margin: 0; font-size: 18px; opacity: 0.9;">Ваш пробный период Premium заканчивается завтра</p>
              </div>
              
              <div style="background: white; border-radius: 16px; padding: 32px; margin-top: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="margin: 0 0 16px 0; color: #333;">Не упустите возможности Premium:</h2>
                <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
                  <li>Неограниченное количество блоков</li>
                  <li>Все типы блоков (видео, карусели, формы)</li>
                  <li>Безлимитный AI-помощник</li>
                  <li>Мини-CRM для лидов</li>
                  <li>Расширенная аналитика</li>
                  <li>Без водяного знака</li>
                </ul>
                
                <div style="text-align: center; margin-top: 32px;">
                  <a href="https://wa.me/77051097664?text=${encodeURIComponent('Hi, I want to purchase a premium LinkMax')}" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                    Получить Premium 🚀
                  </a>
                </div>
              </div>
              
              <p style="text-align: center; color: #999; margin-top: 24px; font-size: 14px;">
                Если у вас есть вопросы, напишите нам в WhatsApp
              </p>
            </div>
          </body>
          </html>
        `;

        const emailResponse = await sendEmail(
          authUser.email,
          "⏰ Ваш пробный период заканчивается завтра!",
          emailHtml
        );

        console.log(`Email sent to ${authUser.email}:`, emailResponse);
        emailsSent.push(authUser.email);
      } catch (emailError: any) {
        console.error(`Failed to send email to ${authUser.email}:`, emailError);
        errors.push(`${authUser.email}: ${emailError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        errors,
        totalProcessed: expiringUsers.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-trial-ending-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
