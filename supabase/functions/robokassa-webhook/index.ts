import { serve } from "http/server";
import { createClient } from "supabase";
import { crypto } from "crypto";
import { corsHeaders } from "../_shared/utils.ts";

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
        const shp_zone = formData.get("shp_zone") as string;
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
        const shpParams: Record<string, string> = {
            shp_plan,
            shp_period,
            shp_type,
            shp_user
        };

        if (shp_zone) shpParams.shp_zone = shp_zone;
        if (shp_related_id) shpParams.shp_related_id = shp_related_id;

        const shpSorted = Object.entries(shpParams)
            .filter(([_, v]) => v !== null && v !== undefined)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`);

        const signatureString = [
            outSum,
            invId,
            mrhPass2,
            ...shpSorted
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

        // Update Order status
        await supabase
            .from('orders')
            .update({ status: 'completed' })
            .eq('id', invId);

        if (shp_type === 'subscription' || !shp_type) {
            const months = parseInt(shp_period || "0", 10);
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + months);

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    is_premium: true,
                    premium_expires_at: endDate.toISOString(),
                })
                .eq('id', shp_user);

            if (updateError) {
                console.error("Failed to update user profile", updateError);
                return new Response("DB ERROR", { status: 500 });
            }
        } else if (shp_type === 'zone_upgrade' && shp_zone) {
            const months = parseInt(shp_period || "1", 10);
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + months);

            const { error: zoneError } = await supabase
                .from('zones')
                .update({
                    plan_code: shp_plan,
                    plan_cycle: months === 12 ? 'yearly' : 'monthly',
                    plan_status: 'active',
                    current_period_start: new Date().toISOString(),
                    current_period_end: endDate.toISOString()
                } as any)
                .eq('id', shp_zone);

            if (zoneError) {
                console.error("Failed to upgrade zone", zoneError);
                return new Response("DB ERROR", { status: 500 });
            }
        } else if (shp_type === 'payment') {
            const amount = parseFloat(outSum);

            // Update zone_invoices if this payment is for a zone invoice
            const { data: zoneInv } = await supabase
                .from('zone_invoices')
                .select('id')
                .eq('robokassa_invoice_id', invId)
                .maybeSingle();
            if (zoneInv) {
                await supabase
                    .from('zone_invoices')
                    .update({ status: 'paid', paid_at: new Date().toISOString() } as any)
                    .eq('id', zoneInv.id);
            }

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
