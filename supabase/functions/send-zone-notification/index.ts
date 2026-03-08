import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
    type: 'new_deal' | 'invoice_paid' | 'task_overdue' | 'deal_comment_mention';
    zone_id: string;
    data: Record<string, unknown>;
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!telegramBotToken || !supabaseUrl || !supabaseServiceKey) {
            return new Response('Configuration missing', { status: 500, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const payload: NotificationPayload = await req.json();
        const { type, zone_id, data } = payload;

        // Get zone name
        const { data: zone } = await supabase
            .from('zones')
            .select('name')
            .eq('id', zone_id)
            .single();
        const zoneName = zone?.name || 'Zone';

        // Get zone owner/admin user IDs
        const { data: members } = await supabase
            .from('zone_members')
            .select('user_id, role')
            .eq('zone_id', zone_id)
            .in('role', ['owner', 'admin']);

        if (!members || members.length === 0) {
            return new Response(JSON.stringify({ sent: 0 }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Get telegram_chat_id for each member with notifications enabled
        const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('telegram_chat_id, telegram_language, telegram_notifications_enabled')
            .in('id', userIds)
            .eq('telegram_notifications_enabled', true)
            .not('telegram_chat_id', 'is', null);

        if (!profiles || profiles.length === 0) {
            return new Response(JSON.stringify({ sent: 0 }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Build notification message based on type
        let sentCount = 0;
        for (const profile of profiles) {
            const lang = profile.telegram_language || 'ru';
            let message = '';

            switch (type) {
                case 'new_deal': {
                    const title = data.title || '';
                    const amount = data.value_amount || 0;
                    const currency = data.currency || '₸';
                    if (lang === 'ru') {
                        message = `🔔 <b>Новая сделка</b> в ${zoneName}\n\n💼 ${title}\n💰 ${Number(amount).toLocaleString()} ${currency}`;
                    } else if (lang === 'kk') {
                        message = `🔔 <b>Жаңа мәміле</b> ${zoneName}\n\n💼 ${title}\n💰 ${Number(amount).toLocaleString()} ${currency}`;
                    } else {
                        message = `🔔 <b>New deal</b> in ${zoneName}\n\n💼 ${title}\n💰 ${Number(amount).toLocaleString()} ${currency}`;
                    }
                    break;
                }
                case 'invoice_paid': {
                    const amount = data.amount || 0;
                    const currency = data.currency || '₸';
                    const invoiceNum = data.invoice_number || '';
                    if (lang === 'ru') {
                        message = `✅ <b>Инвойс оплачен</b> в ${zoneName}\n\n🧾 #${invoiceNum}\n💰 ${Number(amount).toLocaleString()} ${currency}`;
                    } else if (lang === 'kk') {
                        message = `✅ <b>Шот төленді</b> ${zoneName}\n\n🧾 #${invoiceNum}\n💰 ${Number(amount).toLocaleString()} ${currency}`;
                    } else {
                        message = `✅ <b>Invoice paid</b> in ${zoneName}\n\n🧾 #${invoiceNum}\n💰 ${Number(amount).toLocaleString()} ${currency}`;
                    }
                    break;
                }
                case 'task_overdue': {
                    const taskTitle = data.title || '';
                    const dueDate = data.due_date || '';
                    if (lang === 'ru') {
                        message = `⚠️ <b>Просроченная задача</b> в ${zoneName}\n\n📋 ${taskTitle}\n📅 Срок: ${dueDate}`;
                    } else if (lang === 'kk') {
                        message = `⚠️ <b>Мерзімі өткен тапсырма</b> ${zoneName}\n\n📋 ${taskTitle}\n📅 Мерзімі: ${dueDate}`;
                    } else {
                        message = `⚠️ <b>Overdue task</b> in ${zoneName}\n\n📋 ${taskTitle}\n📅 Due: ${dueDate}`;
                    }
                    break;
                }
            }

            if (message && profile.telegram_chat_id) {
                try {
                    const res = await fetch(
                        `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: profile.telegram_chat_id,
                                text: message,
                                parse_mode: 'HTML',
                            }),
                        }
                    );
                    if (res.ok) sentCount++;
                } catch (e) {
                    console.error(`Failed to send to ${profile.telegram_chat_id}:`, e);
                }
            }
        }

        return new Response(JSON.stringify({ sent: sentCount }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in send-zone-notification:', error);
        return new Response(JSON.stringify({ error: 'Internal error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
