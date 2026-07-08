/**
 * create-offer-checkout — Money OS
 *
 * Универсальный чекаут-адаптер для `offers`:
 *   Offer → orders (pending) → Robokassa payment URL.
 *
 * Работает и для соло-креаторов (без zone_id), и для zone-офферов.
 * Подписка/usage/hybrid billing на этом этапе не активируется — только
 * one_time / donation (единичный платёж). Для subscription фронт должен
 * запускать провайдер-специфичную подписку отдельно.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, createErrorResponse, getSupabaseUser } from "../_shared/utils.ts";

interface OfferRow {
  id: string;
  user_id: string;
  name: string;
  offer_type: string;
  price_cents: number;
  currency: string;
  is_active: boolean;
  page_id: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth is optional here — page visitors buying an offer могут быть anon.
    // Если JWT есть — фиксируем buyer в orders.user_id.
    const { user } = await getSupabaseUser(req).catch(() => ({ user: null }));

    const body = await req.json().catch(() => ({}));
    const {
      offerId,
      zoneId = null,
      quantity = 1,
      buyerEmail = null,
    }: {
      offerId?: string;
      zoneId?: string | null;
      quantity?: number;
      buyerEmail?: string | null;
    } = body ?? {};

    if (!offerId || typeof offerId !== "string") {
      return createErrorResponse("Missing offerId", 400);
    }
    const qty = Math.max(1, Math.min(999, Number(quantity) || 1));

    const { data: offer, error: offerErr } = await supabase
      .from("offers")
      .select("id,user_id,name,offer_type,price_cents,currency,is_active,page_id")
      .eq("id", offerId)
      .maybeSingle();

    if (offerErr || !offer) return createErrorResponse("Offer not found", 404);
    const o = offer as OfferRow;

    if (!o.is_active) return createErrorResponse("Offer is not active", 410);
    if (!["one_time", "donation"].includes(o.offer_type)) {
      return createErrorResponse(
        `Offer type '${o.offer_type}' is not supported by one-shot checkout yet`,
        422,
      );
    }
    if (o.price_cents <= 0) return createErrorResponse("Invalid offer price", 422);

    const amountUnits = (o.price_cents / 100) * qty;
    const currency = (o.currency || "KZT").toUpperCase();

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        zone_id: zoneId,
        amount: amountUnits,
        currency,
        provider: "robokassa",
        status: "pending",
        description: `Offer purchase: ${o.name}`,
        metadata: {
          kind: "offer_purchase",
          offer_id: o.id,
          seller_user_id: o.user_id,
          page_id: o.page_id,
          quantity: qty,
          buyer_email: buyerEmail,
        },
      })
      .select("id")
      .single();

    if (orderErr || !order) throw orderErr ?? new Error("Failed to create order");

    // Robokassa signature: MerchantLogin:OutSum:InvId:Pass1:shp_...(sorted)
    const merchantLogin = Deno.env.get("ROBOKASSA_LOGIN") || "inkmax";
    const pass1 = Deno.env.get("ROBOKASSA_PASSWORD_1");
    if (!pass1) throw new Error("RoboKassa Password #1 is not configured");

    const shp = {
      shp_offer: o.id,
      shp_seller: o.user_id,
      shp_type: "offer_purchase",
      shp_user: o.user_id,
    } as const;
    const shpString = Object.keys(shp)
      .sort()
      .map((k) => `${k}=${(shp as Record<string, string>)[k]}`)
      .join(":");

    const signatureString =
      `${merchantLogin}:${amountUnits}:${order.id}:${pass1}:${shpString}`;
    const hashBuffer = await crypto.subtle.digest(
      "MD5",
      new TextEncoder().encode(signatureString),
    );
    const signatureValue = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const params = new URLSearchParams({
      MerchantLogin: merchantLogin,
      OutSum: amountUnits.toString(),
      InvId: order.id,
      Description: `Offer: ${o.name}`.slice(0, 100),
      SignatureValue: signatureValue,
      ...shp,
    });
    if (buyerEmail) params.set("Email", buyerEmail);

    const paymentUrl =
      `https://auth.robokassa.ru/Merchant/Index.aspx?${params.toString()}`;

    return new Response(
      JSON.stringify({ success: true, orderId: order.id, paymentUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("create-offer-checkout error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
