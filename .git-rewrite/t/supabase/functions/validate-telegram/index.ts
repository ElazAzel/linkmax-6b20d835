import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const { chatId }: ValidateRequest = await req.json();
    
    if (!chatId || !chatId.trim()) {
      console.log('Empty chat ID provided');
      return new Response(
        JSON.stringify({ valid: false, error: 'empty_chat_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!telegramBotToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ valid: false, error: 'bot_not_configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating Telegram chat ID: ${chatId}`);

    // Try to get chat info to validate the chat ID
    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/getChat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      }
    );

    const result = await response.json();
    console.log('Telegram API response:', JSON.stringify(result));

    if (result.ok) {
      // Send a test message to confirm the bot can reach this chat
      const testMessageResponse = await fetch(
        `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '✅ LinkMAX подключен! Теперь вы будете получать уведомления о новых заявках.\n\n✅ LinkMAX connected! You will now receive notifications about new leads.',
            parse_mode: 'HTML',
          }),
        }
      );

      const testResult = await testMessageResponse.json();
      console.log('Test message result:', JSON.stringify(testResult));

      if (testResult.ok) {
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
      } else {
        console.log('Failed to send test message:', testResult.description);
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'cannot_send_message',
            description: testResult.description 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('Invalid chat ID:', result.description);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'invalid_chat_id',
          description: result.description 
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
