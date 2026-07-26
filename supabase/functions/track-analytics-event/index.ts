/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin, Access-Control-Request-Headers",
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAGE_EVENT_TYPES = new Set(["view", "click", "share", "session_end", "heatmap_clicks", "heatmap_scroll", "heatmap_rage_clicks"]);
const MARKETING_EVENT_TYPES = new Set([
  "landing_view", "landing_scroll", "landing_section_view", "landing_exit", "cta_create_click", "cta_gallery_click", "cta_login_click", "cta_pricing_click", "pricing_toggle", "signup_start", "hero_primary_cta_click", "hero_secondary_cta_click", "how_it_works_view", "pricing_view", "faq_expand", "alternatives_view", "alternatives_cta_click", "niche_landing_view", "niche_landing_cta_click", "signup_from_landing", "signup_from_niche_landing", "signup_from_alternatives",
]);
const ALLOWED_EVENT_TYPES = new Set([...PAGE_EVENT_TYPES, ...MARKETING_EVENT_TYPES]);
const RATE_LIMIT_REQUESTS = 120;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_BODY_BYTES = 16 * 1024;

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") return value.slice(0, 500);
  if (depth >= 4) return undefined;
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeValue(item, depth + 1)).filter((item) => item !== undefined);
  if (typeof value === "object" && value) {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value).slice(0, 40)) {
      if (!/^[a-zA-Z][a-zA-Z0-9_:-]{0,63}$/.test(key)) continue;
      if (/^(email|phone|password|token|authorization|cookie|useragent|referrer)$/i.test(key)) continue;
      const sanitized = sanitizeValue(item, depth + 1);
      if (sanitized !== undefined) result[key] = sanitized;
    }
    return result;
  }
  return undefined;
}

function sanitizeMetadata(value: unknown): Record<string, unknown> {
  const sanitized = sanitizeValue(value);
  return sanitized && typeof sanitized === "object" && !Array.isArray(sanitized) ? sanitized as Record<string, unknown> : {};
}

function isNamespacedEvent(eventType: string) {
  return /^(editor|auth|activation):[a-z][a-z0-9_:-]{0,79}$/.test(eventType);
}

function isAuthenticatedEditorEvent(eventType: string) {
  return /^editor:[a-z][a-z0-9_:-]{0,79}$/.test(eventType);
}

async function hasAuthenticatedUser(supabaseUrl: string, apiKey: string, authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) return false;
  const authClient = createClient(supabaseUrl, apiKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user } } = await authClient.auth.getUser();
  return Boolean(user);
}

async function checkRateLimit(supabase: ReturnType<typeof createClient>, ipAddress: string) {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();
  const endpoint = "track-analytics-event";
  await supabase.from("rate_limits").delete().lt("window_start", windowStart);
  const { data: existing } = await supabase.from("rate_limits").select("id, request_count").eq("ip_address", ipAddress).eq("endpoint", endpoint).gte("window_start", windowStart).maybeSingle();
  if (existing) {
    if (existing.request_count >= RATE_LIMIT_REQUESTS) return false;
    await supabase.from("rate_limits").update({ request_count: existing.request_count + 1 }).eq("id", existing.id);
    return true;
  }
  await supabase.from("rate_limits").insert({ ip_address: ipAddress, endpoint, request_count: 1, window_start: new Date().toISOString() });
  return true;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...corsHeaders, "Content-Length": "0" } });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  if (Number(req.headers.get("content-length") || 0) > MAX_BODY_BYTES) return jsonResponse({ error: "Payload too large" }, 413);
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !serviceRoleKey || !publishableKey) return jsonResponse({ error: "Service misconfigured" }, 500);
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
    if (!await checkRateLimit(supabase, ipAddress)) return jsonResponse({ error: "Too many requests" }, 429);
    const payload = await req.json();
    const pageId = typeof payload.pageId === "string" ? payload.pageId : null;
    const blockId = typeof payload.blockId === "string" && UUID_RE.test(payload.blockId) ? payload.blockId : null;
    const eventType = typeof payload.eventType === "string" ? payload.eventType : "";
    if (!ALLOWED_EVENT_TYPES.has(eventType) && !isNamespacedEvent(eventType)) return jsonResponse({ error: "Unsupported event type" }, 400);
    if (isAuthenticatedEditorEvent(eventType) && !await hasAuthenticatedUser(supabaseUrl, publishableKey, req.headers.get("authorization"))) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }
    if (pageId && !UUID_RE.test(pageId)) return jsonResponse({ error: "Invalid page id" }, 400);
    if (!pageId && !MARKETING_EVENT_TYPES.has(eventType) && !eventType.startsWith("auth:") && !isAuthenticatedEditorEvent(eventType)) {
      return jsonResponse({ error: "Page id is required" }, 400);
    }
    if (pageId) {
      const { data: page } = await supabase.from("pages").select("id").eq("id", pageId).eq("is_published", true).maybeSingle();
      if (!page) return jsonResponse({ error: "Unknown page" }, 404);
    }
    const { error } = await supabase.from("analytics").insert({ page_id: pageId, block_id: blockId, event_type: eventType, metadata: sanitizeMetadata(payload.metadata) });
    if (error) return jsonResponse({ error: "Could not record event" }, 500);
    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    console.error("Analytics ingestion failed", error);
    return jsonResponse({ error: "Invalid analytics request" }, 400);
  }
});
