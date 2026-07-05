import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/utils.ts";
import { calculateFintechFee } from "../_shared/fintech-utils.ts";

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const formData = await req.formData();
        const outSum = formData.get("OutSum") as string;
        const invId = formData.get("InvId") as string;
        const signatureValue = formData.get("SignatureValue") as string;

        // Dynamically collect ALL shp_* custom params so signature matches
        // whichever sender (subscription / zone_upgrade / payment / offer_purchase) built the URL.
        const shpParams: Record<string, string> = {};
        for (const [key, value] of formData.entries()) {
            if (key.startsWith("shp_") && typeof value === "string" && value.length > 0) {
                shpParams[key] = value;
            }
        }
        const shp_user = shpParams.shp_user;
        const shp_type = shpParams.shp_type;
        const shp_plan = shpParams.shp_plan;
        const shp_period = shpParams.shp_period;
        const shp_zone = shpParams.shp_zone;
        const shp_related_id = shpParams.shp_related_id;
        const shp_offer = shpParams.shp_offer;
        const shp_seller = shpParams.shp_seller;

        if (!outSum || !invId || !signatureValue || !shp_user) {
            throw new Error("Missing parameters");
        }

        const mrhPass2 = Deno.env.get("ROBOKASSA_PASSWORD_2");
        if (!mrhPass2) {
            console.error("RoboKassa Password #2 missing");
            throw new Error("Server configuration error");
        }

        const shpSorted = Object.entries(shpParams)
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
            console.error("Invalid signature", { calculatedSignature, received: signatureValue, invId, outSum });
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
        } else if (shp_type === 'offer_purchase' && shp_seller) {
            // Credit the seller's wallet with net (fee applied) amount
            const gross = parseFloat(outSum);
            const { data: sellerProfile } = await supabase
                .from('user_profiles')
                .select('is_premium, premium_tier, telegram_chat_id, telegram_notifications_enabled, telegram_language')
                .eq('id', shp_seller)
                .maybeSingle();

            const { grossAmount, feeAmount, netAmount, rate: feeRate } = calculateFintechFee({
                amount: gross,
                isPremium: !!sellerProfile?.is_premium,
                tier: (sellerProfile?.premium_tier as string) || undefined,
            });

            let { data: wallet } = await supabase
                .from('user_wallets')
                .select('id, balance')
                .eq('user_id', shp_seller)
                .maybeSingle();

            if (!wallet) {
                const { data: created } = await supabase
                    .from('user_wallets')
                    .insert({ user_id: shp_seller, balance: 0, currency: 'KZT' } as any)
                    .select('id, balance')
                    .single();
                wallet = created;
            }

            if (wallet) {
                const { error: txError } = await supabase
                    .from('wallet_transactions')
                    .insert({
                        wallet_id: wallet.id,
                        user_id: shp_seller,
                        gross_amount: grossAmount,
                        fee_amount: feeAmount,
                        net_amount: netAmount,
                        type: 'payment',
                        status: 'completed',
                        description: `Offer purchase (InvId: ${invId})`,
                        related_entity_id: shp_offer || null,
                        related_entity_type: 'offer',
                        metadata: {
                            internal_ref: invId,
                            fee_rate: feeRate,
                            gateway: 'robokassa',
                            kind: 'offer_purchase',
                            offer_id: shp_offer,
                        },
                        completed_at: new Date().toISOString(),
                    });

                if (txError) {
                    console.error("Failed to record offer_purchase tx", txError);
                    return new Response("TX ERROR", { status: 500 });
                }

                await supabase
                    .from('user_wallets')
                    .update({
                        balance: Number(wallet.balance) + netAmount,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', wallet.id);

                try {
                    if (sellerProfile?.telegram_chat_id && sellerProfile?.telegram_notifications_enabled) {
                        const lang = (sellerProfile as any).telegram_language || 'ru';
                        const netTxt = netAmount.toLocaleString('ru-RU');
                        const feeTxt = feeAmount.toLocaleString('ru-RU');
                        const text = lang === 'en'
                            ? `💰 <b>Offer sold!</b>\n\nProfit: <b>${netTxt} KZT</b>\nFee: ${feeTxt} KZT\nRef: ${invId}`
                            : `💰 <b>Продан оффер!</b>\n\nПрибыль: <b>${netTxt} KZT</b>\nКомиссия: ${feeTxt} KZT\nID: ${invId}`;
                        await supabase.from('notification_queue').insert({
                            user_id: shp_seller,
                            event_type: 'payment_success',
                            payload: {
                                channel: 'telegram',
                                telegram: {
                                    chat_id: sellerProfile.telegram_chat_id,
                                    text,
                                    parse_mode: 'HTML',
                                },
                            },
                            status: 'pending',
                            idempotency_key: `offer_success_${invId}`,
                        });
                    }
                } catch (notifyErr) {
                    console.error("Failed to queue offer success notification", notifyErr);
                }
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
                .select('is_premium, premium_tier')
                .eq('id', shp_user)
                .single();

            const { grossAmount, feeAmount, netAmount, rate: feeRate } = calculateFintechFee({
                amount: parseFloat(outSum),
                isPremium: !!profile?.is_premium,
                tier: (profile?.premium_tier as string) || undefined
            });

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

                // --- Phase 16: CRM Status Sync ---
                if (shp_related_id) {
                    // 4. Update related Lead if applicable
                    const { data: lead } = await supabase
                        .from('leads')
                        .update({ 
                            status: 'converted', 
                            updated_at: new Date().toISOString() 
                        } as any)
                        .eq('id', shp_related_id)
                        .eq('user_id', shp_user)
                        .select('id')
                        .maybeSingle();

                    // 5. Update related Booking if applicable
                    const { data: booking } = await supabase
                        .from('bookings')
                        .update({ 
                            status: 'confirmed', 
                            payment_status: 'paid',
                            updated_at: new Date().toISOString() 
                        } as any)
                        .eq('id', shp_related_id)
                        .eq('owner_id', shp_user)
                        .select('id')
                        .maybeSingle();

                    // 6. Update Event Registration if applicable
                    await supabase
                        .from('event_registrations')
                        .update({ 
                            status: 'confirmed',
                            payment_status: 'paid',
                            updated_at: new Date().toISOString() 
                        } as any)
                        .eq('id', shp_related_id)
                        .eq('owner_id', shp_user);

                    // 7. Trigger Success Notification (via Outbox Queue)
                    try {
                        const lang = profile?.telegram_language || 'ru';
                        const netTxt = netAmount.toLocaleString('ru-RU');
                        const feeTxt = feeAmount.toLocaleString('ru-RU');

                        const text = lang === 'en'
                            ? `💰 <b>Payment Received!</b>\n\nProfit: <b>${netTxt} KZT</b>\nFee: ${feeTxt} KZT\nRef: ${invId}\n\nKeep it up! 🚀`
                            : lang === 'kk'
                                ? `💰 <b>Төлем қабылданды!</b>\n\nПайда: <b>${netTxt} KZT</b>\nКомиссия: ${feeTxt} KZT\nID: ${invId}\n\nКеремет! 🚀`
                                : `💰 <b>Оплата получена!</b>\n\nВаша прибыль: <b>${netTxt} KZT</b>\nКомиссия: ${feeTxt} KZT\nID: ${invId}\n\nТак держать! 🚀`;

                        if (profile?.telegram_chat_id && profile?.telegram_notifications_enabled) {
                            await supabase
                                .from('notification_queue')
                                .insert({
                                    user_id: shp_user,
                                    event_type: 'payment_success',
                                    payload: {
                                        channel: 'telegram',
                                        telegram: {
                                            chat_id: profile.telegram_chat_id,
                                            text: text,
                                            parse_mode: 'HTML'
                                        }
                                    },
                                    status: 'pending',
                                    idempotency_key: `pay_success_${invId}`
                                });
                        }
                    } catch (notifyErr) {
                        console.error("Failed to queue success notification", notifyErr);
                    }
                }
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
