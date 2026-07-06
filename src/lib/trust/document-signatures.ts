/**
 * Document Signatures (P2 — Trust OS)
 *
 * Тонкая обвязка над таблицей `document_signatures`. Хранит статусы
 * подписания документов из `zone_documents` (offer → contract → invoice → act).
 * Реальный embed-подпись/PDF-fill планируется через DocuSeal/Documenso;
 * здесь — доменная модель и статусы, чтобы фронт мог отображать pipeline.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DocumentSignatureInsert = Database['public']['Tables']['document_signatures']['Insert'];
type DocumentSignatureUpdate = Database['public']['Tables']['document_signatures']['Update'];

export type SignatureStatus = 'pending' | 'viewed' | 'signed' | 'declined' | 'expired';

export interface DocumentSignature {
  id: string;
  document_id: string;
  user_id: string | null;
  signer_email: string;
  signer_name: string | null;
  status: SignatureStatus;
  signature_data: Record<string, unknown>;
  signed_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RequestSignatureInput {
  document_id: string;
  signer_email: string;
  signer_name?: string | null;
  metadata?: Record<string, unknown>;
}

export async function listDocumentSignatures(documentId: string): Promise<DocumentSignature[]> {
  const { data, error } = await supabase
    .from('document_signatures')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as DocumentSignature[]) ?? [];
}

export async function requestSignature(input: RequestSignatureInput): Promise<DocumentSignature> {
  const payload = {
    document_id: input.document_id,
    signer_email: input.signer_email,
    signer_name: input.signer_name ?? null,
    status: 'pending' as SignatureStatus,
    metadata: input.metadata ?? {},
  };
  const { data, error } = await supabase
    .from('document_signatures')
    .insert(payload as DocumentSignatureInsert)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as DocumentSignature;
}

export async function markSignatureStatus(
  id: string,
  status: SignatureStatus,
  signatureData?: Record<string, unknown>,
): Promise<DocumentSignature> {
  const patch: Record<string, unknown> = { status };
  if (status === 'signed') patch.signed_at = new Date().toISOString();
  if (signatureData) patch.signature_data = signatureData;

  const { data, error } = await supabase
    .from('document_signatures')
    .update(patch as DocumentSignatureUpdate)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as DocumentSignature;
}
