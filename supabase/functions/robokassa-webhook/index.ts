import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/utils.ts";
import { calculateFintechFee } from "../_shared/fintech-utils.ts";
import { md5Hex } from "../_shared/md5.ts";

// Robokassa повторяет ResultURL, пока не получит OK<InvId>. Любой ретрай после
// частично успешной обработки (таймаут, 500) раньше зачислял деньги повторно.
// deno-lint-ignore no-explicit-any
async function isAlreadyCredited(supabase: any, invId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('wallet_transactions')
        .select('id')
        .eq('status', 'completed')
        .eq('metadata->>internal_ref', invId)
        .eq('metadata->>gateway', 'robokassa')
        .limit(1);
    // Не смогли проверить — пусть Robokassa повторит позже: лучше задержка, чем двойное зачисление
    if (error) throw error;
    return (data?.length ?? 0) > 0;
}

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
        const allShpParams: Record<string, string> = {};
        for (const [key, value] of formData.entries()) {
            if (key.startsWith("shp_") && typeof value === "string") {
                allShpParams[key] = value;
            }
        }
        const shpParams: Record<string, string> = Object.fromEntries(
            Object.entries(allShpParams).filter(([, value]) => value.length > 0),
        );
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

        const sign = async (params: Record<string, string>) => {
            const shpSorted = Object.entries(params)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => `${key}=${value}`);
            const signatureString = [outSum, invId, mrhPass2, ...shpSorted].join(":");
            // crypto.subtle не поддерживает MD5 в Deno: раньше здесь бросалось
            // NotSupportedError, и ни одна оплата не подтверждалась
            return md5Hex(signatureString).toUpperCase();
        };

        // Отправители подписывают счёт вместе с пустыми shp_* (например, shp_zone=
        // у подписки), а Robokassa возвращает их в ResultURL как есть. Принимаем
        // подпись в обоих вариантах: с пустыми параметрами и без них. Оба требуют
        // Password #2, так что подделать ни один нельзя.
        const received = signatureValue.toUpperCase();
        const signatureOk =
            (await sign(allShpParams)) === received ||
            (await sign(shpParams)) === received;

        if (!signatureOk) {
            // Вычисленную подпись не логируем: для этих параметров она валидна
            console.error("Invalid signature", { invId, outSum });
            return new Response("BAD SIGNATURE", { status: 400 });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // InvId у Robokassa числовой; UUID заказа (create-payment-session,
        // create-offer-checkout) приходит в подписанном shp_order. Старые ссылки
        // могли передавать UUID прямо в InvId. Раньше числовой InvId шёл в uuid-колонки,
        // запросы молча падали, и история оплат не записывалась.
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const orderId = UUID_RE.test(invId)
            ? invId
            : (shpParams.shp_order && UUID_RE.test(shpParams.shp_order) ? shpParams.shp_order : null);

        if (orderId) {
            await supabase
                .from('orders')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', orderId);
        }

        // Record billing history (once per InvId: Robokassa retries ResultURL)
        const billingDescription = `Payment completed via Robokassa (InvId: ${invId})`;
        const { data: existingBilling } = await supabase
            .from('billing_history')
            .select('id')
            .eq('user_id', shp_user)
            .eq('description', billingDescription)
            .limit(1);
        const alreadyProcessed = !!existingBilling?.length;
        if (!alreadyProcessed) {
            const { error: billingError } = await supabase
                .from('billing_history')
                .insert({
                    user_id: shp_user,
                    order_id: orderId,
                    type: shp_type || 'subscription',
                    amount: parseFloat(outSum),
                    currency: 'KZT',
                    description: billingDescription,
                    status: 'completed'
                });
            if (billingError) console.error("Failed to record billing history", billingError);
        }

        if ((shp_type === 'subscription' || !shp_type) && alreadyProcessed) {
            // Replay of an already-applied payment: do not extend premium again
            console.log(`Subscription payment ${invId} already applied, skipping`);
        } else if (shp_type === 'subscription' || !shp_type) {
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
        } else if (shp_type === 'digital_goods' && shp_related_id) {
            // Fulfil a digital goods purchase: unlock the download and credit the seller
            const { data: purchase } = await supabase
                .from('digital_purchases')
                .select('id, status, product_id, seller_id, digital_products(access_ttl_hours)')
                .eq('id', shp_related_id)
                .maybeSingle();

            if (!purchase) {
                console.error("Digital purchase not found", shp_related_id);
                return new Response("DB ERROR", { status: 500 });
            }

            if (purchase.status !== 'paid') {
                const ttlHours = Number((purchase as any).digital_products?.access_ttl_hours) || 720;
                const { error: fulfilError } = await supabase
                    .from('digital_purchases')
                    .update({
                        status: 'paid',
                        provider: 'robokassa',
                        provider_ref: invId,
                        paid_at: new Date().toISOString(),
                        expires_at: new Date(Date.now() + ttlHours * 3600_000).toISOString(),
                    } as any)
                    .eq('id', purchase.id);

                if (fulfilError) {
                    console.error("Failed to fulfil digital purchase", fulfilError);
                    return new Response("DB ERROR", { status: 500 });
                }

                // Credit the seller wallet with the net amount
                try {
                    const gross = parseFloat(outSum);
                    const { data: sellerProfile } = await supabase
                        .from('user_profiles')
                        .select('id, is_premium, telegram_chat_id, telegram_notifications_enabled, telegram_language')
                        .eq('id', purchase.seller_id)
                        .maybeSingle();

                    const feeRate = sellerProfile?.is_premium ? 0.01 : 0.07;
                    const feeAmount = Math.round(gross * feeRate * 100) / 100;
                    const netAmount = Math.round((gross - feeAmount) * 100) / 100;

                    let { data: wallet } = await supabase
                        .from('user_wallets')
                        .select('id, balance')
                        .eq('user_id', purchase.seller_id)
                        .maybeSingle();

                    if (!wallet) {
                        const { data: created, error: createErr } = await supabase
                            .from('user_wallets')
                            .insert({ user_id: purchase.seller_id, balance: 0, currency: 'KZT' } as any)
                            .select('id, balance')
                            .single();
                        if (createErr) {
                            console.error("Failed to create seller wallet for digital sale", createErr);
                        }
                        wallet = created;
                    }

                    // A concurrent retry of this webhook was already credited:
                    // do not notify the seller a second time.
                    let duplicateCredit = false;
                    if (!wallet) {
                        console.error("No wallet available to credit seller for digital sale", { invId, seller: purchase.seller_id });
                    } else {
                        const { data: credit, error: txErr } = await supabase.rpc('record_wallet_income', {
                            p_user_id: purchase.seller_id,
                            p_amount: netAmount,
                            p_description: `Digital goods sale (InvId: ${invId})`,
                            p_related_entity_type: 'digital_purchase',
                            p_related_entity_id: purchase.id,
                            p_internal_ref: invId,
                            p_wallet_id: wallet.id,
                            p_type: 'payment',
                            p_gross_amount: gross,
                            p_fee_amount: feeAmount,
                            p_currency: 'KZT',
                            p_metadata: { fee_rate: feeRate, gateway: 'robokassa' },
                        });
                        if (txErr || (credit && credit.success === false && !credit.duplicate)) {
                            console.error("Failed to credit digital sale", txErr ?? credit);
                        }
                        duplicateCredit = Boolean(credit?.duplicate);
                    }

                    if (!duplicateCredit && sellerProfile?.telegram_chat_id && sellerProfile?.telegram_notifications_enabled) {
                        const lang = sellerProfile.telegram_language || 'ru';
                        const netTxt = netAmount.toLocaleString('ru-RU');
                        const text = lang === 'en'
                            ? `📦 <b>Digital product sold!</b>\n\nProfit: <b>${netTxt} KZT</b>\nID: ${invId}`
                            : lang === 'kk'
                                ? `📦 <b>Цифрлық тауар сатылды!</b>\n\nПайда: <b>${netTxt} KZT</b>\nID: ${invId}`
                                : `📦 <b>Продан цифровой товар!</b>\n\nПрибыль: <b>${netTxt} KZT</b>\nID: ${invId}`;
                        await supabase.from('notification_queue').insert({
                            user_id: purchase.seller_id,
                            event_type: 'payment_success',
                            payload: {
                                channel: 'telegram',
                                telegram: { chat_id: sellerProfile.telegram_chat_id, text, parse_mode: 'HTML' },
                            },
                            status: 'pending',
                            idempotency_key: `digital_success_${invId}`,
                        });
                    }
                } catch (walletErr) {
                    console.error("Failed to credit seller for digital sale", walletErr);
                }
            }
        } else if (shp_type === 'offer_purchase' && shp_seller) {
            if (await isAlreadyCredited(supabase, invId)) {
                console.log("offer_purchase already credited, skipping", { invId });
                return new Response(`OK${invId}`, { status: 200 });
            }

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
                const { data: credit, error: txError } = await supabase.rpc('record_wallet_income', {
                    p_user_id: shp_seller,
                    p_amount: netAmount,
                    p_description: `Offer purchase (InvId: ${invId})`,
                    p_related_entity_type: 'offer',
                    p_related_entity_id: shp_offer || null,
                    p_internal_ref: invId,
                    p_wallet_id: wallet.id,
                    p_type: 'payment',
                    p_gross_amount: grossAmount,
                    p_fee_amount: feeAmount,
                    p_currency: 'KZT',
                    p_metadata: { fee_rate: feeRate, gateway: 'robokassa', kind: 'offer_purchase', offer_id: shp_offer },
                });

                if (txError || (credit && credit.success === false && !credit.duplicate)) {
                    console.error("Failed to record offer_purchase tx", txError ?? credit);
                    return new Response("TX ERROR", { status: 500 });
                }

                // Parallel retry already credited this InvId: acknowledge
                // without repeating notifications and status updates.
                if (credit?.duplicate) {
                    return new Response(`OK${invId}`, { status: 200 });
                }

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
                .select('is_premium, premium_tier, telegram_chat_id, telegram_notifications_enabled, telegram_language')
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

            if (shp_related_id) {
                const { data: bookingPayment, error: bookingPaymentError } = await supabase.rpc(
                    'record_platform_booking_payment',
                    {
                        p_booking_id: shp_related_id,
                        p_amount: outSum,
                        p_currency: 'KZT',
                        p_provider: 'robokassa',
                        p_provider_reference: invId,
                        p_idempotency_key: `robokassa:${invId}`,
                    },
                );

                if (bookingPaymentError) {
                    console.error('Failed to record authoritative booking payment', bookingPaymentError);
                    return new Response('BOOKING PAYMENT ERROR', { status: 500 });
                }

                if (bookingPayment?.ok === false && bookingPayment.code !== 'booking_not_found') {
                    console.error('Authoritative booking payment was rejected', bookingPayment);
                    return new Response('BOOKING PAYMENT REJECTED', { status: 500 });
                }
            }

            if (wallet && await isAlreadyCredited(supabase, invId)) {
                console.log("payment already credited, skipping", { invId });
            } else if (wallet) {
                const { data: credit, error: txError } = await supabase.rpc('record_wallet_income', {
                    p_user_id: shp_user,
                    p_amount: netAmount,
                    p_description: `Payment confirmed (InvId: ${invId})`,
                    p_related_entity_type: 'payment',
                    p_related_entity_id: shp_related_id || null,
                    p_internal_ref: invId,
                    p_wallet_id: wallet.id,
                    p_type: 'payment',
                    p_gross_amount: grossAmount,
                    p_fee_amount: feeAmount,
                    p_currency: 'KZT',
                    p_metadata: { fee_rate: feeRate, gateway: 'robokassa' },
                });

                if (txError || (credit && credit.success === false && !credit.duplicate)) {
                    console.error("Failed to record fintech transaction", txError ?? credit);
                    return new Response("TX ERROR", { status: 500 });
                }

                // Parallel retry already credited this InvId: acknowledge
                // without repeating notifications and status updates.
                if (credit?.duplicate) {
                    return new Response(`OK${invId}`, { status: 200 });
                }

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
