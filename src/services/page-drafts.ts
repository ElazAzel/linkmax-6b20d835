import { supabase } from '@/platform/supabase/client';
import type { PageData } from '@/types/page';
import type { Json } from '@/platform/supabase/types';
import { isMissingSchemaError } from '@/lib/resilience/missing-schema';

export interface PageDraft {
  page_id: string;
  snapshot: PageData;
  revision: number;
  published_draft_revision?: number;
  base_published_revision: number;
  chatbot_context: string;
  updated_at: string;
  slug?: string;
}
export type DraftErrorKind = 'conflict' | 'unavailable' | 'access' | 'network';
export class PageDraftError extends Error {
  constructor(public readonly kind: DraftErrorKind, message: string) { super(message); this.name = 'PageDraftError'; }
}
export function draftError(error: unknown): PageDraftError {
  if (error instanceof PageDraftError) return error;
  const value = error as { code?: string; message?: string };
  if (value?.code === '40001' || value?.message?.includes('draft_conflict')) return new PageDraftError('conflict', 'This draft changed in another tab. Reload the server draft before merging your local changes.');
  if (isMissingSchemaError(error)) return new PageDraftError('unavailable', 'Private drafts are not available on this backend yet. Your changes stay on this device. Ask the administrator to deploy the page drafts migration.');
  if (value?.code === '42501') return new PageDraftError('access', 'You no longer have permission to edit this page.');
  return new PageDraftError('network', value?.message || 'Draft could not be saved. Your changes stay on this device; retry when connected.');
}
// The generated Cloud types predate this additive migration. Keep the cast here,
// never fall back to savePage/upsert_user_page when an RPC is unavailable.
async function rpc(name: string, args: Record<string, Json | undefined>): Promise<PageDraft> {
  const client = supabase as unknown as { rpc: (name: string, args: Record<string, Json | undefined>) => Promise<{ data: unknown; error: unknown }> };
  try {
    const { data, error } = await client.rpc(name, args);
    if (error) throw error;
    if (!data) throw new Error('Draft backend returned no snapshot');
    return data as PageDraft;
  } catch (error) { throw draftError(error); }
}
export function loadPageDraft(pageId: string) { return rpc('load_page_draft', { p_page_id: pageId }); }
export function savePageDraft(pageData: PageData, revision: number, basePublishedRevision: number, chatbotContext = '') {
  return rpc('save_page_draft', { p_page_id: pageData.id, p_snapshot: JSON.parse(JSON.stringify(pageData)) as Json,
    p_expected_revision: revision, p_base_published_revision: basePublishedRevision, p_chatbot_context: chatbotContext });
}
export function publishPageDraft(pageId: string, revision: number, basePublishedRevision: number) {
  return rpc('publish_page_draft', { p_page_id: pageId, p_expected_revision: revision, p_base_published_revision: basePublishedRevision });
}

export function reloadPageDraft(pageId: string, revision: number, basePublishedRevision: number) {
 return rpc('reload_page_draft', { p_page_id: pageId, p_expected_revision: revision, p_base_published_revision: basePublishedRevision });
}
