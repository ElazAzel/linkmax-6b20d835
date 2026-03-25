import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { hostname } = await req.json()

        if (!hostname) {
            return new Response(
                JSON.stringify({ error: 'Hostname is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        console.log(`Verifying domain: ${hostname}`)

        // 1. Resolve DNS CNAME
        let isConfigured = false
        try {
            const records = await Deno.resolveDns(hostname, "CNAME")
            // Check if it points to our main domain or a specific CNAME target
            // For now, checking if it includes 'lnkmx.my'
            isConfigured = records.some(r => r.toLowerCase().includes("lnkmx.my"))

            // Fallback: Check A records if needed, but we recommend CNAME
            if (!isConfigured) {
                const aRecords = await Deno.resolveDns(hostname, "A")
                // Here we would check against our static IP if we had one
                console.log(`A records for ${hostname}:`, aRecords)
            }
        } catch (e: unknown) {
            console.warn(`DNS Resolution failed for ${hostname}:`, e instanceof Error ? e.message : String(e))
        }

        const status = isConfigured ? 'active' : 'configuring'

        // 2. Update DB status
        const { data: updateData, error: updateError } = await supabaseClient
            .from('custom_domains')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('hostname', hostname)
            .select()

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

    } catch (error) {
        console.error(`Error in verify-domain: ${error.message}`)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
