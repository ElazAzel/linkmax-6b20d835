import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext, ToolHandlerResult } from "@lovable.dev/mcp-js";
import { isDraft, loadDraft, type PageDraft } from "./draft";
import { databaseError, getAuthenticatedContext, isToolError, toolError } from "./utils";

interface PageContext {
  supabase: SupabaseClient;
  userId: string;
  draft: PageDraft;
  page: { id: string; slug: string; is_published: boolean };
}

export const publicUrl = (slug: string) => `https://lnkmx.my/${slug}`;

/** Auth + ownership + the current private draft, in one place for every page tool. */
export async function openPage(ctx: ToolContext, pageId: string): Promise<PageContext | ToolHandlerResult> {
  const auth = getAuthenticatedContext(ctx);
  if (isToolError(auth)) return auth;
  const { supabase, userId } = auth;

  const { data: page, error } = await supabase
    .from("pages")
    .select("id, slug, is_published")
    .eq("id", pageId)
    .maybeSingle();
  if (error) return databaseError("open_page");
  if (!page) return toolError("not_found", "Page not found for this user. Call list_my_pages for your page ids.");

  const draft = await loadDraft(supabase, pageId);
  if (!isDraft(draft)) return draft;
  return { supabase, userId, draft, page: { id: page.id, slug: page.slug, is_published: !!page.is_published } };
}

export function isPageContext(value: PageContext | ToolHandlerResult): value is PageContext {
  return "draft" in value;
}
