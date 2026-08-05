import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HOSTNAME_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        // 1. Require a valid authenticated caller
        const authHeader = req.headers.get('Authorization') ?? ''
        const token = authHeader.replace(/^Bearer\s+/i, '')
        if (!token) {
            return new Response(
                JSON.stringify({ error: 'unauthorized' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        const authClient = createClient(supabaseUrl, anonKey)
        const { data: userData, error: userError } = await authClient.auth.getUser(token)
        const userId = userData?.user?.id
        if (userError || !userId) {
            return new Response(
                JSON.stringify({ error: 'unauthorized' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        const body = await req.json().catch(() => ({}))
        const hostname = typeof body?.hostname === 'string' ? body.hostname.trim().toLowerCase() : ''

        if (!hostname || !HOSTNAME_RE.test(hostname)) {
            return new Response(
                JSON.stringify({ error: 'Valid hostname is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        const supabaseClient = createClient(supabaseUrl, serviceKey)

        // 2. Ownership check — the caller must own this custom domain row
        const { data: domainRow } = await supabaseClient
            .from('custom_domains')
            .select('id, user_id')
            .eq('hostname', hostname)
            .maybeSingle()

        if (!domainRow || domainRow.user_id !== userId) {
            return new Response(
                JSON.stringify({ error: 'not_found_or_forbidden' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
            )
        }

        // 3. Resolve DNS CNAME
        let isConfigured = false
        try {
            const records = await Deno.resolveDns(hostname, "CNAME")
            isConfigured = records.some(r => r.toLowerCase().includes("lnkmx.my"))

            if (!isConfigured) {
                await Deno.resolveDns(hostname, "A")
            }
        } catch (e: unknown) {
            console.warn(`DNS Resolution failed:`, e instanceof Error ? e.message : String(e))
        }

        const status = isConfigured ? 'active' : 'configuring'

        // 4. Update DB status for the caller's own domain only
        const { error: updateError } = await supabaseClient
            .from('custom_domains')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', domainRow.id)
            .eq('user_id', userId)

        if (updateError) {
            throw updateError
        }

        return new Response(
            JSON.stringify({
                success: true,
                status,
                isConfigured,
                timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: unknown) {
        console.error(`Error in verify-domain:`, error instanceof Error ? error.message : String(error))
        return new Response(
            JSON.stringify({ error: 'server_error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
