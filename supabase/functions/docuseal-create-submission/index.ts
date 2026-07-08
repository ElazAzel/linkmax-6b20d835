// DocuSeal — create submission (embed PDF signing) for zone_documents.
// Creates a DocuSeal submission from a template_id and stores the returned
// submitter slug/embed URL in public.document_signatures.metadata.docuseal.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DOCUSEAL_BASE_URL = Deno.env.get('DOCUSEAL_BASE_URL') ?? 'https://api.docuseal.com';

interface Body {
  document_id: string;
  docuseal_template_id: number | string;
  signer_email: string;
  signer_name?: string | null;
  send_email?: boolean;
  fields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('DOCUSEAL_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'DOCUSEAL_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: claims, error: claimsErr } = await authClient.auth.getClaims(
      authHeader.replace('Bearer ', ''),
    );
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.claims.sub as string;

    const body = (await req.json()) as Body;
    if (!body?.document_id || !body?.docuseal_template_id || !body?.signer_email) {
      return new Response(
        JSON.stringify({ error: 'document_id, docuseal_template_id, signer_email required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller has access to the parent document (zone member).
    const { data: doc, error: docErr } = await supabase
      .from('zone_documents')
      .select('id, zone_id, deal_id, title')
      .eq('id', body.document_id)
      .single();
    if (docErr || !doc) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: isMember } = await supabase.rpc('is_zone_member', {
      _zone_id: doc.zone_id,
      _user_id: userId,
    });
    if (!isMember) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create DocuSeal submission
    const dsRes = await fetch(`${DOCUSEAL_BASE_URL}/submissions`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: body.docuseal_template_id,
        send_email: body.send_email ?? false,
        submitters: [
          {
            email: body.signer_email,
            name: body.signer_name ?? undefined,
            role: 'First Party',
            fields: body.fields
              ? Object.entries(body.fields).map(([name, value]) => ({ name, default_value: value }))
              : undefined,
          },
        ],
        metadata: {
          document_id: body.document_id,
          zone_id: doc.zone_id,
          requested_by: userId,
          ...(body.metadata ?? {}),
        },
      }),
    });

    const dsPayload = await dsRes.json();
    if (!dsRes.ok) {
      console.error('DocuSeal create failed', dsRes.status, dsPayload);
      return new Response(
        JSON.stringify({ error: 'DocuSeal error', detail: dsPayload }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // DocuSeal returns an array of submitters
    const submitter = Array.isArray(dsPayload) ? dsPayload[0] : dsPayload?.submitters?.[0];
    const submissionId = submitter?.submission_id ?? dsPayload?.id ?? null;
    const slug: string | null = submitter?.slug ?? null;
    const embedSrc: string | null = submitter?.embed_src ?? (slug ? `https://docuseal.com/s/${slug}` : null);

    const { data: sig, error: sigErr } = await supabase
      .from('document_signatures')
      .insert({
        document_id: body.document_id,
        user_id: userId,
        signer_email: body.signer_email,
        signer_name: body.signer_name ?? null,
        status: 'pending',
        metadata: {
          provider: 'docuseal',
          docuseal: {
            submission_id: submissionId,
            submitter_id: submitter?.id ?? null,
            slug,
            embed_src: embedSrc,
            template_id: body.docuseal_template_id,
          },
          ...(body.metadata ?? {}),
        },
      })
      .select('*')
      .single();

    if (sigErr) {
      console.error('signature insert failed', sigErr);
      return new Response(JSON.stringify({ error: sigErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ signature: sig, embed_src: embedSrc, slug, submission_id: submissionId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('docuseal-create-submission error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
