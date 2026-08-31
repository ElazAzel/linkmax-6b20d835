import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import {
  databaseError,
  getAuthenticatedContext,
  getMetadataString,
  isToolError,
  jsonResult,
} from "../utils";

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
    const authContext = getAuthenticatedContext(ctx);
    if (isToolError(authContext)) return authContext;

    const { supabase, userId } = authContext;
    const windowDays = days ?? 30;
    const since = new Date(Date.now() - windowDays * 86400_000).toISOString();

    const { data: pages, error: pagesErr } = await supabase
      .from("pages")
      .select("id, slug, title, view_count")
      .eq("user_id", userId);
    if (pagesErr) return databaseError("get_analytics_summary.pages");

    const pageIds = (pages ?? []).map((p) => p.id);
    if (pageIds.length === 0) {
      return jsonResult({
        window_days: windowDays,
        totals: { events: 0, unique_sessions: 0, unique_visitors: 0 },
        top_pages: [],
      });
    }

    const { data: events, count: eventCount, error: evErr } = await supabase
      .from("analytics")
      .select("page_id, event_type, metadata, created_at", { count: "exact" })
      .in("page_id", pageIds)
      .gte("created_at", since)
      .limit(10000);
    if (evErr) return databaseError("get_analytics_summary.analytics");

    const list = events ?? [];
    const uniqueSessions = new Set<string>();
    const uniqueVisitors = new Set<string>();
    const byEventType = new Map<string, number>();
    const byPage = new Map<string, number>();
    for (const event of list) {
      const sessionId = getMetadataString(event.metadata, "sessionId", "session_id");
      const visitorId = getMetadataString(event.metadata, "visitorId", "visitor_id");
      if (sessionId) uniqueSessions.add(sessionId);
      if (visitorId) uniqueVisitors.add(visitorId);
      byEventType.set(event.event_type, (byEventType.get(event.event_type) ?? 0) + 1);
      if (event.page_id) byPage.set(event.page_id, (byPage.get(event.page_id) ?? 0) + 1);
    }

    const top = (pages ?? [])
      .map((p) => ({ slug: p.slug, title: p.title, events: byPage.get(p.id) ?? 0, views_total: p.view_count ?? 0 }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10);

    return jsonResult({
      window_days: windowDays,
      sampled: (eventCount ?? list.length) > list.length,
      totals: {
        events: eventCount ?? list.length,
        unique_sessions: uniqueSessions.size,
        unique_visitors: uniqueVisitors.size,
      },
      events_by_type: Object.fromEntries(byEventType),
      top_pages: top,
    });
  },
});
