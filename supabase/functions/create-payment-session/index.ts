/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simplified ZONE_PLANS for server-side validation
const ZONE_PLANS = [
    { code: 'business_5', memberLimit: 5, monthlyPrice: 3045, yearlyPrice: 36540 },
    { code: 'business_50', memberLimit: 50, monthlyPrice: 15225, yearlyPrice: 182700 },
    { code: 'business_100', memberLimit: 100, monthlyPrice: 38080, yearlyPrice: 297000 },
    { code: 'business_300', memberLimit: 300, monthlyPrice: 76125, yearlyPrice: 548100 },
    { code: 'business_700', memberLimit: 700, monthlyPrice: 121800, yearlyPrice: 913500 },
    { code: 'business_1000', memberLimit: 1000, monthlyPrice: 152250, yearlyPrice: 1169280 },
    { code: 'business_unl', memberLimit: 999999, monthlyPrice: 182700, yearlyPrice: 1461600 },
];

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Get user from Auth header
        const authHeader = req.headers.get('Authorization')!;
        const tempClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
            global: { headers: { Authorization: authHeader } }
        });
        const { data: { user }, error: authError } = await tempClient.auth.getUser();

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        }

        // 2. Parse request
        const { zoneId, planCode, cycle, description } = await req.json();

        if (!zoneId || !planCode || !cycle) {
            throw new Error("Missing required parameters: zoneId, planCode, cycle");
        }

        // 3. Verify Plan & Calculate Amount
        const plan = ZONE_PLANS.find(p => p.code === planCode);
        if (!plan) throw new Error(`Invalid plan code: ${planCode}`);

        const amount = cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
        const period = cycle === 'monthly' ? 1 : 12;

        // 4. Create record in 'orders' table
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                zone_id: zoneId,
                user_id: user.id,
                amount,
                currency: 'KZT',
                provider: 'robokassa',
                description: description || `Upgrade to ${planCode} (${cycle})`,
                status: 'pending',
                metadata: { planCode, cycle, period }
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 5. Generate RoboKassa Signed URL
        const merchantLogin = Deno.env.get("ROBOKASSA_LOGIN") || "inkmax";
        const pass1 = Deno.env.get("ROBOKASSA_PASSWORD_1");

        if (!pass1) throw new Error("RoboKassa Password #1 is not configured");

        const shp_user = user.id;
        const shp_zone = zoneId;
        const shp_plan = planCode;
        const shp_period = period;
        const shp_type = 'zone_upgrade';

        // Signature algorithm: MerchantLogin:OutSum:InvId:Pass1:shp_... (alphabetical)
        // Custom shp_ params must be sorted alphabetically
        const signatureString = `${merchantLogin}:${amount}:${order.id}:${pass1}:shp_period=${shp_period}:shp_plan=${shp_plan}:shp_type=${shp_type}:shp_user=${shp_user}:shp_zone=${shp_zone}`;

        const encoder = new TextEncoder();
        const data = encoder.encode(signatureString);
        const hashBuffer = await crypto.subtle.digest("MD5", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signatureValue = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const queryParams = new URLSearchParams({
            MerchantLogin: merchantLogin,
            OutSum: amount.toString(),
            InvId: order.id,
            Description: description || `Upgrade to ${planCode}`,
            SignatureValue: signatureValue,
            shp_user,
            shp_zone,
            shp_plan,
            shp_period: shp_period.toString(),
            shp_type
        });

        const paymentUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?${queryParams.toString()}`;

        return new Response(JSON.stringify({
            success: true,
            paymentUrl,
            orderId: order.id
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("Error creating payment session:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
