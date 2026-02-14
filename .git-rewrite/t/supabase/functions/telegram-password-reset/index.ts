import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetRequest {
  telegram_chat_id: string;
  action: 'request' | 'verify';
  token?: string;
  new_password?: string;
}

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    if (!result.ok) {
      console.error('Telegram API error:', result);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Telegram send error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telegram_chat_id, action, token, new_password } = await req.json() as ResetRequest;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'request') {
      // Find user by telegram_chat_id
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, telegram_chat_id')
        .eq('telegram_chat_id', telegram_chat_id)
        .maybeSingle();

      if (profileError || !profile) {
        console.log('Profile not found for chat_id:', telegram_chat_id);
        return new Response(
          JSON.stringify({ success: false, error: 'telegram_not_found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate reset token
      const resetToken = generateToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save token to database
      const { error: tokenError } = await supabaseAdmin
        .from('password_reset_tokens')
        .insert({
          user_id: profile.id,
          token: resetToken,
          expires_at: expiresAt.toISOString()
        });

      if (tokenError) {
        console.error('Token save error:', tokenError);
        return new Response(
          JSON.stringify({ success: false, error: 'token_save_failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send token via Telegram
      const message = `🔐 <b>Сброс пароля LinkMAX</b>\n\nВаш код для сброса пароля:\n\n<code>${resetToken}</code>\n\nКод действителен 15 минут.\n\n⚠️ Если вы не запрашивали сброс пароля, проигнорируйте это сообщение.`;
      
      const sent = await sendTelegramMessage(telegram_chat_id, message);
      if (!sent) {
        return new Response(
          JSON.stringify({ success: false, error: 'telegram_send_failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Password reset token sent via Telegram to:', telegram_chat_id);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      if (!token || !new_password) {
        return new Response(
          JSON.stringify({ success: false, error: 'missing_params' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find and validate token
      const { data: resetData, error: resetError } = await supabaseAdmin
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token.toUpperCase())
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (resetError || !resetData) {
        console.log('Invalid or expired token:', token);
        return new Response(
          JSON.stringify({ success: false, error: 'invalid_token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update password using admin API
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        resetData.user_id,
        { password: new_password }
      );

      if (updateError) {
        console.error('Password update error:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'password_update_failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark token as used
      await supabaseAdmin
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('id', resetData.id);

      // Get user's telegram to send confirmation
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('telegram_chat_id')
        .eq('id', resetData.user_id)
        .maybeSingle();

      if (profile?.telegram_chat_id) {
        await sendTelegramMessage(
          profile.telegram_chat_id,
          '✅ <b>Пароль успешно изменён!</b>\n\nТеперь вы можете войти с новым паролем.'
        );
      }

      console.log('Password reset successful for user:', resetData.user_id);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'invalid_action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
