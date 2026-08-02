import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * SECURITY: this function never accepts a client-supplied Telegram chat id.
 * Ownership of a chat is proven by the user sending a short-lived one-time code
 * to the bot from that chat (handled in telegram-bot-webhook), which links the
 * chat to their account. Here we only issue codes and report link status.
 */

type Action = 'start' | 'status';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return n.toString().padStart(6, '0');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ valid: false, error: 'missing_authorization' }, 401);
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return json({ valid: false, error: 'unauthorized' }, 401);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let body: { action?: Action } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const action: Action = body.action === 'status' ? 'status' : 'start';

    // Always report the currently linked chat (verified server-side only)
    const { data: profile } = await admin
      .from('user_profiles')
      .select('telegram_chat_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.telegram_chat_id) {
      return json({ valid: true, linked: true, chatId: profile.telegram_chat_id });
    }

    if (action === 'status') {
      return json({ valid: false, linked: false, error: 'not_linked' });
    }

    // Issue a fresh one-time code, invalidating previous unused ones
    await admin
      .from('telegram_link_codes')
      .delete()
      .eq('user_id', user.id)
      .is('used_at', null);

    let code = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      code = generateCode();
      const { error: insertError } = await admin
        .from('telegram_link_codes')
        .insert({
          user_id: user.id,
          code,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
      if (!insertError) break;
      code = '';
    }

    if (!code) {
      return json({ valid: false, linked: false, error: 'code_generation_failed' }, 500);
    }

    return json({ valid: false, linked: false, code, expiresInMinutes: 15 });
  } catch (error) {
    console.error('validate-telegram error:', error instanceof Error ? error.message : String(error));
    return json({ valid: false, error: 'server_error' }, 500);
  }
});
