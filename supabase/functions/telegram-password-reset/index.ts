import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendMessage, isConfigured } from "../_shared/telegram.ts";

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

const TOKEN_TTL_MS = 15 * 60 * 1000;
// Лимиты считаются на пользователя, а не на IP: перебор кода идёт по одному
// аккаунту, и IP для этого легко менять.
const MAX_REQUESTS_PER_WINDOW = 3;
const MAX_VERIFY_ATTEMPTS_PER_WINDOW = 5;
const MIN_PASSWORD_LENGTH = 8;

type AdminClient = SupabaseClient;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Счётчики храним в самой password_reset_tokens, а не в rate_limits: rate_limits
// чистят другие функции (create-lead и др. удаляют всё старше 60 секунд), и
// 15-минутный счётчик там бы обнулялся. Попытка проверки — строка-маркер
// с token = 'FAIL-<uuid>': она уже used и никогда не совпадёт с 6-символьным кодом.
const FAIL_MARKER_PREFIX = 'FAIL-';

async function countRecent(supabase: AdminClient, userId: string, kind: 'request' | 'attempt') {
  const since = new Date(Date.now() - TOKEN_TTL_MS).toISOString();
  let query = supabase
    .from('password_reset_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since);
  query = kind === 'attempt'
    ? query.like('token', `${FAIL_MARKER_PREFIX}%`)
    : query.not('token', 'like', `${FAIL_MARKER_PREFIX}%`);
  const { count, error } = await query;
  // Не смогли посчитать — считаем лимит исчерпанным (fail closed)
  if (error) return Number.POSITIVE_INFINITY;
  return count ?? 0;
}

async function recordVerifyAttempt(supabase: AdminClient, userId: string) {
  await supabase.from('password_reset_tokens').insert({
    user_id: userId,
    token: `${FAIL_MARKER_PREFIX}${crypto.randomUUID()}`,
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    used: true,
  });
}

async function invalidateActiveTokens(supabase: AdminClient, userId: string) {
  await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('user_id', userId)
    .eq('used', false);
}

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('');
}

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  if (!isConfigured()) {
    console.log("Telegram gateway not configured");
    return false;
  }

  try {
    await sendMessage(chatId, text, { parse_mode: 'HTML' });
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
    const chatId = String(telegram_chat_id ?? '').trim();
    if (!/^-?\d{1,20}$/.test(chatId)) {
      return json({ success: false, error: 'invalid_chat_id' }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'request') {
      // Find user by telegram_chat_id
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, telegram_chat_id')
        .eq('telegram_chat_id', chatId)
        .maybeSingle();

      if (profileError || !profile) {
        console.log('Profile not found for chat_id:', chatId);
        // Uniform success response to prevent enumeration of linked Telegram accounts
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if ((await countRecent(supabaseAdmin, profile.id, 'request')) >= MAX_REQUESTS_PER_WINDOW) {
        return json({ success: false, error: 'too_many_requests' }, 429);
      }

      // Живым остаётся только последний код: старые перестают работать
      await invalidateActiveTokens(supabaseAdmin, profile.id);

      const resetToken = generateToken();
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

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
      const message = `🔐 <b>Сброс пароля lnkmx.my</b>\n\nВаш код для сброса пароля:\n\n<code>${resetToken}</code>\n\nКод действителен 15 минут.\n\n⚠️ Если вы не запрашивали сброс пароля, проигнорируйте это сообщение.`;
      
      const sent = await sendTelegramMessage(chatId, message);
      if (!sent) {
        return new Response(
          JSON.stringify({ success: false, error: 'telegram_send_failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Password reset token sent via Telegram to:', chatId);
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

      if (new_password.length < MIN_PASSWORD_LENGTH) {
        return json({ success: false, error: 'weak_password' }, 400);
      }

      const normalizedToken = token.trim().toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(normalizedToken)) {
        return json({ success: false, error: 'invalid_token' });
      }

      // Код ищем только среди кодов владельца этого chat_id. Раньше поиск шёл
      // по всей таблице, и перебор угадывал код любого пользователя.
      const { data: owner } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('telegram_chat_id', chatId)
        .maybeSingle();

      if (!owner) {
        return json({ success: false, error: 'invalid_token' });
      }

      // Сначала фиксируем попытку, потом считаем: при параллельных запросах
      // проверка «count, потом insert» пропустила бы их все.
      await recordVerifyAttempt(supabaseAdmin, owner.id);
      if ((await countRecent(supabaseAdmin, owner.id, 'attempt')) > MAX_VERIFY_ATTEMPTS_PER_WINDOW) {
        await invalidateActiveTokens(supabaseAdmin, owner.id);
        return json({ success: false, error: 'too_many_attempts' }, 429);
      }

      const { data: resetData, error: resetError } = await supabaseAdmin
        .from('password_reset_tokens')
        .select('*')
        .eq('user_id', owner.id)
        .eq('token', normalizedToken)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (resetError || !resetData) {
        console.log('Invalid or expired reset token for user:', owner.id);
        return json({ success: false, error: 'invalid_token' });
      }

      // Код одноразовый: гасим его до смены пароля, чтобы параллельный запрос
      // с тем же кодом не прошёл второй раз.
      const { data: claimed } = await supabaseAdmin
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('id', resetData.id)
        .eq('used', false)
        .select('id');
      if (!claimed || claimed.length === 0) {
        return json({ success: false, error: 'invalid_token' });
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
    return json({ success: false, error: 'internal_error' }, 500);
  }
});
