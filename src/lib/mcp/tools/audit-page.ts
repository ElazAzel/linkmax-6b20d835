import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { auditPage } from "../audit";
import { hasUnpublishedChanges } from "../draft";
import { isPageContext, openPage, publicUrl } from "../page-context";
import { jsonResult } from "../utils";
import { loadPageAnalytics } from "./get-page-analytics";

export default defineTool({
  name: "audit_page",
  title: "Review a page: strengths and weaknesses",
  description:
    "Review a page draft and its recent analytics: content, contact path, offer, SEO, languages, publishing and traffic. Returns a 0-100 score, strengths, weaknesses ranked by severity with the evidence and the edit that fixes each, and the next three steps.",
  inputSchema: {
    page_id: z.string().uuid(),
    days: z.number().int().min(1).max(180).optional().describe("Analytics window. Default 30."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ page_id, days }, ctx) => {
    const opened = await openPage(ctx, page_id);
    if (!isPageContext(opened)) return opened;
    const analytics = await loadPageAnalytics(opened.supabase, opened.userId, page_id, days ?? 30);
    const report = auditPage({
      snapshot: opened.draft.snapshot,
      isPublished: opened.page.is_published,
      hasUnpublishedChanges: hasUnpublishedChanges(opened.draft),
      analytics,
    });
    return jsonResult({
      page: { id: page_id, url: publicUrl(opened.page.slug) },
      analytics_included: !!analytics,
      ...report,
    });
  },
});
