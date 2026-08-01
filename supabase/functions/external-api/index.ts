// LinkMAX External API gateway
// Single entry point for all third-party public APIs (public-apis inspired).
// - provider allowlist (no SSRF: hosts are hardcoded)
// - shared TTL cache in public.external_api_cache
// - graceful degradation when an API key secret is missing
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

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const FETCH_TIMEOUT_MS = 8000;

async function safeFetch(url: string, init: RequestInit = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

async function cacheGet(key: string): Promise<unknown | null> {
  const { data } = await admin
    .from("external_api_cache")
    .select("payload, expires_at")
    .eq("cache_key", key)
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at as string).getTime() < Date.now()) return null;
  return data.payload;
}

async function cacheSet(key: string, payload: unknown, ttlSeconds: number) {
  const expires = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await admin
    .from("external_api_cache")
    .upsert({ cache_key: key, payload, expires_at: expires }, { onConflict: "cache_key" });
}

async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const hit = await cacheGet(key);
  if (hit !== null) return hit as T;
  const fresh = await load();
  await cacheSet(key, fresh, ttl);
  return fresh;
}

/* ---------------------------- providers ---------------------------- */

type Photo = {
  id: string;
  url: string;
  thumb: string;
  width: number;
  height: number;
  author: string;
  authorUrl: string;
  provider: "unsplash" | "pexels";
};

async function stockPhotos(query: string, page: number): Promise<{ photos: Photo[]; providers: string[] }> {
  const unsplashKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
  const pexelsKey = Deno.env.get("PEXELS_API_KEY");
  const photos: Photo[] = [];
  const providers: string[] = [];

  if (unsplashKey) {
    providers.push("unsplash");
    const r = await safeFetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=18&page=${page}`,
      { headers: { Authorization: `Client-ID ${unsplashKey}` } },
    );
    if (r.ok) {
      const d = await r.json();
      for (const p of d.results ?? []) {
        photos.push({
          id: `u_${p.id}`,
          url: p.urls?.regular,
          thumb: p.urls?.small,
          width: p.width,
          height: p.height,
          author: p.user?.name ?? "Unsplash",
          authorUrl: p.user?.links?.html ?? "https://unsplash.com",
          provider: "unsplash",
        });
      }
    } else {
      console.error(`unsplash ${r.status}: ${await r.text()}`);
    }
  }

  if (pexelsKey) {
    providers.push("pexels");
    const r = await safeFetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=18&page=${page}`,
      { headers: { Authorization: pexelsKey } },
    );
    if (r.ok) {
      const d = await r.json();
      for (const p of d.photos ?? []) {
        photos.push({
          id: `p_${p.id}`,
          url: p.src?.large,
          thumb: p.src?.medium,
          width: p.width,
          height: p.height,
          author: p.photographer ?? "Pexels",
          authorUrl: p.photographer_url ?? "https://pexels.com",
          provider: "pexels",
        });
      }
    } else {
      console.error(`pexels ${r.status}: ${await r.text()}`);
    }
  }

  return { photos, providers };
}

async function linkPreview(target: string) {
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    throw new Error("invalid_url");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("invalid_scheme");
  // Block obvious internal targets (defense in depth — microlink fetches remotely anyway)
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[?::1)/i.test(parsed.hostname)) {
    throw new Error("blocked_host");
  }

  const r = await safeFetch(
    `https://api.microlink.io/?url=${encodeURIComponent(parsed.toString())}&palette=true`,
  );
  if (!r.ok) throw new Error(`microlink ${r.status}: ${await r.text()}`);
  const d = await r.json();
  const data = d.data ?? {};
  return {
    url: data.url ?? parsed.toString(),
    title: data.title ?? null,
    description: data.description ?? null,
    image: data.image?.url ?? null,
    logo: data.logo?.url ?? null,
    publisher: data.publisher ?? null,
    color: data.image?.color ?? null,
  };
}

const SCREENSHOT_ALLOWED_HOSTS = ["lnkmx.my", "www.lnkmx.my", "linkmax.lovable.app"];

function screenshotUrl(target: string, width: number) {
  const parsed = new URL(target);
  if (!SCREENSHOT_ALLOWED_HOSTS.includes(parsed.hostname)) throw new Error("blocked_host");
  return `https://image.thum.io/get/width/${width}/crop/1200/noanimate/${parsed.toString()}`;
}

async function holidays(countryCode: string, year: number) {
  const cc = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) throw new Error("invalid_country");
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error("invalid_year");
  const r = await safeFetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${cc}`);
  if (!r.ok) throw new Error(`nager ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return (d ?? []).map((h: Record<string, unknown>) => ({
    date: h.date,
    name: h.localName ?? h.name,
    global: h.global ?? true,
  }));
}

async function countries() {
  const r = await safeFetch(
    "https://restcountries.com/v3.1/all?fields=cca2,idd,flag,translations,name",
  );
  if (!r.ok) throw new Error(`restcountries ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return (d ?? [])
    .map((c: Record<string, any>) => ({
      code: c.cca2,
      flag: c.flag,
      name: c.name?.common,
      nameRu: c.translations?.rus?.common ?? c.name?.common,
      dial: c.idd?.root ? `${c.idd.root}${(c.idd.suffixes ?? [])[0] ?? ""}` : null,
    }))
    .filter((c: { code?: string; dial: string | null }) => c.code && c.dial)
    .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
}

async function geoIp(ip: string) {
  if (!/^[0-9a-fA-F:.]{3,45}$/.test(ip)) throw new Error("invalid_ip");
  const r = await safeFetch(`https://ipwho.is/${ip}?fields=success,country_code,country,city,timezone`);
  if (!r.ok) throw new Error(`ipwho ${r.status}`);
  const d = await r.json();
  if (!d.success) return null;
  return {
    country: d.country ?? null,
    countryCode: d.country_code ?? null,
    city: d.city ?? null,
    timezone: d.timezone?.id ?? null,
  };
}

/* ---------------------------- handler ---------------------------- */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const action = String(body.action ?? "");

  // Actions that consume paid quota / expose editor features require an authenticated user
  const AUTH_ACTIONS = new Set(["stock_photos", "link_preview", "screenshot"]);
  if (AUTH_ACTIONS.has(action)) {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "unauthorized" }, 401);
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) return json({ error: "unauthorized" }, 401);
  }

  try {
    switch (action) {
      case "stock_photos": {
        const query = String(body.query ?? "").trim().slice(0, 80);
        const page = Math.min(Math.max(Number(body.page ?? 1) || 1, 1), 10);
        if (!query) return json({ photos: [], providers: [] });
        const result = await cached(`photos:${query.toLowerCase()}:${page}`, 60 * 60 * 24, () =>
          stockPhotos(query, page),
        );
        if (result.providers.length === 0) {
          return json({ photos: [], providers: [], unavailable: true });
        }
        return json(result);
      }
      case "link_preview": {
        const url = String(body.url ?? "");
        const result = await cached(`preview:${url}`, 60 * 60 * 24 * 3, () => linkPreview(url));
        return json(result);
      }
      case "screenshot": {
        const url = String(body.url ?? "");
        const width = Math.min(Math.max(Number(body.width ?? 600) || 600, 200), 1600);
        return json({ url: screenshotUrl(url, width) });
      }
      case "holidays": {
        const cc = String(body.country ?? "RU");
        const year = Number(body.year ?? new Date().getFullYear());
        const result = await cached(`holidays:${cc}:${year}`, 60 * 60 * 24 * 30, () =>
          holidays(cc, year),
        );
        return json({ holidays: result });
      }
      case "countries": {
        const result = await cached("countries:v1", 60 * 60 * 24 * 30, countries);
        return json({ countries: result });
      }
      case "geo_ip": {
        const ip =
          String(body.ip ?? "") ||
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "";
        if (!ip) return json({ geo: null });
        const result = await cached(`geo:${ip}`, 60 * 60 * 24, () => geoIp(ip));
        return json({ geo: result });
      }
      default:
        return json({ error: "unknown_action" }, 400);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`external-api ${action} failed: ${message}`);
    const status = /invalid_|blocked_host/.test(message) ? 400 : 502;
    return json({ error: "provider_request_failed", details: message }, status);
  }
});
