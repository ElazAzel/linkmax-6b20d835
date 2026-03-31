import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log("Fetching exchange rate from National Bank of KZ...");

        let rate: number;

        try {
            const date = new Date();
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${dd}.${mm}.${yyyy}`;

            const response = await fetch(`https://nationalbank.kz/rss/get_rates.cfm?fdate=${formattedDate}&cur_id=431`);

            if (!response.ok) {
                throw new Error(`NB KZ API: ${response.status} ${response.statusText}`);
            }

            const xmlText = await response.text();
            const usdMatch = xmlText.match(/<title>USD<\/title>\s*<description>([\d.]+)<\/description>/i);

            if (!usdMatch || !usdMatch[1]) {
                throw new Error("Could not parse USD rate from NB KZ XML");
            }

            rate = parseFloat(usdMatch[1]);
            if (isNaN(rate)) throw new Error(`Parsed rate is NaN: ${usdMatch[1]}`);

            console.log(`Primary source (NB KZ): USD/KZT = ${rate}`);
        } catch (primaryError) {
            // Fallback: open exchangerate API
            console.warn(`Primary source failed: ${primaryError}. Trying fallback...`);

            const fallbackResp = await fetch('https://open.er-api.com/v6/latest/USD');
            if (!fallbackResp.ok) {
                throw new Error(`Both sources failed. Fallback: ${fallbackResp.status}`);
            }

            const fallbackData = await fallbackResp.json();
            rate = fallbackData?.rates?.KZT;

            if (!rate || isNaN(rate)) {
                throw new Error("Fallback did not return KZT rate");
            }

            console.log(`Fallback source (er-api): USD/KZT = ${rate}`);
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase environment variables");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('currency_rates')
            .upsert({
                currency_pair: 'USD_KZT',
                rate: rate,
                source: 'nationalbank.kz',
                fetched_at: new Date().toISOString()
            }, {
                onConflict: 'currency_pair'
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Supabase upsert error: ${error.message}`);
        }

        return new Response(
            JSON.stringify({
                success: true,
                rate: rate,
                data: data
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );

    } catch (error: any) {
        console.error("Error updating currency rate:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
