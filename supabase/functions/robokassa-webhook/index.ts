import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const formData = await req.formData();
        const outSum = formData.get("OutSum") as string;
        const invId = formData.get("InvId") as string;
        const signatureValue = formData.get("SignatureValue") as string;
        const shp_user = formData.get("shp_user") as string;
        const shp_type = formData.get("shp_type") as string;
        const shp_plan = formData.get("shp_plan") as string;
        const shp_period = formData.get("shp_period") as string;
        const shp_related_id = formData.get("shp_related_id") as string;

        if (!outSum || !invId || !signatureValue || !shp_user) {
            throw new Error("Missing parameters");
        }

        const mrhPass2 = Deno.env.get("ROBOKASSA_PASSWORD_2");
        if (!mrhPass2) {
            console.error("RoboKassa Password #2 missing");
            throw new Error("Server configuration error");
        }

        // Signature: outSum:invId:pass2:shp_... sorted alphabetically
        const signatureString = [
            outSum,
            invId,
            mrhPass2,
            `shp_plan=${shp_plan}`,
            `shp_period=${shp_period}`,
            `shp_related_id=${shp_related_id}`,
            `shp_type=${shp_type}`,
            `shp_user=${shp_user}`
        ].join(":");

        const encoder = new TextEncoder();
        const data = encoder.encode(signatureString);
        const hashBuffer = await crypto.subtle.digest("MD5", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

        if (calculatedSignature !== signatureValue.toUpperCase()) {
            console.error("Invalid signature", { calculatedSignature, received: signatureValue, signatureString });
            return new Response("BAD SIGNATURE", { status: 400 });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        if (shp_type === 'subscription' || !shp_type) {
            const months = parseInt(shp_period || "0", 10);
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + months);

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    is_premium: true,
                    premium_until: endDate.toISOString(),
                })
                .eq('id', shp_user);

            if (updateError) {
                console.error("Failed to update user profile", updateError);
                return new Response("DB ERROR", { status: 500 });
            }
        } else if (shp_type === 'payment') {
            // Fintech logic: Record the income as COMPLETED
            const amount = parseFloat(outSum);

            // 1. Find the pending transaction if it exists by relatedId
            // 2. Or just create/update transaction status to 'completed'
            // We'll use our fintechService-like logic here in SQL or RPC for atomicity

            // For now, update transactions where internal_ref = invId (if we stored it)
            // Or just record income directly
            const { data: txData, error: txError } = await supabase.rpc('record_wallet_income', {
                p_user_id: shp_user,
                p_amount: amount,
                p_description: `Payment confirmed (InvId: ${invId})`,
                p_related_entity_type: 'payment',
                p_related_entity_id: shp_related_id,
                p_internal_ref: invId
            });

            if (txError) {
                console.error("Failed to record fintech income", txError);
                return new Response("DB ERROR", { status: 500 });
            }
        }

        // Return OK<InvId> as required by RoboKassa
        return new Response(`OK${invId}`, { status: 200 });

    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return new Response(
            "INTERNAL ERROR",
            { status: 500 }
        );
    }
});
