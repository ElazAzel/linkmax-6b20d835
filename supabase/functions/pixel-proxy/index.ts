/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// ─── Rate Limiting ───────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100; // 100 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    entry.count++;
    return entry.count <= RATE_LIMIT_MAX;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
        if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
}, 5 * 60 * 1000);

// ─── In-Memory Page Cache ────────────────────────────────────────
const PAGE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const pageCache = new Map<string, { integrations: Record<string, string>; cachedAt: number }>();

// ─── Allowed Events ─────────────────────────────────────────────
const ALLOWED_EVENTS = new Set([
    'PageView', 'Lead', 'Purchase', 'InitiateCheckout',
    'SubmitForm', 'ViewContent', 'CompleteRegistration',
    'AddToCart', 'Search', 'Subscribe',
]);

// ─── Crypto Hash Helper ─────────────────────────────────────────
async function sha256(value: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(value.toLowerCase().trim());
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Facebook Conversions API ───────────────────────────────────
async function sendToFacebookCAPI(
    pixelId: string,
    accessToken: string,
    event: string,
    eventData: Record<string, unknown>,
    userData: Record<string, string>,
    sourceUrl: string,
    eventId: string,
    ipAddress: string,
    userAgent: string,
) {
    // Map platform events to FB standard events
    const fbEventMap: Record<string, string> = {
        'PageView': 'PageView',
        'Lead': 'Lead',
        'Purchase': 'Purchase',
        'InitiateCheckout': 'InitiateCheckout',
        'SubmitForm': 'Lead',
        'ViewContent': 'ViewContent',
        'CompleteRegistration': 'CompleteRegistration',
        'AddToCart': 'AddToCart',
        'Search': 'Search',
        'Subscribe': 'Subscribe',
    };

    const fbEvent = fbEventMap[event] || event;

    // Hash PII for FB CAPI
    const hashedUserData: Record<string, string> = {};
    if (userData.email) hashedUserData.em = await sha256(userData.email);
    if (userData.phone) hashedUserData.ph = await sha256(userData.phone);
    if (userData.firstName) hashedUserData.fn = await sha256(userData.firstName);
    if (userData.lastName) hashedUserData.ln = await sha256(userData.lastName);

    const payload = {
        data: [{
            event_name: fbEvent,
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId, // For deduplication with client pixel
            event_source_url: sourceUrl,
            action_source: 'website',
            user_data: {
                ...hashedUserData,
                client_ip_address: ipAddress,
                client_user_agent: userAgent,
            },
            custom_data: eventData,
        }],
    };

    try {
        const res = await fetch(
            `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );
        const result = await res.json();
        console.log(`[FB CAPI] ${fbEvent} → ${res.status}`, result);
    } catch (err) {
        console.error('[FB CAPI] Error:', err);
    }
}

// ─── TikTok Events API ─────────────────────────────────────────
async function sendToTikTokEvents(
    pixelCode: string,
    accessToken: string,
    event: string,
    eventData: Record<string, unknown>,
    userData: Record<string, string>,
    sourceUrl: string,
    eventId: string,
    ipAddress: string,
    userAgent: string,
) {
    const ttEventMap: Record<string, string> = {
        'PageView': 'Pageview',
        'Lead': 'SubmitForm',
        'Purchase': 'CompletePayment',
        'InitiateCheckout': 'InitiateCheckout',
        'SubmitForm': 'SubmitForm',
        'ViewContent': 'ViewContent',
        'CompleteRegistration': 'CompleteRegistration',
        'AddToCart': 'AddToCart',
        'Search': 'Search',
        'Subscribe': 'Subscribe',
    };

    const ttEvent = ttEventMap[event] || event;

    // Hash PII for TikTok
    const hashedEmail = userData.email ? await sha256(userData.email) : undefined;
    const hashedPhone = userData.phone ? await sha256(userData.phone) : undefined;

    const payload = {
        pixel_code: pixelCode,
        event: ttEvent,
        event_id: eventId,
        timestamp: new Date().toISOString(),
        context: {
            user_agent: userAgent,
            ip: ipAddress,
            page: {
                url: sourceUrl,
            },
            user: {
                ...(hashedEmail && { email: hashedEmail }),
                ...(hashedPhone && { phone_number: hashedPhone }),
            },
        },
        properties: eventData,
    };

    try {
        const res = await fetch(
            'https://business-api.tiktok.com/open_api/v1.3/pixel/track/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Token': accessToken,
                },
                body: JSON.stringify(payload),
            }
        );
        const result = await res.json();
        console.log(`[TT Events] ${ttEvent} → ${res.status}`, result);
    } catch (err) {
        console.error('[TT Events] Error:', err);
    }
}

// ─── GA4 Measurement Protocol ───────────────────────────────────
async function sendToGA4MP(
    measurementId: string,
    apiSecret: string,
    event: string,
    eventData: Record<string, unknown>,
    clientId: string,
) {
    const ga4EventMap: Record<string, string> = {
        'PageView': 'page_view',
        'Lead': 'generate_lead',
        'Purchase': 'purchase',
        'InitiateCheckout': 'begin_checkout',
        'SubmitForm': 'generate_lead',
        'ViewContent': 'view_item',
        'CompleteRegistration': 'sign_up',
        'AddToCart': 'add_to_cart',
        'Search': 'search',
        'Subscribe': 'subscribe',
    };

    const ga4Event = ga4EventMap[event] || event;

    const payload = {
        client_id: clientId,
        events: [{
            name: ga4Event,
            params: {
                ...eventData,
                engagement_time_msec: '1',
            },
        }],
    };

    try {
        const res = await fetch(
            `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );
        console.log(`[GA4 MP] ${ga4Event} → ${res.status}`);
    } catch (err) {
        console.error('[GA4 MP] Error:', err);
    }
}

// ─── Main Handler ───────────────────────────────────────────────
serve(async (req: Request) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // Health / warm-up endpoint
    if (req.method === 'GET') {
        const url = new URL(req.url);
        if (url.searchParams.get('warmup') === 'true') {
            return new Response('OK', { status: 200, headers: corsHeaders });
        }
        return new Response(JSON.stringify({ status: 'pixel-proxy active' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    // Rate limiting
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        req.headers.get('x-real-ip') || 'unknown';

    if (!checkRateLimit(ipAddress)) {
        return new Response(
            JSON.stringify({ error: 'Too many requests' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Return 202 Accepted immediately, process asynchronously
    const body = await req.json();
    const userAgent = req.headers.get('user-agent') || '';

    // Validate required fields
    const { pageId, event, eventData = {}, userData = {}, sourceUrl = '', clientId, eventId } = body;

    if (!pageId || !event) {
        return new Response(
            JSON.stringify({ error: 'pageId and event are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (!ALLOWED_EVENTS.has(event)) {
        return new Response(
            JSON.stringify({ error: `Invalid event: ${event}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Generate event_id for deduplication if not provided
    const deduplicationId = eventId || crypto.randomUUID();

    // Get page integrations (cached)
    let integrations: Record<string, string> = {};
    const cached = pageCache.get(pageId);
    if (cached && Date.now() - cached.cachedAt < PAGE_CACHE_TTL_MS) {
        integrations = cached.integrations;
    } else {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: page } = await supabase
            .from('pages')
            .select('integrations')
            .eq('id', pageId)
            .single();

        integrations = page?.integrations || {};
        pageCache.set(pageId, { integrations, cachedAt: Date.now() });
    }

    // Get platform-level API secrets
    const fbAccessToken = Deno.env.get('FB_CAPI_ACCESS_TOKEN');
    const ttAccessToken = Deno.env.get('TT_EVENTS_ACCESS_TOKEN');
    const ga4Secret = Deno.env.get('GA4_MP_API_SECRET');

    // Fire-and-forget all API calls
    const promises: Promise<void>[] = [];

    // Facebook CAPI
    if (integrations.fb_pixel && fbAccessToken) {
        promises.push(
            sendToFacebookCAPI(
                integrations.fb_pixel, fbAccessToken, event, eventData,
                userData, sourceUrl, deduplicationId, ipAddress, userAgent
            )
        );
    }

    // TikTok Events API
    if (integrations.tt_pixel && ttAccessToken) {
        promises.push(
            sendToTikTokEvents(
                integrations.tt_pixel, ttAccessToken, event, eventData,
                userData, sourceUrl, deduplicationId, ipAddress, userAgent
            )
        );
    }

    // GA4 Measurement Protocol
    if (integrations.ga4_id && ga4Secret) {
        promises.push(
            sendToGA4MP(
                integrations.ga4_id, ga4Secret, event, eventData,
                clientId || crypto.randomUUID()
            )
        );
    }

    if (promises.length === 0) {
        return new Response(
            JSON.stringify({ status: 'no_integrations', message: 'No server-side pixel integrations configured or missing API secrets' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Process all API calls (don't block response)
    // Using waitUntil pattern for Deno Deploy — wrap in try/catch
    Promise.allSettled(promises)
        .then(results => {
            const failed = results.filter(r => r.status === 'rejected');
            if (failed.length > 0) {
                console.error(`[pixel-proxy] ${failed.length}/${results.length} API call(s) failed`);
            } else {
                console.log(`[pixel-proxy] ${results.length} API call(s) succeeded for event=${event}`);
            }
        })
        .catch(err => console.error('[pixel-proxy] Unexpected error:', err));

    return new Response(
        JSON.stringify({ status: 'accepted', eventId: deduplicationId, apis: promises.length }),
        { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
});
