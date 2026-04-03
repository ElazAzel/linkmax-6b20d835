import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: req.headers.get("Authorization")! },
                },
            }
        );

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            throw new Error("Unauthorized");
        }

        const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
        const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            return new Response(JSON.stringify({ error: "Google Calendar not configured" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 503,
            });
        }

        const { action, payload } = await req.json();

        // ─── Generate Google OAuth URL ───
        if (action === "get_auth_url") {
            const { redirect_url } = payload;
            if (!redirect_url) throw new Error("Missing redirect_url");

            const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
            const callbackUrl = `${supabaseUrl}/functions/v1/gcal-callback`;

            // Build HMAC-signed state
            const ts = Date.now();
            const dataToSign = `${user.id}:${redirect_url}:${ts}`;

            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
                "raw",
                encoder.encode(GOOGLE_CLIENT_SECRET),
                { name: "HMAC", hash: "SHA-256" },
                false,
                ["sign"]
            );
            const sigBuffer = await crypto.subtle.sign(
                "HMAC",
                key,
                encoder.encode(dataToSign)
            );
            const sig = base64Encode(new Uint8Array(sigBuffer) as unknown as ArrayBuffer);

            const stateObj = {
                user_id: user.id,
                redirect_url,
                ts,
                sig,
            };
            const stateB64 = base64Encode(
                encoder.encode(JSON.stringify(stateObj)) as unknown as ArrayBuffer
            );

            const authUrl = new URL(GOOGLE_AUTH_URL);
            authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
            authUrl.searchParams.set("redirect_uri", callbackUrl);
            authUrl.searchParams.set("response_type", "code");
            authUrl.searchParams.set("scope", CALENDAR_SCOPE);
            authUrl.searchParams.set("access_type", "offline");
            authUrl.searchParams.set("prompt", "consent");
            authUrl.searchParams.set("state", stateB64);

            return new Response(JSON.stringify({ auth_url: authUrl.toString() }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // ─── Exchange OAuth code for tokens ───
        if (action === "exchange_code") {
            const { code, redirect_uri } = payload;
            if (!code || !redirect_uri) throw new Error("Missing code or redirect_uri");

            const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    code,
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    redirect_uri,
                    grant_type: "authorization_code",
                }),
            });

            const tokens = await tokenRes.json();
            if (tokens.error) throw new Error(tokens.error_description || tokens.error);

            // Save tokens via RPC
            await supabaseAdmin.rpc("set_user_integration_tokens", {
                p_user_id: user.id,
                p_provider: "google_calendar",
                p_access_token: tokens.access_token,
                p_refresh_token: tokens.refresh_token || null,
                p_expires_at: tokens.expires_in
                    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
                    : null,
            });

            // Update status table
            await supabaseAdmin
                .from("user_integrations_status")
                .upsert({
                    user_id: user.id,
                    provider: "google_calendar",
                    is_connected: true,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "user_id,provider" });

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // ─── Disconnect Google Calendar ───
        if (action === "disconnect") {
            // Revoke token at Google (best effort)
            try {
                const tokenData = await supabaseAdmin.rpc("get_user_integration_tokens", {
                    p_user_id: user.id,
                    p_provider: "google_calendar",
                });

                if (tokenData.data?.access_token) {
                    await fetch(
                        `https://oauth2.googleapis.com/revoke?token=${tokenData.data.access_token}`,
                        { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } }
                    ).catch(() => { }); // Best effort
                }
            } catch {
                // Ignore revocation errors
            }

            // Delete tokens from DB
            await supabaseAdmin.rpc("delete_user_integration", {
                p_user_id: user.id,
                p_provider: "google_calendar",
            });

            // Disable gcal_sync_enabled on user_profiles
            await supabaseAdmin
                .from("user_profiles")
                .update({ gcal_sync_enabled: false })
                .eq("id", user.id);

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // ─── Check availability (pull busy slots) ───
        if (action === "check_availability") {
            const { time_min, time_max, staff_id, owner_id } = payload;
            const targetId = staff_id ? { staffId: staff_id } : { userId: owner_id || user.id };
            const accessToken = await getAccessToken(supabaseAdmin, targetId, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

            if (!accessToken) {
                return new Response(JSON.stringify({ error: "Not connected to Google Calendar", connected: false }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 401,
                });
            }

            let calendarId = "primary";
            if (staff_id) {
                const { data: staff } = await supabaseAdmin
                    .from("zone_staff")
                    .select("gcal_calendar_id")
                    .eq("id", staff_id)
                    .single();
                if (staff?.gcal_calendar_id) calendarId = staff.gcal_calendar_id;
            }

            const calRes = await fetch(
                `${GOOGLE_CALENDAR_API}/freeBusy`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        timeMin: time_min,
                        timeMax: time_max,
                        items: [{ id: calendarId }],
                    }),
                }
            );

            const calData = await calRes.json();
            const busySlots = calData?.calendars?.[calendarId]?.busy || [];

            return new Response(JSON.stringify({ blocked_slots: busySlots }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // ─── Create event in Google Calendar ───
        if (action === "create_event") {
            const { summary, description, start, end, location, timezone, staff_id, owner_id } = payload;
            const targetId = staff_id ? { staffId: staff_id } : { userId: owner_id || user.id };
            const accessToken = await getAccessToken(supabaseAdmin, targetId, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

            if (!accessToken) {
                return new Response(JSON.stringify({ error: "Not connected to Google Calendar", connected: false }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 401,
                });
            }

            let calendarId = "primary";
            if (staff_id) {
                const { data: staff } = await supabaseAdmin
                    .from("zone_staff")
                    .select("gcal_calendar_id")
                    .eq("id", staff_id)
                    .single();
                if (staff?.gcal_calendar_id) calendarId = staff.gcal_calendar_id;
            }

            const eventRes = await fetch(
                `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        summary,
                        description,
                        location,
                        start: { dateTime: start, timeZone: timezone || "UTC" },
                        end: { dateTime: end, timeZone: timezone || "UTC" },
                    }),
                }
            );

            const eventData = await eventRes.json();

            if (eventData.error) {
                throw new Error(eventData.error.message || "Failed to create event");
            }

            return new Response(JSON.stringify({ success: true, event_id: eventData.id }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // ─── Push booking to Google Calendar ───
        if (action === "push_booking") {
            const { booking_id, staff_id } = payload;
            
            // Fetch booking details
            const { data: booking, error: bErr } = await supabaseAdmin
                .from("bookings")
                .select("*")
                .eq("id", booking_id)
                .single();

            if (bErr || !booking) throw new Error("Booking not found");

            const finalStaffId = staff_id || booking.staff_id;
            const targetId = finalStaffId ? { staffId: finalStaffId } : { userId: booking.owner_id };
            const accessToken = await getAccessToken(supabaseAdmin, targetId, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

            if (!accessToken) {
                return new Response(JSON.stringify({ error: "Not connected", connected: false }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 401,
                });
            }

            let calendarId = "primary";
            if (finalStaffId) {
                const { data: staff } = await supabaseAdmin
                    .from("zone_staff")
                    .select("gcal_calendar_id")
                    .eq("id", finalStaffId)
                    .single();
                if (staff?.gcal_calendar_id) calendarId = staff.gcal_calendar_id;
            }

            const startDT = `${booking.slot_date}T${booking.slot_time}`;
            const endDT = booking.slot_end_time
                ? `${booking.slot_date}T${booking.slot_end_time}`
                : new Date(new Date(startDT).getTime() + 3600000).toISOString();

            const eventRes = await fetch(
                `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        summary: `Booking: ${booking.client_name}`,
                        description: [
                            booking.client_email && `Email: ${booking.client_email}`,
                            booking.client_phone && `Phone: ${booking.client_phone}`,
                            booking.client_notes && `Notes: ${booking.client_notes}`,
                        ].filter(Boolean).join("\n"),
                        start: { dateTime: startDT, timeZone: "UTC" },
                        end: { dateTime: endDT, timeZone: "UTC" },
                    }),
                }
            );

            const eventData = await eventRes.json();

            return new Response(JSON.stringify({ success: true, event_id: eventData.id }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ error: "Unknown action" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    } catch (error: unknown) {
        console.error(error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});

/**
 * Get a valid access token, refreshing if needed.
 */
async function getAccessToken(
    supabaseAdmin: any,
    target: { userId?: string; staffId?: string },
    clientId: string,
    clientSecret: string
): Promise<string | null> {
    let targetUserId = target.userId;

    // If staffId is provided, look up the user_id for that staff
    if (target.staffId) {
        const { data: staff } = await supabaseAdmin
            .from("zone_staff")
            .select("user_id")
            .eq("id", target.staffId)
            .single();
        if (staff?.user_id) {
            targetUserId = staff.user_id;
        } else {
            return null; // Virtual staff without user_id cannot have OAuth tokens
        }
    }

    if (!targetUserId) return null;

    const { data, error } = await supabaseAdmin.rpc("get_user_integration_tokens", {
        p_user_id: targetUserId,
        p_provider: "google_calendar",
    });

    if (!data || error) return null;

    // RPC returns a table, so data may be an array
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    const { access_token, refresh_token, expires_at } = row;

    // Check if token is still valid (with 5 min buffer)
    if (expires_at && new Date(expires_at).getTime() > Date.now() + 5 * 60 * 1000) {
        return access_token;
    }

    // Refresh the token
    if (!refresh_token) return null;

    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            refresh_token,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
        }),
    });

    const refreshData = await refreshRes.json();
    if (refreshData.error) return null;

    // Update stored token
    await supabaseAdmin.rpc("set_user_integration_tokens", {
        p_user_id: targetUserId,
        p_provider: "google_calendar",
        p_access_token: refreshData.access_token,
        p_refresh_token: refresh_token, // Keep existing refresh token
        p_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
    }).catch(() => { });

    return refreshData.access_token;
}
