import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { isDraft, publishDraft } from "../draft";
import { isPageContext, openPage, publicUrl } from "../page-context";
import { jsonResult } from "../utils";

export default defineTool({
  name: "publish_page",
  title: "Publish a page",
  description:
    "Make the current draft of a page live at lnkmx.my/{slug}. Ask the owner before publishing: visitors see the result immediately. Requires a profile block.",
  inputSchema: {
    page_id: z.string().uuid(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  handler: async ({ page_id }, ctx) => {
    const opened = await openPage(ctx, page_id);
    if (!isPageContext(opened)) return opened;
    const published = await publishDraft(opened.supabase, opened.draft);
    if (!isDraft(published)) return published;
    return jsonResult({ published: true, url: publicUrl(published.slug ?? opened.page.slug), blocks: published.snapshot.blocks.length });
  },
});
