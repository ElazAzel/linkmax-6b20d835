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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const health: Record<string, any> = {
        status: "ok",
        timestamp: new Date().toISOString(),
        services: {
            database: "unknown",
            storage: "unknown",
            env_vars: "ok",
        },
    };

    try {
        // 1. Check Database
        const { error: dbError } = await supabase.from("pages").select("count", { count: "exact", head: true });
        health.services.database = dbError ? `error: ${dbError.message}` : "online";
        if (dbError) health.status = "error";

        // 2. Check Required Env Vars
        const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "TELEGRAM_BOT_TOKEN"];
        const missingVars = requiredEnvVars.filter((v) => !Deno.env.get(v));
        if (missingVars.length > 0) {
            health.services.env_vars = `missing: ${missingVars.join(", ")}`;
            health.status = "error";
        }

        // 3. Check Storage (Optional check if bucket exists)
        const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
        health.services.storage = storageError ? `error: ${storageError.message}` : "online";
        if (storageError) health.status = "error";

    } catch (err: unknown) {
        health.status = "error";
        health.error = err instanceof Error ? err.message : String(err);
    }

    return new Response(JSON.stringify(health), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: health.status === "ok" ? 200 : 500,
    });
});
