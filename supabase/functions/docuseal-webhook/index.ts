// DocuSeal webhook receiver.
// Maps DocuSeal submitter events → document_signatures.status transitions.
// Events: form.viewed, form.started, form.completed, form.declined
// See https://www.docuseal.com/docs/api#webhook
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-docuseal-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SignatureStatus = 'pending' | 'viewed' | 'signed' | 'declined' | 'expired';

function mapEvent(event: string): SignatureStatus | null {
  switch (event) {
    case 'form.viewed':
    case 'form.started':
      return 'viewed';
    case 'form.completed':
    case 'submission.completed':
      return 'signed';
    case 'form.declined':
      return 'declined';
    default:
      return null;
  }
}

async function verifySignature(rawBody: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // Constant-time-ish compare
  if (header.length !== hex.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= header.charCodeAt(i) ^ hex.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const rawBody = await req.text();
  const secret = Deno.env.get('DOCUSEAL_WEBHOOK_SECRET');
  if (!secret) {
    console.error('DOCUSEAL_WEBHOOK_SECRET not configured — rejecting webhook');
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const ok = await verifySignature(rawBody, req.headers.get('x-docuseal-signature'), secret);
  if (!ok) {
    console.warn('DocuSeal webhook signature mismatch');
    return new Response('Invalid signature', { status: 401, headers: corsHeaders });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Bad JSON', { status: 400, headers: corsHeaders });
  }

  const eventType: string = event?.event_type ?? event?.event ?? '';
  const status = mapEvent(eventType);
  if (!status) {
    return new Response(JSON.stringify({ ignored: eventType }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const submitter = event?.data ?? event?.submitter ?? event;
  const submissionId = submitter?.submission_id ?? submitter?.submission?.id ?? null;
  const submitterId = submitter?.id ?? null;
  const documentId = submitter?.metadata?.document_id ?? submitter?.submission?.metadata?.document_id ?? null;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Find the target signature row: prefer submission_id in metadata, fall back to document_id + email.
  let query = supabase.from('document_signatures').select('id, metadata').limit(1);
  if (submissionId) {
    query = query.eq('metadata->docuseal->>submission_id', String(submissionId));
  } else if (documentId && submitter?.email) {
    query = query.eq('document_id', documentId).eq('signer_email', submitter.email);
  } else {
    return new Response(JSON.stringify({ error: 'No submission_id or document_id/email' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const { data: rows, error: fetchErr } = await query;
  if (fetchErr) {
    console.error('signature lookup failed', fetchErr);
    return new Response('Lookup error', { status: 500, headers: corsHeaders });
  }
  const target = rows?.[0];
  if (!target) {
    console.warn('No matching signature row', { submissionId, documentId });
    return new Response(JSON.stringify({ received: true, matched: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const patch: Record<string, unknown> = {
    status,
    metadata: {
      ...(target.metadata as Record<string, unknown>),
      docuseal: {
        ...((target.metadata as any)?.docuseal ?? {}),
        submission_id: submissionId,
        submitter_id: submitterId,
        last_event: eventType,
        last_event_at: new Date().toISOString(),
        documents: submitter?.documents ?? undefined,
      },
    },
  };
  if (status === 'signed') {
    patch.signed_at = new Date().toISOString();
    patch.signature_data = {
      values: submitter?.values ?? submitter?.fields ?? {},
      audit_log_url: submitter?.audit_log_url ?? null,
    };
    patch.ip_address = submitter?.ip ?? null;
    patch.user_agent = submitter?.ua ?? null;
  }

  const { error: updErr } = await supabase
    .from('document_signatures')
    .update(patch)
    .eq('id', target.id);
  if (updErr) {
    console.error('signature update failed', updErr);
    return new Response('Update error', { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ received: true, status }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
