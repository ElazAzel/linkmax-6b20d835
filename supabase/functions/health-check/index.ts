/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Admin auth required — health internals leak server posture
    const authHeader = req.headers.get("Authorization");
    let isAdmin = false;
    if (authHeader?.startsWith("Bearer ")) {
        try {
            const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
                global: { headers: { Authorization: authHeader } },
            });
            const token = authHeader.replace("Bearer ", "");
            const { data: claimsData } = await supabaseAuth.auth.getClaims(token);
            const userId = claimsData?.claims?.sub as string | undefined;
            if (userId) {
                const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
                isAdmin = !!data;
            }
        } catch { /* ignore */ }
    }
    if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const health: Record<string, unknown> = {
        status: "ok",
        timestamp: new Date().toISOString(),
        services: { database: "unknown", storage: "unknown", env_vars: "ok" },
    };
    const services = health.services as Record<string, string>;

    try {
        const { error: dbError } = await supabase.from("pages").select("count", { count: "exact", head: true });
        services.database = dbError ? "error" : "online";
        if (dbError) health.status = "error";

        const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "TELEGRAM_BOT_TOKEN"];
        const missingCount = requiredEnvVars.filter((v) => !Deno.env.get(v)).length;
        if (missingCount > 0) {
            // Do not leak specific env var names to clients
            services.env_vars = `missing:${missingCount}`;
            health.status = "error";
        }

        const { error: storageError } = await supabase.storage.listBuckets();
        services.storage = storageError ? "error" : "online";
        if (storageError) health.status = "error";
    } catch (err: unknown) {
        health.status = "error";
        health.error = err instanceof Error ? "internal error" : "internal error";
        console.error("health-check error", err);
    }

    return new Response(JSON.stringify(health), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: health.status === "ok" ? 200 : 500,
    });
});
