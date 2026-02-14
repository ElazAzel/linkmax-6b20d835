/**
 * Public Experts API - Structured data for AI retrieval
 * GET /api/public/experts?tag=...&lang=...&limit=...
 * 
 * Returns structured JSON for AI systems to discover experts
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=1800', // 30 min cache
};

interface ExpertResponse {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  distribution: {
    '@type': string;
    contentUrl: string;
    encodingFormat: string;
  };
  dateModified: string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    item: {
      '@type': string;
      name: string;
      description?: string;
      url: string;
      image?: string;
      sameAs?: string[];
    };
  }>;
  numberOfItems: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting headers
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    const url = new URL(req.url);
    const tag = url.searchParams.get('tag');
    const lang = url.searchParams.get('lang') || 'en';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query published, indexable pages
    let query = supabase
      .from('pages')
      .select('id, slug, title, description, avatar_url, niche, updated_at, seo_meta')
      .eq('is_published', true)
      .eq('is_indexable', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (tag) {
      query = query.eq('niche', tag);
    }

    const { data: pages, error } = await query;

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    const today = new Date().toISOString();

    // Build Dataset schema response
    const response: ExpertResponse = {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: tag 
        ? `lnkmx ${tag} Experts Directory` 
        : 'lnkmx Experts Directory',
      description: 'A directory of experts, freelancers, and small businesses with public profiles on lnkmx.my',
      url: tag ? `https://lnkmx.my/experts/${tag}` : 'https://lnkmx.my/experts',
      distribution: {
        '@type': 'DataDownload',
        contentUrl: `https://lnkmx.my/api/public/experts${tag ? `?tag=${tag}` : ''}`,
        encodingFormat: 'application/json',
      },
      dateModified: today,
      numberOfItems: pages?.length || 0,
      itemListElement: (pages || []).map((page, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Person',
          name: page.title || page.slug,
          description: page.description || undefined,
          url: `https://lnkmx.my/${page.slug}`,
          image: page.avatar_url || undefined,
        },
      })),
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Experts API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
