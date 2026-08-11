import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMessage, getChat, isConfigured } from "../_shared/telegram.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateRequest {
  chatId: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ valid: false, error: 'missing_authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ valid: false, error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { chatId }: ValidateRequest = await req.json();

    if (!chatId || !chatId.trim()) {
      console.log('Empty chat ID provided');
      return new Response(
        JSON.stringify({ valid: false, error: 'empty_chat_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isConfigured()) {
      console.error('Telegram gateway not configured');
      return new Response(
        JSON.stringify({ valid: false, error: 'bot_not_configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating Telegram chat ID: ${chatId}`);

    try {
      // Try to get chat info to validate the chat ID
      const result = await getChat(chatId);
      console.log('Telegram API response:', JSON.stringify(result));

      // Send a test message to confirm the bot can reach this chat
      try {
        await sendMessage(chatId,
          '✅ lnkmx.my подключен! Теперь вы будете получать уведомления о новых заявках.\n\n✅ lnkmx.my connected! You will now receive notifications about new leads.',
          { parse_mode: 'HTML' }
        );

        return new Response(
          JSON.stringify({
            valid: true,
            chatInfo: {
              id: result.result.id,
              type: result.result.type,
              firstName: result.result.first_name,
              username: result.result.username,
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (sendErr: unknown) {
        const errMsg = sendErr instanceof Error ? sendErr.message : String(sendErr);
        console.log('Failed to send test message:', errMsg);
        return new Response(
          JSON.stringify({
            valid: false,
            error: 'cannot_send_message',
            description: errMsg
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (chatErr: unknown) {
      const errMsg = chatErr instanceof Error ? chatErr.message : String(chatErr);
      console.log('Invalid chat ID:', errMsg);
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'invalid_chat_id',
          description: errMsg
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error validating Telegram chat ID:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'server_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
