import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadFormData {
    [key: string]: any;
}

interface SubmitLeadRequest {
    pageId: string;
    blockId: string;
    formData: LeadFormData;
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing DB environment variables');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { pageId, blockId, formData }: SubmitLeadRequest = await req.json();

        if (!pageId || !blockId || !formData) {
            throw new Error('Missing required fields: pageId, blockId, or formData');
        }

        // 1. Insert lead into the leads table
        const { data: lead, error: insertError } = await supabase
            .from('leads')
            .insert({
                page_id: pageId,
                block_id: blockId,
                form_data: formData,
                status: 'new'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting lead:', insertError);
            throw insertError;
        }

        // 2. Fetch page owner's telegram info for notification
        const { data: pageData, error: pageError } = await supabase
            .from('pages')
            .select('user_id, slug, title')
            .eq('id', pageId)
            .single();

        if (pageData?.user_id) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('telegram_chat_id, telegram_notifications_enabled, telegram_language')
                .eq('id', pageData.user_id)
                .single();

            // 3. Send Telegram Notification if enabled
            if (profile?.telegram_notifications_enabled && profile?.telegram_chat_id) {
                const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
                if (telegramBotToken) {

                    let text = '';
                    const lang = profile.telegram_language || 'ru';
                    const pageName = pageData.title || pageData.slug || 'lnkmx.my';

                    // Format form data for the message
                    let formDetails = '';
                    for (const [key, value] of Object.entries(formData)) {
                        // Translate common keys if possible or just show them
                        const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
                        formDetails += `\n▪️ ${displayKey}: ${value}`;
                    }

                    if (lang === 'ru') {
                        text = `🔔 <b>Новая заявка!</b>\n\nСтраница: ${pageName}\n${formDetails}\n\n👉 <a href="https://lnkmx.my/dashboard">Посмотреть в CRM</a>`;
                    } else if (lang === 'en') {
                        text = `🔔 <b>New Lead!</b>\n\nPage: ${pageName}\n${formDetails}\n\n👉 <a href="https://lnkmx.my/dashboard">View in CRM</a>`;
                    } else if (lang === 'kk') {
                        text = `🔔 <b>Жаңа өтінім!</b>\n\nПарақ: ${pageName}\n${formDetails}\n\n👉 <a href="https://lnkmx.my/dashboard">CRM-де көру</a>`;
                    }

                    try {
                        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: profile.telegram_chat_id,
                                text: text,
                                parse_mode: 'HTML',
                                disable_web_page_preview: true
                            }),
                        });
                        console.log(`Telegram notification sent to ${profile.telegram_chat_id}`);
                    } catch (e) {
                        console.error('Failed to send Telegram notification', e);
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({ success: true, lead }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error processing lead:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
