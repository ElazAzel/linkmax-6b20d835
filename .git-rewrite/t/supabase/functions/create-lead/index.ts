import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RATE_LIMIT_REQUESTS = 15; // 15 requests per minute
const RATE_LIMIT_WINDOW = 60; // 60 seconds

async function checkRateLimit(supabase: any, ipAddress: string, endpoint: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW * 1000);
  
  // Clean up old entries
  await supabase
    .from('rate_limits')
    .delete()
    .lt('window_start', windowStart.toISOString());
  
  // Get current rate limit entry
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('ip_address', ipAddress)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .single();
  
  if (existing) {
    if (existing.request_count >= RATE_LIMIT_REQUESTS) {
      return false; // Rate limit exceeded
    }
    
    // Update count
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);
  } else {
    // Create new entry
    await supabase
      .from('rate_limits')
      .insert({
        ip_address: ipAddress,
        endpoint: endpoint,
        request_count: 1,
        window_start: new Date().toISOString()
      });
  }
  
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract IP address
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check rate limit
    const allowed = await checkRateLimit(supabase, ipAddress, 'create-lead');
    if (!allowed) {
      console.log(`Rate limit exceeded for IP: ${ipAddress}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again in a minute.' }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { pageOwnerId, name, email, phone, source, notes, metadata } = await req.json();

    if (!pageOwnerId || !name) {
      return new Response(
        JSON.stringify({ error: "pageOwnerId and name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate pageOwnerId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(pageOwnerId)) {
      return new Response(
        JSON.stringify({ error: "Invalid pageOwnerId format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify that the page owner exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', pageOwnerId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('Invalid page owner:', pageOwnerId);
      return new Response(
        JSON.stringify({ error: "Invalid page owner" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        user_id: pageOwnerId,
        name: name.trim().substring(0, 255),
        email: email?.trim().substring(0, 255) || null,
        phone: phone?.trim().substring(0, 50) || null,
        source: source || 'form',
        status: 'new',
        notes: notes?.substring(0, 1000) || null,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      return new Response(
        JSON.stringify({ error: "Failed to create lead" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Lead created for user ${pageOwnerId}: ${lead.id} (IP: ${ipAddress})`);

    // Send email notification asynchronously (don't wait for it)
    try {
      const notificationUrl = `${supabaseUrl}/functions/v1/send-lead-notification`;
      fetch(notificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          leadId: lead.id,
          pageOwnerId,
          leadName: name.trim(),
          leadEmail: email?.trim() || null,
          leadPhone: phone?.trim() || null,
          source: source || 'form',
        }),
      }).catch(err => console.error('Failed to send notification:', err));
    } catch (notifyError) {
      console.error('Error triggering notification:', notifyError);
      // Don't fail the lead creation if notification fails
    }

    return new Response(
      JSON.stringify({ success: true, leadId: lead.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in create-lead:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
