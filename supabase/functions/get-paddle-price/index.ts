import { gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';
import { getSupabaseUser } from '../_shared/utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function resolvePaddlePrice(priceId: string, environment: PaddleEnv): Promise<string> {
  const response = await gatewayFetch(environment, `/prices?external_id=${encodeURIComponent(priceId)}`);
  const data = await response.json();
  if (!data.data?.length) throw new Error(`Price not found: ${priceId}`);
  return data.data[0].id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user } = await getSupabaseUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { priceId, environment } = await req.json();
    if (typeof priceId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(priceId)) {
      return new Response(JSON.stringify({ error: 'priceId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const serverEnv = Deno.env.get('PADDLE_ENV');
    const env: PaddleEnv = serverEnv === 'live' || serverEnv === 'sandbox' ? serverEnv : (environment === 'live' ? 'live' : 'sandbox');
    const paddleId = await resolvePaddlePrice(priceId, env);
    return new Response(JSON.stringify({ paddleId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Price lookup failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
