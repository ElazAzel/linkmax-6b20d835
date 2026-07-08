/**
 * DocuSeal adapter (P2 — Trust OS).
 * Wraps edge function `docuseal-create-submission` and exposes the returned
 * embed URL / slug so the frontend can render <iframe src={embed_src}> or
 * use the DocuSeal `@docuseal/react` widget.
 *
 * Status transitions (viewed → signed → declined) are pushed back into
 * `document_signatures` by the `docuseal-webhook` edge function.
 */
import { supabase } from '@/integrations/supabase/client';
import type { DocumentSignature } from './document-signatures';

export interface CreateDocusealSubmissionInput {
  document_id: string;
  docuseal_template_id: number | string;
  signer_email: string;
  signer_name?: string | null;
  send_email?: boolean;
  fields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CreateDocusealSubmissionResult {
  signature: DocumentSignature;
  embed_src: string | null;
  slug: string | null;
  submission_id: number | string | null;
}

export async function createDocusealSubmission(
  input: CreateDocusealSubmissionInput,
): Promise<CreateDocusealSubmissionResult> {
  const { data, error } = await supabase.functions.invoke<CreateDocusealSubmissionResult>(
    'docuseal-create-submission',
    { body: input },
  );
  if (error) throw error;
  if (!data) throw new Error('Empty response from docuseal-create-submission');
  return data;
}

/** Extract the DocuSeal embed URL persisted in a signature row's metadata. */
export function getDocusealEmbedSrc(signature: DocumentSignature): string | null {
  const meta = signature.metadata as { docuseal?: { embed_src?: string; slug?: string } };
  const ds = meta?.docuseal;
  if (!ds) return null;
  return ds.embed_src ?? (ds.slug ? `https://docuseal.com/s/${ds.slug}` : null);
}
