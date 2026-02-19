import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const formData = await req.formData();
        const outSum = formData.get("OutSum") as string;
        const invId = formData.get("InvId") as string;
        const signatureValue = formData.get("SignatureValue") as string;
        const shp_user = formData.get("shp_user") as string;
        const shp_plan = formData.get("shp_plan") as string;
        const shp_period = formData.get("shp_period") as string;

        if (!outSum || !invId || !signatureValue || !shp_user) {
            throw new Error("Missing parameters");
        }

        const mrhPass2 = Deno.env.get("ROBOKASSA_PASSWORD_2");
        if (!mrhPass2) {
            console.error("RoboKassa Password #2 missing");
            throw new Error("Server configuration error");
        }

        // Validate Signature: outSum:invId:pass2:shp_period=...:shp_plan=...:shp_user=...
        const signatureString = [
            outSum,
            invId,
            mrhPass2,
            `shp_period=${shp_period}`,
            `shp_plan=${shp_plan}`,
            `shp_user=${shp_user}`
        ].join(":");

        const encoder = new TextEncoder();
        const data = encoder.encode(signatureString);
        const hashBuffer = await crypto.subtle.digest("MD5", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

        if (calculatedSignature !== signatureValue.toUpperCase()) {
            console.error("Invalid signature", { calculatedSignature, received: signatureValue });
            return new Response("BAD SIGNATURE", { status: 400 });
        }

        // Update User Subscription
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const months = parseInt(shp_period || "0", 10);
        const now = new Date();
        // Logic: if already premium, add time. If not, set from now.
        // For simplicity, we'll fetch current profile first (optional optimization)

        // Calculate new expiration date
        // Simple logic: just add N months from today for now
        // Ideally check current subscription end date
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
