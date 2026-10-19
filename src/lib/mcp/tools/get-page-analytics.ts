import { defineTool } from "@lovable.dev/mcp-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { summarizePageAnalytics, type AnalyticsRow, type BlockRow, type PageAnalytics } from "../page-analytics";
import { isPageContext, openPage } from "../page-context";
import { databaseError, jsonResult } from "../utils";

const EVENT_LIMIT = 20000;

/** Loads the current and previous period and summarizes them; shared with audit_page. */
export async function loadPageAnalytics(supabase: SupabaseClient, userId: string, pageId: string, days: number): Promise<PageAnalytics | null> {
  const now = Date.now();
  const since = new Date(now - days * 86_400_000).toISOString();
  const prevSince = new Date(now - 2 * days * 86_400_000).toISOString();
  const columns = "event_type, block_id, metadata, created_at";

  const [current, previous, blocks, leads] = await Promise.all([
    supabase.from("analytics").select(columns, { count: "exact" }).eq("page_id", pageId).gte("created_at", since).limit(EVENT_LIMIT),
    supabase.from("analytics").select("event_type, metadata").eq("page_id", pageId).gte("created_at", prevSince).lt("created_at", since).limit(EVENT_LIMIT),
    supabase.from("blocks").select("id, type, content").eq("page_id", pageId).is("deleted_at", null),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", userId).contains("metadata", { page_id: pageId }).gte("created_at", since),
  ]);
  if (current.error || previous.error || blocks.error) return null;

  const rows = (current.data ?? []) as AnalyticsRow[];
  return summarizePageAnalytics({
    days,
    events: rows,
    previous: (previous.data ?? []).map((r) => ({ ...(r as AnalyticsRow), block_id: null, created_at: since })),
    blocks: (blocks.data ?? []) as BlockRow[],
    leads: leads.error ? 0 : leads.count ?? 0,
    sampled: (current.count ?? rows.length) > rows.length,
  });
}

export default defineTool({
  name: "get_page_analytics",
  title: "Get page analytics",
  description:
    "Analytics for one page over the last N days: views, unique visitors, clicks, click-through, leads, change versus the previous period, per-block clicks and CTR, traffic sources, devices, countries and a daily series.",
  inputSchema: {
    page_id: z.string().uuid(),
    days: z.number().int().min(1).max(180).optional().describe("Window in days. Default 30."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ page_id, days }, ctx) => {
    const opened = await openPage(ctx, page_id);
    if (!isPageContext(opened)) return opened;
    const summary = await loadPageAnalytics(opened.supabase, opened.userId, page_id, days ?? 30);
    if (!summary) return databaseError("get_page_analytics");
    return jsonResult({ page: { id: page_id, slug: opened.page.slug }, ...summary });
  },
});
