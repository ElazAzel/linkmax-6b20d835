import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        // SECURITY: authenticate the caller — this endpoint mutates domain state.
        const authHeader = req.headers.get('Authorization') ?? ''
        if (!authHeader.startsWith('Bearer ')) {
            return json({ error: 'Unauthorized' }, 401)
        }
        const token = authHeader.slice(7).trim()
        const authClient = createClient(supabaseUrl, anonKey)
        const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token)
        const userId = claimsData?.claims?.sub
        if (claimsError || typeof userId !== 'string' || !userId) {
            return json({ error: 'Unauthorized' }, 401)
        }

        const { hostname } = await req.json()

        if (!hostname || typeof hostname !== 'string' || !/^[a-z0-9.-]{3,253}$/i.test(hostname)) {
            return json({ error: 'Valid hostname is required' }, 400)
        }

        const normalized = hostname.trim().toLowerCase()

        // SECURITY: the caller must own a page bound to this hostname.
        const supabaseClient = createClient(supabaseUrl, serviceKey)
        const { data: ownedPage } = await supabaseClient
            .from('pages')
            .select('id')
            .eq('custom_domain', normalized)
            .eq('user_id', userId)
            .maybeSingle()

        if (!ownedPage) {
            return json({ error: 'Domain not found for this account' }, 403)
        }

        // 1. Resolve DNS CNAME
        let isConfigured = false
        try {
            const records = await Deno.resolveDns(normalized, "CNAME")
            isConfigured = records.some(r => r.toLowerCase().includes("lnkmx.my"))
        } catch (e: unknown) {
            console.warn(`DNS Resolution failed:`, e instanceof Error ? e.message : String(e))
        }

        const status = isConfigured ? 'active' : 'configuring'

        return json({
            success: true,
            status,
            isConfigured,
            timestamp: new Date().toISOString(),
        })

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error(`Error in verify-domain: ${msg}`)
        return json({ error: 'Verification failed' }, 500)
    }
})
