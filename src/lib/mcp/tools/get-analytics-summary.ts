import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_analytics_summary",
  title: "Get analytics summary",
  description:
    "Return a lightweight analytics summary for the signed-in LinkMAX user: total events, unique visitors and top pages within the given number of days (default 30).",
  inputSchema: {
    days: z.number().int().min(1).max(365).optional().describe("Look-back window in days. Default 30."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const windowDays = days ?? 30;
    const since = new Date(Date.now() - windowDays * 86400_000).toISOString();

    const { data: pages, error: pagesErr } = await supabase
      .from("pages")
      .select("id, slug, title, views_count")
      .eq("user_id", ctx.getUserId());
    if (pagesErr) return { content: [{ type: "text", text: pagesErr.message }], isError: true };

    const pageIds = (pages ?? []).map((p) => p.id);
    if (pageIds.length === 0) {
      return {
        content: [{ type: "text", text: "No pages yet." }],
        structuredContent: { totals: { events: 0, unique_sessions: 0 }, pages: [] },
      };
    }

    const { data: events, error: evErr } = await supabase
      .from("analytics")
      .select("session_id, page_id, event_type")
      .in("page_id", pageIds)
      .gte("created_at", since);
    if (evErr) return { content: [{ type: "text", text: evErr.message }], isError: true };

    const list = events ?? [];
    const uniq = new Set(list.map((e: any) => e.session_id).filter(Boolean));
    const byPage = new Map<string, number>();
    for (const e of list as any[]) byPage.set(e.page_id, (byPage.get(e.page_id) ?? 0) + 1);

    const top = (pages ?? [])
      .map((p) => ({ slug: p.slug, title: p.title, events: byPage.get(p.id) ?? 0, views_total: p.views_count }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10);

    return {
      content: [{ type: "text", text: JSON.stringify({ window_days: windowDays, total_events: list.length, unique_sessions: uniq.size, top_pages: top }, null, 2) }],
      structuredContent: { window_days: windowDays, totals: { events: list.length, unique_sessions: uniq.size }, top_pages: top },
    };
  },
});
