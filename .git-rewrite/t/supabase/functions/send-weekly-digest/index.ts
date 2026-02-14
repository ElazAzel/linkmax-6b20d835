import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get date range for the past week
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoISO = weekAgo.toISOString();

    console.log(`Generating weekly digest for ${weekAgoISO} to ${now.toISOString()}`);

    // Get all users with premium status who have pages
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, display_name, is_premium');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const user of users || []) {
      try {
        // Get user email
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user.id);
        if (userError || !userData?.user?.email) {
          console.log(`Skipping user ${user.id}: no email found`);
          continue;
        }

        const userEmail = userData.user.email;
        const userName = user.display_name || userEmail.split('@')[0];

        // Get user's page
        const { data: page, error: pageError } = await supabase
          .from('pages')
          .select('id, slug, view_count, title')
          .eq('user_id', user.id)
          .single();

        if (pageError || !page) {
          console.log(`Skipping user ${user.id}: no page found`);
          continue;
        }

        // Get new leads this week
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('id, name, email, phone, source, status, created_at')
          .eq('user_id', user.id)
          .gte('created_at', weekAgoISO)
          .order('created_at', { ascending: false });

        if (leadsError) {
          console.error(`Error fetching leads for user ${user.id}:`, leadsError);
          continue;
        }

        // Get analytics for this week
        const { data: analytics, error: analyticsError } = await supabase
          .from('analytics')
          .select('event_type, created_at')
          .eq('page_id', page.id)
          .gte('created_at', weekAgoISO);

        if (analyticsError) {
          console.error(`Error fetching analytics for user ${user.id}:`, analyticsError);
        }

        const viewsThisWeek = analytics?.filter(a => a.event_type === 'view').length || 0;
        const clicksThisWeek = analytics?.filter(a => a.event_type === 'click').length || 0;
        const newLeadsCount = leads?.length || 0;

        // Skip if no activity this week
        if (viewsThisWeek === 0 && clicksThisWeek === 0 && newLeadsCount === 0) {
          console.log(`Skipping user ${user.id}: no activity this week`);
          continue;
        }

        // Generate leads table HTML
        let leadsTableHtml = '';
        if (leads && leads.length > 0) {
          const sourceLabels: Record<string, string> = {
            'form': 'Form',
            'page_view': 'Page View',
            'messenger': 'Messenger',
            'manual': 'Manual',
            'other': 'Other'
          };

          leadsTableHtml = `
            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr style="background-color: #f4f4f5;">
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #71717a; border-bottom: 1px solid #e4e4e7;">Name</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #71717a; border-bottom: 1px solid #e4e4e7;">Contact</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #71717a; border-bottom: 1px solid #e4e4e7;">Source</th>
              </tr>
              ${leads.slice(0, 10).map(lead => `
                <tr>
                  <td style="padding: 12px; font-size: 14px; color: #18181b; border-bottom: 1px solid #e4e4e7;">${lead.name}</td>
                  <td style="padding: 12px; font-size: 14px; color: #52525b; border-bottom: 1px solid #e4e4e7;">${lead.email || lead.phone || '-'}</td>
                  <td style="padding: 12px; font-size: 14px; color: #52525b; border-bottom: 1px solid #e4e4e7;">${sourceLabels[lead.source] || lead.source}</td>
                </tr>
              `).join('')}
            </table>
            ${leads.length > 10 ? `<p style="color: #71717a; font-size: 12px; margin-top: 8px;">+ ${leads.length - 10} more leads</p>` : ''}
          `;
        }

        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Weekly Digest</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 40px 20px;">
                    <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      <tr>
                        <td style="padding: 40px;">
                          <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="margin: 0; color: #18181b; font-size: 24px; font-weight: 600;">📊 Your Weekly Digest</h1>
                            <p style="margin: 8px 0 0; color: #71717a; font-size: 14px;">Here's what happened on your LinkMAX page this week</p>
                          </div>
                          
                          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                            Hi ${userName}! 👋
                          </p>
                          
                          <!-- Stats Grid -->
                          <table role="presentation" style="width: 100%; margin-bottom: 24px;">
                            <tr>
                              <td style="width: 33%; padding: 8px;">
                                <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center;">
                                  <div style="font-size: 28px; font-weight: 700; color: #16a34a;">${viewsThisWeek}</div>
                                  <div style="font-size: 12px; color: #166534; margin-top: 4px;">Page Views</div>
                                </div>
                              </td>
                              <td style="width: 33%; padding: 8px;">
                                <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; text-align: center;">
                                  <div style="font-size: 28px; font-weight: 700; color: #2563eb;">${clicksThisWeek}</div>
                                  <div style="font-size: 12px; color: #1e40af; margin-top: 4px;">Link Clicks</div>
                                </div>
                              </td>
                              <td style="width: 33%; padding: 8px;">
                                <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; text-align: center;">
                                  <div style="font-size: 28px; font-weight: 700; color: #d97706;">${newLeadsCount}</div>
                                  <div style="font-size: 12px; color: #92400e; margin-top: 4px;">New Leads</div>
                                </div>
                              </td>
                            </tr>
                          </table>
                          
                          ${newLeadsCount > 0 ? `
                          <!-- New Leads Section -->
                          <div style="margin-bottom: 24px;">
                            <h2 style="margin: 0 0 16px; color: #18181b; font-size: 18px; font-weight: 600;">🎯 New Leads This Week</h2>
                            ${leadsTableHtml}
                          </div>
                          ` : ''}
                          
                          <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                            <p style="margin: 0; color: #52525b; font-size: 14px;">
                              💡 <strong>Tip:</strong> Share your page more often to get more visitors and leads!
                            </p>
                          </div>
                          
                          <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin: 0;">
                            Keep growing your audience! 🚀
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 40px; background-color: #f4f4f5; border-radius: 0 0 12px 12px;">
                          <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                            © ${new Date().getFullYear()} LinkMAX. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `;

        // Send email
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "LinkMAX <onboarding@resend.dev>",
            to: [userEmail],
            subject: `📊 Your Weekly LinkMAX Digest: ${viewsThisWeek} views, ${newLeadsCount} new leads`,
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          console.log(`Sent digest to ${userEmail}`);
          emailsSent++;
        } else {
          const errorResult = await emailResponse.json();
          console.error(`Failed to send to ${userEmail}:`, errorResult);
          errors.push(`${userEmail}: ${errorResult.message}`);
        }
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        errors.push(`User ${user.id}: ${userError}`);
      }
    }

    console.log(`Weekly digest complete: ${emailsSent} emails sent, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        errors: errors.length > 0 ? errors : undefined 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending weekly digest:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
