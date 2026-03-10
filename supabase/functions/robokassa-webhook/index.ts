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
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', invId);

        // Record billing history
        await supabase
            .from('billing_history')
            .insert({
                user_id: shp_user,
                order_id: invId,
                type: shp_type || 'subscription',
                amount: parseFloat(outSum),
                currency: 'KZT',
                description: `Payment completed via Robokassa (InvId: ${invId})`,
                status: 'completed'
            });

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

            // --- Q2 Success-First Fee Logic ---
            // 1. Get user profile for tier
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('is_premium')
                .eq('id', shp_user)
                .single();

            const feeRate = profile?.is_premium ? 0.01 : 0.07;
            const grossAmount = amount;
            const feeAmount = Number((grossAmount * feeRate).toFixed(2));
            const netAmount = grossAmount - feeAmount;

            // 2. Insert into wallet_transactions using new Q2 schema
            const { data: wallet } = await supabase
                .from('user_wallets')
                .select('id, balance')
                .eq('user_id', shp_user)
                .single();

            if (wallet) {
                const { error: txError } = await supabase
                    .from('wallet_transactions')
                    .insert({
                        wallet_id: wallet.id,
                        user_id: shp_user,
                        gross_amount: grossAmount,
                        fee_amount: feeAmount,
                        net_amount: netAmount,
                        type: 'payment',
                        status: 'completed',
                        description: `Payment confirmed (InvId: ${invId})`,
                        related_entity_id: shp_related_id || null,
                        related_entity_type: 'payment',
                        metadata: {
                            internal_ref: invId,
                            fee_rate: feeRate,
                            gateway: 'robokassa'
                        },
                        completed_at: new Date().toISOString()
                    });

                if (txError) {
                    console.error("Failed to record fintech transaction", txError);
                    return new Response("TX ERROR", { status: 500 });
                }

                // 3. Update wallet balance
                await supabase
                    .from('user_wallets')
                    .update({
                        balance: Number(wallet.balance) + netAmount,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', wallet.id);
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
