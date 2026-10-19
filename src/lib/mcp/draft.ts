import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolHandlerResult } from "@lovable.dev/mcp-js";
import { toolError } from "./utils";

/**
 * Agents edit the same private draft the editor uses, so their changes show
 * up in the editor for review and go live only on publish. Writing the
 * published blocks table directly would bump the publication revision and
 * put any open editor tab into a conflict.
 */
export interface DraftSnapshot {
  id: string;
  slug?: string;
  blocks: Array<Record<string, unknown>>;
  seo?: Record<string, unknown> | null;
  theme?: Record<string, unknown> | null;
  isPublished?: boolean;
  isIndexable?: boolean;
  [key: string]: unknown;
}

export interface PageDraft {
  page_id: string;
  snapshot: DraftSnapshot;
  revision: number;
  base_published_revision: number;
  published_draft_revision?: number;
  chatbot_context: string;
  updated_at: string;
  slug?: string;
}

type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }> };

function draftFailure(error: unknown, operation: string): ToolHandlerResult {
  const value = error as { code?: string; message?: string } | null;
  const message = value?.message ?? "";
  if (value?.code === "40001" || message.includes("draft_conflict")) {
    return toolError("draft_conflict", "The page draft changed while you were editing (probably in the editor). Call get_page again and repeat the edit on the fresh draft.");
  }
  if (value?.code === "42501" || message.includes("draft_access_denied")) {
    return toolError("not_found", "Page not found for this user.");
  }
  if (message.includes("draft_profile_required")) {
    return toolError("profile_required", "Add a profile block (name and bio) with edit_page before publishing.");
  }
  if (["PGRST202", "42883", "42P01"].includes(value?.code ?? "")) {
    return toolError("drafts_unavailable", "Page drafts are not deployed on this LinkMAX backend yet.");
  }
  console.error(`LinkMAX MCP draft operation failed: ${operation}`, { code: value?.code ?? "unknown" });
  return toolError("database_error", "LinkMAX could not complete the draft request.");
}

async function call(supabase: SupabaseClient, name: string, args: Record<string, unknown>): Promise<PageDraft | ToolHandlerResult> {
  const { data, error } = await (supabase as unknown as RpcClient).rpc(name, args);
  if (error) return draftFailure(error, name);
  if (!data || typeof data !== "object") return toolError("database_error", "LinkMAX returned an empty draft.");
  const draft = data as PageDraft;
  if (!draft.snapshot || !Array.isArray(draft.snapshot.blocks)) {
    draft.snapshot = { ...(draft.snapshot ?? {}), id: draft.page_id, blocks: [] };
  }
  return draft;
}

export function isDraft(value: PageDraft | ToolHandlerResult): value is PageDraft {
  return "page_id" in value && "snapshot" in value;
}

export function loadDraft(supabase: SupabaseClient, pageId: string) {
  return call(supabase, "load_page_draft", { p_page_id: pageId });
}

/** Saves over the exact revision that was loaded; the chatbot context is passed through untouched. */
export function saveDraft(supabase: SupabaseClient, draft: PageDraft, snapshot: DraftSnapshot) {
  return call(supabase, "save_page_draft", {
    p_page_id: draft.page_id,
    p_snapshot: snapshot,
    p_expected_revision: draft.revision,
    p_base_published_revision: draft.base_published_revision,
    p_chatbot_context: draft.chatbot_context ?? "",
  });
}

export function publishDraft(supabase: SupabaseClient, draft: PageDraft) {
  return call(supabase, "publish_page_draft", {
    p_page_id: draft.page_id,
    p_expected_revision: draft.revision,
    p_base_published_revision: draft.base_published_revision,
  });
}

/** True when the draft holds edits that are not live yet. */
export function hasUnpublishedChanges(draft: PageDraft): boolean {
  return (draft.published_draft_revision ?? -1) !== draft.revision;
}
