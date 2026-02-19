import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
    plan: 'pro';
    period: 3 | 6 | 12; // months
    userId: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { plan, period, userId } = await req.json() as PaymentRequest;

        if (!userId || plan !== 'pro' || ![3, 6, 12].includes(period)) {
            throw new Error("Invalid payment request parameters");
        }

        // Pricing logic (must match frontend)
        // 3mo = 13050 KZT
        // 6mo = 22185 KZT
        // 12mo = 36540 KZT
        const pricesKzt: Record<number, number> = {
            3: 13050,
            6: 22185,
            12: 36540
        };

        const outSum = pricesKzt[period];
        if (!outSum) {
            throw new Error("Invalid billing period");
        }

        const mrhLogin = Deno.env.get("ROBOKASSA_LOGIN");
        const mrhPass1 = Deno.env.get("ROBOKASSA_PASSWORD_1");
        const isTest = Deno.env.get("ROBOKASSA_IS_TEST") === "1" ? "1" : "0";

        if (!mrhLogin || !mrhPass1) {
            console.error("RoboKassa credentials missing");
            throw new Error("Server configuration error");
        }

        // Generate Invoice ID (using timestamp for simplicity, in prod ideally distinct sequence)
        const invId = Date.now().toString().slice(-9); // fit in int if needed, but string is fine for Description
        const description = `lnkmx.my PRO (${period} мес)`;
        const culture = "ru";

        // Custom params to track user and plan in webhook
        const shp_user = userId;
        const shp_plan = plan;
        const shp_period = period.toString();

        // Signature: login:outSum:invId:pass1:shp_... sorted alphabetically
        // String to sign: login:outSum:invId:pass1:shp_period=...:shp_plan=...:shp_user=...
        const signatureString = [
            mrhLogin,
            outSum,
            invId,
            mrhPass1,
            `shp_period=${shp_period}`,
            `shp_plan=${shp_plan}`,
            `shp_user=${shp_user}`
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
            // Custom params must be passed in query
            shp_user: shp_user,
            shp_plan: shp_plan,
            shp_period: shp_period,
            Email: "" // Optional: can pass user email if available
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
