import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_REQUESTS = 10; // 10 requests per minute (more restrictive for streaming)
const RATE_LIMIT_WINDOW = 60; // 60 seconds

async function checkRateLimit(supabase: any, ipAddress: string, endpoint: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW * 1000);
  
  // Clean up old entries
  await supabase
    .from('rate_limits')
    .delete()
    .lt('window_start', windowStart.toISOString());
  
  // Get current rate limit entry
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('ip_address', ipAddress)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .single();
  
  if (existing) {
    if (existing.request_count >= RATE_LIMIT_REQUESTS) {
      return false; // Rate limit exceeded
    }
    
    // Update count
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);
  } else {
    // Create new entry
    await supabase
      .from('rate_limits')
      .insert({
        ip_address: ipAddress,
        endpoint: endpoint,
        request_count: 1,
        window_start: new Date().toISOString()
      });
  }
  
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract IP address
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    
    // Initialize Supabase client
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Check rate limit
    const allowed = await checkRateLimit(supabase, ipAddress, 'chatbot-stream');
    if (!allowed) {
      console.log(`Rate limit exceeded for IP: ${ipAddress}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again in a minute.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { pageSlug, messages } = await req.json();
    
    if (!pageSlug || !messages) {
      throw new Error('Missing required parameters');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch page data
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('id, title, description, avatar_url, chatbot_context')
      .eq('slug', pageSlug)
      .eq('is_published', true)
      .single();

    if (pageError || !page) {
      throw new Error('Page not found');
    }

    // Fetch blocks
    const { data: blocks } = await supabase
      .from('blocks')
      .select('*')
      .eq('page_id', page.id)
      .order('position');

    // Build context from page content
    let context = `You are an AI assistant representing the owner of this page.\n\n`;
    context += `Page Info:\n`;
    context += `- Name: ${page.title || 'Not specified'}\n`;
    context += `- Bio: ${page.description || 'Not specified'}\n\n`;

    if (page.chatbot_context) {
      context += `Additional Context (private):\n${page.chatbot_context}\n\n`;
    }

    if (blocks && blocks.length > 0) {
      context += `Page Content:\n`;
      
      blocks.forEach((block: any) => {
        const content = block.content || {};
        
        switch (block.type) {
          case 'profile':
            context += `- Profile: ${content.name} - ${content.bio}\n`;
            break;
          case 'link':
            context += `- Link: ${content.title} (${content.url})\n`;
            break;
          case 'product':
            context += `- Product: ${content.name} - ${content.description} - Price: ${content.currency}${content.price}\n`;
            break;
          case 'video':
            context += `- Video: ${content.title} (${content.url})\n`;
            break;
          case 'text':
            context += `- Text: ${content.content}\n`;
            break;
        }
      });
    }

    context += `\nInstructions:\n`;
    context += `- Answer questions about the page content, links, products, and services\n`;
    context += `- Be friendly, helpful, and represent the page owner professionally\n`;
    context += `- If asked about something not in the context, politely say you don't have that information\n`;
    context += `- Keep responses concise and conversational\n`;
    context += `- Use the additional context provided to give more detailed answers when relevant\n`;

    // Make streaming request to Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: context },
          ...messages
        ],
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please contact the page owner.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    // Return streaming response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in chatbot-stream:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
