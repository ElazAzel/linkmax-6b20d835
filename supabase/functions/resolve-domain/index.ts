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

        // Check custom_domains table
        const { data: domainData, error: domainError } = await supabaseClient
            .from('custom_domains')
            .select('page_id, hostname, status')
            .eq('hostname', hostname)
            .eq('status', 'active')
            .single()

        if (domainError || !domainData) {
            console.log(`No active custom domain found for ${hostname}`);
            return new Response(
                JSON.stringify({ found: false }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            )
        }

        // Get page slug
        const { data: pageData, error: pageError } = await supabaseClient
            .from('pages')
            .select('slug, id')
            .eq('id', domainData.page_id)
            .single()

        if (pageError || !pageData) {
            return new Response(
                JSON.stringify({ error: 'Linked page not found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            )
        }

        return new Response(
            JSON.stringify({
                found: true,
                slug: pageData.slug,
                page_id: pageData.id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
