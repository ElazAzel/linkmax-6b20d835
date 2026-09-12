-- Create a table for bot configuration (securely)
CREATE TABLE IF NOT EXISTS public.bot_config (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access" ON public.bot_config
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin can manage config (check role from user_profiles)
CREATE POLICY "Admins can manage bot_config" ON public.bot_config
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to send broadcast via SQL (using pg_net)
CREATE OR REPLACE FUNCTION public.send_telegram_broadcast(p_custom_text text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token text;
    v_user record;
    v_success_count int := 0;
    v_total_count int := 0;
    v_msg_text text;
    v_request_id bigint;
BEGIN
    -- 1. Get token from config
    SELECT value INTO v_token FROM public.bot_config WHERE key = 'TELEGRAM_BOT_TOKEN';
    
    IF v_token IS NULL THEN
        RAISE EXCEPTION 'TELEGRAM_BOT_TOKEN not found in bot_config table';
    END IF;

    -- 2. Loop through users with linked Telegram
    FOR v_user IN 
        SELECT telegram_chat_id, (telegram_language || 'ru') as lang 
        FROM public.user_profiles 
        WHERE telegram_chat_id IS NOT NULL 
    LOOP
        v_total_count := v_total_count + 1;
        
        -- Determine message text
        IF p_custom_text IS NOT NULL AND p_custom_text <> '' THEN
            v_msg_text := p_custom_text;
        ELSE
            -- Default "Mini CRM" message templates
            v_msg_text := CASE 
                WHEN v_user.lang = 'ru' THEN '🚀 <b>Обновление LinkMAX: Это больше не просто конструктор!</b>' || chr(10) || chr(10) || 'Мы превратили ваш сайт в полноценную <b>Мини-CRM</b>. Теперь прямо в Telegram вы можете:' || chr(10) || chr(10) || '✅ Управлять лидами и бронированиями' || chr(10) || '✅ Быстро редактировать ссылки и БИО' || chr(10) || '✅ Видеть детальную аналитику по каждому проекту' || chr(10) || chr(10) || 'Попробуйте новые команды в меню! 👇'
                WHEN v_user.lang = 'kk' THEN '🚀 <b>LinkMAX жаңартуы: бұл енді жай конструктор емес!</b>' || chr(10) || chr(10) || 'Біз сіздің сайтыңызды толыққанды <b>Mini-CRM</b>-ге айналдырдық. Енді тікелей Telegram-да сіз:' || chr(10) || chr(10) || '✅ Лидтер мен брондауларды басқара аласыз' || chr(10) || '✅ Сілтемелер мен БИО-ны жылдам өңдей аласыз' || chr(10) || '✅ Әрбір жоба бойынша егжей-тегжейлі талдауды көре аласыз' || chr(10) || chr(10) || 'Мәзірдегі жаңа командаларды қолданып көріңіз! 👇'
                ELSE '🚀 <b>LinkMAX Update: It''s no longer just a builder!</b>' || chr(10) || chr(10) || 'We turned your site into a full-featured <b>Mini-CRM</b>. Now directly in Telegram you can:' || chr(10) || chr(10) || '✅ Manage leads and bookings' || chr(10) || '✅ Quickly edit links and BIO' || chr(10) || '✅ See detailed analytics for each project' || chr(10) || chr(10) || 'Try new commands in the menu! 👇'
            END;
        END IF;

        -- 3. Send via pg_net (async)
        -- We use net.http_post if pg_net is available
        PERFORM net.http_post(
            url := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
            body := jsonb_build_object(
                'chat_id', v_user.telegram_chat_id,
                'text', v_msg_text,
                'parse_mode', 'HTML'
            ),
            headers := '{"Content-Type": "application/json"}'::jsonb
        );
        
        v_success_count := v_success_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'total_count', v_total_count,
        'queued_count', v_success_count,
        'message', 'Broadcast initialized via pg_net queue'
    );
END;
$$;
