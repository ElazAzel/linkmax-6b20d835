// LinkMAX integration keys manager (admin only).
// Stores third-party API keys server-side in public.integration_secrets.
// Values are never returned to the client — only a masked hint + metadata.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

// Only these keys can be managed from the UI.
const ALLOWED_KEYS = ["UNSPLASH_ACCESS_KEY", "PEXELS_API_KEY"] as const;
type AllowedKey = (typeof ALLOWED_KEYS)[number];

const isAllowed = (k: string): k is AllowedKey =>
  (ALLOWED_KEYS as readonly string[]).includes(k);

function mask(value: string) {
  if (value.length <= 8) return "•".repeat(value.length);
  return `${value.slice(0, 4)}${"•".repeat(6)}${value.slice(-4)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // --- auth: valid JWT + admin role ---
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return json({ error: "unauthorized" }, 401);

  const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (roleErr || isAdmin !== true) return json({ error: "forbidden" }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const action = String(body.action ?? "status");

  try {
    if (action === "status") {
      const { data, error } = await admin
        .from("integration_secrets")
        .select("key, value, updated_at")
        .in("key", ALLOWED_KEYS as unknown as string[]);
      if (error) throw error;

      const rows = data ?? [];
      const keys = ALLOWED_KEYS.map((key) => {
        const row = rows.find((r) => r.key === key);
        const envValue = Deno.env.get(key);
        return {
          key,
          configured: Boolean(row?.value) || Boolean(envValue),
          source: row?.value ? "database" : envValue ? "environment" : null,
          hint: row?.value ? mask(String(row.value)) : envValue ? mask(envValue) : null,
          updatedAt: row?.updated_at ?? null,
          editable: !row?.value && Boolean(envValue) ? true : true,
        };
      });
      return json({ keys });
    }

    if (action === "set") {
      const key = String(body.key ?? "");
      const value = String(body.value ?? "").trim();
      if (!isAllowed(key)) return json({ error: "unknown_key" }, 400);
      if (value.length < 8 || value.length > 400) return json({ error: "invalid_value" }, 400);
      if (/\s/.test(value)) return json({ error: "invalid_value" }, 400);

      const { error } = await admin.from("integration_secrets").upsert(
        { key, value, updated_at: new Date().toISOString(), updated_by: user.id },
        { onConflict: "key" },
      );
      if (error) throw error;
      return json({ ok: true, key, hint: mask(value) });
    }

    if (action === "clear") {
      const key = String(body.key ?? "");
      if (!isAllowed(key)) return json({ error: "unknown_key" }, 400);
      const { error } = await admin.from("integration_secrets").delete().eq("key", key);
      if (error) throw error;
      return json({ ok: true, key });
    }

    if (action === "test") {
      const key = String(body.key ?? "");
      if (!isAllowed(key)) return json({ error: "unknown_key" }, 400);
      const { data } = await admin
        .from("integration_secrets")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      const secret = (data?.value as string | undefined) ?? Deno.env.get(key);
      if (!secret) return json({ ok: false, reason: "not_configured" });

      const url =
        key === "UNSPLASH_ACCESS_KEY"
          ? "https://api.unsplash.com/search/photos?query=test&per_page=1"
          : "https://api.pexels.com/v1/search?query=test&per_page=1";
      const headers =
        key === "UNSPLASH_ACCESS_KEY"
          ? { Authorization: `Client-ID ${secret}` }
          : { Authorization: secret };
      const r = await fetch(url, { headers });
      return json({ ok: r.ok, status: r.status });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`integration-keys ${action} failed: ${message}`);
    return json({ error: "request_failed" }, 500);
  }
});
