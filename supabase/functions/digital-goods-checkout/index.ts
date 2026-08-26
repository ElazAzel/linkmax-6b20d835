import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/utils.ts";

/**
 * Public checkout for a digital product.
 * Creates a pending purchase and returns either a payment URL (paid product)
 * or the access URL right away (free product).
 * The product file is NEVER exposed here.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function md5(input: string) {
    const buf = await crypto.subtle.digest("MD5", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const productId = typeof body.productId === "string" ? body.productId.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const origin = typeof body.origin === "string" && body.origin.startsWith("http")
            ? body.origin.replace(/\/+$/, "")
            : "https://lnkmx.my";

        if (!productId || !/^[0-9a-f-]{36}$/i.test(productId)) {
            return createErrorResponse("Invalid productId", 400);
        }
        if (!EMAIL_RE.test(email) || email.length > 254) {
            return createErrorResponse("Invalid email", 400);
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        const { data: product, error: productError } = await supabase
            .from("digital_products")
            .select("id, user_id, title, price, currency, download_limit, access_ttl_hours, is_active")
            .eq("id", productId)
            .eq("is_active", true)
            .maybeSingle();

        if (productError) {
            console.error("Failed to load product", productError);
            return createErrorResponse("Product lookup failed", 500);
        }
        if (!product) return createErrorResponse("Product not found", 404);

        const price = Number(product.price) || 0;
        const isFree = price <= 0;
        const ttlHours = Number(product.access_ttl_hours) || 720;

        const { data: purchase, error: purchaseError } = await supabase
            .from("digital_purchases")
            .insert({
                product_id: product.id,
                seller_id: product.user_id,
                buyer_email: email,
                amount: price,
                currency: product.currency || "KZT",
                status: isFree ? "paid" : "pending",
                provider: isFree ? "free" : "robokassa",
                download_limit: Number(product.download_limit) || 5,
                expires_at: isFree
                    ? new Date(Date.now() + ttlHours * 3600_000).toISOString()
                    : null,
                paid_at: isFree ? new Date().toISOString() : null,
            })
            .select("id, access_token")
            .single();

        if (purchaseError || !purchase) {
            console.error("Failed to create purchase", purchaseError);
            return createErrorResponse("Could not create purchase", 500);
        }

        const accessUrl = `${origin}/purchase/${purchase.access_token}`;

        if (isFree) {
            return createSuccessResponse({ success: true, free: true, accessUrl });
        }

        const mrhLogin = Deno.env.get("ROBOKASSA_LOGIN");
        const mrhPass1 = Deno.env.get("ROBOKASSA_PASSWORD_1");
        if (!mrhLogin || !mrhPass1) {
            console.error("RoboKassa credentials missing");
            return createErrorResponse("Payments are not configured", 500);
        }
        const isTest = Deno.env.get("ROBOKASSA_IS_TEST") === "1" ? "1" : "0";

        const invId = Date.now().toString().slice(-9);
        const outSum = price.toFixed(2);
        const description = `${product.title}`.slice(0, 100);

        const shpParams: Record<string, string> = {
            shp_related_id: purchase.id,
            shp_seller: product.user_id,
            shp_type: "digital_goods",
            shp_user: product.user_id,
        };

        const shpSorted = Object.entries(shpParams)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`);

        const signatureValue = await md5([mrhLogin, outSum, invId, mrhPass1, ...shpSorted].join(":"));

        await supabase
            .from("digital_purchases")
            .update({ provider_ref: invId })
            .eq("id", purchase.id);

        const params = new URLSearchParams({
            MerchantLogin: mrhLogin,
            OutSum: outSum,
            InvId: invId,
            Description: description,
            SignatureValue: signatureValue,
            Culture: "ru",
            IsTest: isTest,
            Email: email,
            ...shpParams,
        });

        return createSuccessResponse({
            success: true,
            free: false,
            purchaseId: purchase.id,
            paymentUrl: `https://auth.robokassa.ru/Merchant/Index.aspx?${params.toString()}`,
        });
    } catch (error) {
        console.error("digital-goods-checkout error", error);
        return createErrorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
    }
});
