import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
    type?: 'subscription' | 'payment' | 'tokens';
    plan?: 'pro';
    period?: 3 | 6 | 12; // months
    userId: string;
    amount?: number;
    description?: string;
    relatedId?: string;
    tokenAmount?: number;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const payload = await req.json() as PaymentRequest;
        const { type = 'subscription', userId, plan, period, amount, description: customDescription, relatedId, tokenAmount } = payload;

        if (!userId) {
            throw new Error("userId is required");
        }

        let outSum = 0;
        let description = "";
        const shp_user = userId;
        const shp_type = type;
        const shp_plan = plan || "";
        const shp_period = period?.toString() || "";
        let shp_related_id = relatedId || "";

        if (type === 'subscription') {
            if (plan !== 'pro' || !period || ![3, 6, 12].includes(period)) {
                throw new Error("Invalid subscription parameters");
            }
            // Query dynamic rate from Supabase
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            const { data: rateData, error: rateError } = await supabase
                .from('currency_rates')
                .select('rate')
                .eq('currency_pair', 'USD_KZT')
                .single();

            let rate = 497.33; // Fallback rate
            if (!rateError && rateData) {
                rate = rateData.rate;
            }

            const basePricesUsd: Record<number, number> = {
                3: 8.90,
                6: 7.90,
                12: 5.90 // Total $70.8 for 12 months
            };

            const monthlyUsd = basePricesUsd[period];
            outSum = Math.round(monthlyUsd * period * rate);
            description = `lnkmx.my PRO (${period} мес)`;
        } else if (type === 'tokens') {
            if (!tokenAmount || ![1000, 5000, 10000].includes(tokenAmount)) {
                throw new Error("Invalid token amount. Available: 1000, 5000, 10000");
            }
            // 1 token = 1 KZT, but with bulk discounts
            const tokenPrices: Record<number, number> = {
                1000: 1000,
                5000: 4500,  // 10% discount
                10000: 8000  // 20% discount
            };
            outSum = tokenPrices[tokenAmount];
            description = `Покупка ${tokenAmount} Linkkon tokens`;
            shp_related_id = tokenAmount.toString();
        } else {
            if (!amount || amount <= 0) {
                throw new Error("Invalid amount for payment");
            }
            outSum = amount;
            description = customDescription || `Payment on lnkmx.my`;
        }

        const mrhLogin = Deno.env.get("ROBOKASSA_LOGIN");
        const mrhPass1 = Deno.env.get("ROBOKASSA_PASSWORD_1");
        const isTest = Deno.env.get("ROBOKASSA_IS_TEST") === "1" ? "1" : "0";

        if (!mrhLogin || !mrhPass1) {
            console.error("RoboKassa credentials missing");
            throw new Error("Server configuration error");
        }

        const invId = Date.now().toString().slice(-9);
        const culture = "ru";

        // Signature: login:outSum:invId:pass1:shp_... sorted alphabetically
        const shpParams = {
            shp_plan,
            shp_period,
            shp_related_id,
            shp_type,
            shp_user
        };

        const shpSorted = Object.entries(shpParams)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`);

        const signatureString = [
            mrhLogin,
            outSum.toString(),
            invId,
            mrhPass1,
            ...shpSorted
        ].join(":");

        const encoder = new TextEncoder();
        const data = encoder.encode(signatureString);
        const hashBuffer = await crypto.subtle.digest("MD5", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signatureValue = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const baseUrl = "https://auth.robokassa.ru/Merchant/Index.aspx";
        const params = new URLSearchParams({
            MerchantLogin: mrhLogin,
            OutSum: outSum.toString(),
            InvId: invId,
            Description: description,
            SignatureValue: signatureValue,
            Culture: culture,
            IsTest: isTest,
            shp_user: shp_user,
            shp_type: shp_type,
            shp_plan: shp_plan,
            shp_period: shp_period,
            shp_related_id: shp_related_id
        });

        return new Response(
            JSON.stringify({
                url: `${baseUrl}?${params.toString()}`,
                invId
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("RoboKassa init error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
