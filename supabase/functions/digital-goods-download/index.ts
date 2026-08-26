import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/utils.ts";

/**
 * Secure delivery of a purchased digital product.
 * action = "info"     -> purchase state for the buyer page (no file access)
 * action = "download" -> short-lived signed URL, consuming one download slot
 */

const UUID_RE = /^[0-9a-f-]{36}$/i;
const SIGNED_URL_TTL_SECONDS = 90;

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const token = typeof body.token === "string" ? body.token.trim() : "";
        const action = body.action === "download" ? "download" : "info";

        if (!UUID_RE.test(token)) {
            return createErrorResponse("Invalid access token", 400);
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        const { data: purchase, error } = await supabase
            .from("digital_purchases")
            .select(
                "id, status, downloads_used, download_limit, expires_at, currency, amount, product_id, digital_products(title, description, file_name, file_size, file_path, is_active)",
            )
            .eq("access_token", token)
            .maybeSingle();

        if (error) {
            console.error("Purchase lookup failed", error);
            return createErrorResponse("Lookup failed", 500);
        }
        if (!purchase) return createErrorResponse("Purchase not found", 404);

        const product = (purchase as Record<string, any>).digital_products;
        const expired = purchase.expires_at ? new Date(purchase.expires_at).getTime() < Date.now() : false;
        const exhausted = purchase.downloads_used >= purchase.download_limit;
        const paid = purchase.status === "paid";

        const info = {
            status: purchase.status,
            paid,
            expired,
            exhausted,
            downloadsUsed: purchase.downloads_used,
            downloadLimit: purchase.download_limit,
            expiresAt: purchase.expires_at,
            amount: Number(purchase.amount) || 0,
            currency: purchase.currency,
            product: product
                ? {
                    title: product.title,
                    description: product.description,
                    fileName: product.file_name,
                    fileSize: product.file_size,
                    isActive: product.is_active,
                }
                : null,
        };

        if (action === "info") {
            return createSuccessResponse({ success: true, purchase: info });
        }

        if (!paid) return createErrorResponse("Payment is not completed yet", 402);
        if (!product?.is_active) return createErrorResponse("Product is no longer available", 410);
        if (expired) return createErrorResponse("Access link has expired", 410);
        if (exhausted) return createErrorResponse("Download limit reached", 429);

        // Consume one slot atomically-ish: guard on the value we just read.
        const { data: consumed, error: consumeError } = await supabase
            .from("digital_purchases")
            .update({
                downloads_used: purchase.downloads_used + 1,
                last_download_at: new Date().toISOString(),
            })
            .eq("id", purchase.id)
            .eq("downloads_used", purchase.downloads_used)
            .select("id")
            .maybeSingle();

        if (consumeError) {
            console.error("Failed to consume download slot", consumeError);
            return createErrorResponse("Could not issue download", 500);
        }
        if (!consumed) {
            return createErrorResponse("Another download is in progress, try again", 409);
        }

        const { data: signed, error: signError } = await supabase.storage
            .from("digital-goods")
            .createSignedUrl(product.file_path, SIGNED_URL_TTL_SECONDS, {
                download: product.file_name || true,
            });

        if (signError || !signed?.signedUrl) {
            console.error("Failed to sign URL", signError);
            // Give the slot back — the buyer got nothing.
            await supabase
                .from("digital_purchases")
                .update({ downloads_used: purchase.downloads_used })
                .eq("id", purchase.id);
            return createErrorResponse("Could not issue download", 500);
        }

        return createSuccessResponse({
            success: true,
            url: signed.signedUrl,
            expiresIn: SIGNED_URL_TTL_SECONDS,
            downloadsUsed: purchase.downloads_used + 1,
            downloadLimit: purchase.download_limit,
        });
    } catch (error) {
        console.error("digital-goods-download error", error);
        return createErrorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
    }
});
