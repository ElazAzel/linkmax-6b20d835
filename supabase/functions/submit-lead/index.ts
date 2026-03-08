import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkInboundLimit } from "../_shared/check-inbound-limit.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_FIELDS = 20;
const MAX_KEY_LENGTH = 100;
const MAX_VALUE_LENGTH = 1000;
const MAX_PAYLOAD_SIZE = 10 * 1024; // 10KB

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function validateAndSanitizeFormData(formData: unknown): Record<string, string> {
    if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
        throw new Error('formData must be a non-null object');
    }

    const entries = Object.entries(formData as Record<string, unknown>);
    if (entries.length === 0) {
        throw new Error('formData must have at least one field');
    }
    if (entries.length > MAX_FIELDS) {
        throw new Error(`formData exceeds maximum of ${MAX_FIELDS} fields`);
    }

    const sanitized: Record<string, string> = {};
    for (const [key, value] of entries) {
        if (typeof key !== 'string' || key.length === 0 || key.length > MAX_KEY_LENGTH) {
            throw new Error(`Invalid field name (must be 1-${MAX_KEY_LENGTH} chars)`);
        }
        if (!/^[\w\s\-а-яА-ЯёЁәғқңөұүһіӘҒҚҢӨҰҮҺІ]+$/u.test(key)) {
            throw new Error(`Field name contains invalid characters: ${key}`);
        }
        const strValue = String(value ?? '').substring(0, MAX_VALUE_LENGTH);
        sanitized[key] = strValue;
    }

    return sanitized;
}

function isValidUUID(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Check payload size
        const contentLength = req.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
            throw new Error('Payload too large');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing DB environment variables');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const rawBody = await req.text();
        if (rawBody.length > MAX_PAYLOAD_SIZE) {
            throw new Error('Payload too large');
        }

        const body = JSON.parse(rawBody);
        const { pageId, blockId, formData } = body;

        // Validate IDs
        if (!pageId || typeof pageId !== 'string' || !isValidUUID(pageId)) {
            throw new Error('Invalid pageId: must be a valid UUID');
        }
        if (!blockId || typeof blockId !== 'string') {
            throw new Error('Missing or invalid blockId');
        }

        // Validate and sanitize form data
        const sanitizedFormData = validateAndSanitizeFormData(formData);

        // 1. Fetch page owner info for limit check and notification
        const { data: pageData, error: pageError } = await supabase
            .from('pages')
            .select('user_id, slug, title')
            .eq('id', pageId)
            .single();

        if (pageError || !pageData?.user_id) {
            throw new Error('Page not found');
        }

        // 2. Check unified inbound limit (leads + bookings + registrations, per user_id)
        const limitResult = await checkInboundLimit(supabase, pageData.user_id);
        if (!limitResult.allowed) {
            return new Response(
                JSON.stringify({ success: false, error: 'inbound_limit_reached', used: limitResult.used, limit: limitResult.limit }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 3. Insert lead into the leads table
        const { data: lead, error: insertError } = await supabase
            .from('leads')
            .insert({
                page_id: pageId,
                block_id: blockId,
                form_data: sanitizedFormData,
                status: 'new'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting lead:', insertError);
            throw insertError;
        }

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
                    const pageName = escapeHtml(pageData.title || pageData.slug || 'lnkmx.my');

                    // Format form data with HTML escaping
                    let formDetails = '';
                    for (const [key, value] of Object.entries(sanitizedFormData)) {
                        const displayKey = escapeHtml(key.charAt(0).toUpperCase() + key.slice(1));
                        const displayValue = escapeHtml(value);
                        formDetails += `\n▪️ ${displayKey}: ${displayValue}`;
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
