import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

/**
 * gcal-callback — OAuth 2.0 callback handler for Google Calendar
 *
 * Google redirects here after user consents:
 *   GET /functions/v1/gcal-callback?code=AUTH_CODE&state=BASE64_STATE
 *
 * State payload (base64-encoded JSON):
 *   { user_id, redirect_url, ts, sig }
 *
 * Flow:
 *   1. Validate state signature (HMAC-SHA256)
 *   2. Exchange code for tokens with Google
 *   3. Store tokens via RPC set_user_integration_tokens
 *   4. Update user_integrations_status
 *   5. Redirect user back to redirect_url?gcal_connected=true
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

serve(async (req) => {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const HMAC_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "gcal-hmac-fallback";

    // Default fallback redirect
    const fallbackRedirect = url.origin.replace(
        /\.supabase\.co$/,
        "" // Will be overridden by state
    );

    // Handle error from Google
    if (error) {
        console.error("Google OAuth error:", error);
        return Response.redirect(
            `${fallbackRedirect}/dashboard/settings?gcal_error=${encodeURIComponent(error)}`,
            302
        );
    }

    if (!code || !stateParam) {
        return new Response("Missing code or state parameter", { status: 400 });
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return new Response("Google Calendar not configured on server", { status: 503 });
    }

    try {
        // Decode and validate state
        const stateStr = new TextDecoder().decode(base64Decode(stateParam));
        const state = JSON.parse(stateStr);
        const { user_id, redirect_url, ts, sig } = state;

        if (!user_id || !redirect_url) {
            throw new Error("Invalid state: missing user_id or redirect_url");
        }

        // Verify HMAC signature
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(HMAC_SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );

        const dataToVerify = `${user_id}:${redirect_url}:${ts}`;
        const sigBytes = base64Decode(sig);
        const isValid = await crypto.subtle.verify(
            "HMAC",
            key,
            sigBytes,
            encoder.encode(dataToVerify)
        );

        if (!isValid) {
            throw new Error("Invalid state signature");
        }

        // Check timestamp (allow 10 min window)
        if (Date.now() - ts > 10 * 60 * 1000) {
            throw new Error("State expired");
        }

        // Build the redirect_uri (must match what was used when generating auth URL)
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const callbackUrl = `${supabaseUrl}/functions/v1/gcal-callback`;

        // Exchange code for tokens
        const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: callbackUrl,
                grant_type: "authorization_code",
            }),
        });

        const tokens = await tokenRes.json();

        if (tokens.error) {
            console.error("Token exchange error:", tokens);
            const errorMsg = tokens.error_description || tokens.error;
            return Response.redirect(
                `${redirect_url}?gcal_error=${encodeURIComponent(errorMsg)}`,
                302
            );
        }

        // Store tokens using service_role
        const supabaseAdmin = createClient(
            supabaseUrl,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Save tokens via RPC
        const { error: rpcError } = await supabaseAdmin.rpc("set_user_integration_tokens", {
            p_user_id: user_id,
            p_provider: "google_calendar",
            p_access_token: tokens.access_token,
            p_refresh_token: tokens.refresh_token || null,
            p_expires_at: tokens.expires_in
                ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
                : null,
        });

        if (rpcError) {
            console.error("RPC set_user_integration_tokens error:", rpcError);
        }

        // Update status table
        await supabaseAdmin
            .from("user_integrations_status")
            .upsert(
                {
                    user_id,
                    provider: "google_calendar",
                    is_connected: true,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id,provider" }
            );

        // Enable gcal_sync_enabled on user_profiles
        await supabaseAdmin
            .from("user_profiles")
            .update({ gcal_sync_enabled: true })
            .eq("id", user_id);

        console.log(`Google Calendar connected for user ${user_id}`);

        // Redirect back to the app
        return Response.redirect(`${redirect_url}?gcal_connected=true`, 302);
    } catch (err) {
        console.error("gcal-callback error:", err);
        return new Response(
            `Error processing Google Calendar callback: ${err.message}`,
            { status: 500 }
        );
    }
});
