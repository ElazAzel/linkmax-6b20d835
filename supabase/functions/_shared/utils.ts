import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function createErrorResponse(error: string | Error, status = 400) {
    const message = typeof error === "string" ? error : error.message;
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

export function createSuccessResponse(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

export async function getSupabaseUser(req: Request) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) return { user: null, error: new Error("No authorization header") };

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
}
