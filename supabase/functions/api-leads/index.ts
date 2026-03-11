import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function authenticateApiKey(req: Request, supabaseAdmin: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  const { data: apiKey, error } = await supabaseAdmin
    .from('user_api_keys')
    .select('user_id')
    .eq('key', token)
    .eq('status', 'active')
    .single();

  if (error || !apiKey) {
    throw new Error('Invalid or inactive API Key');
  }

  const { data: member } = await supabaseAdmin
    .from('zone_members')
    .select('zone_id')
    .eq('user_id', apiKey.user_id)
    .limit(1)
    .single();

  if (!member) {
    throw new Error('User does not belong to any zone');
  }

  return { userId: apiKey.user_id, zoneId: member.zone_id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
       throw new Error('Server configuration error');
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { userId, zoneId } = await authenticateApiKey(req, supabaseAdmin);
    
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('zone_contacts')
        .select('*')
        .eq('zone_id', zoneId)
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      
      if (!body.name) {
        return new Response(JSON.stringify({ error: 'name is required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const { data, error } = await supabaseAdmin
        .from('zone_contacts')
        .insert({
          zone_id: zoneId,
          name: body.name,
          phone: body.phone || null,
          email: body.email || null,
          company: body.company || null,
          custom_fields: body.custom_fields || {}
        })
        .select()
        .single();
        
      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }
});
