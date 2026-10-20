import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { hasUnpublishedChanges } from "../draft";
import { isPageContext, openPage, publicUrl } from "../page-context";
import { jsonResult } from "../utils";

export default defineTool({
  name: "get_page",
  title: "Get a page (draft)",
  description:
    "Return the current editable draft of one of the signed-in user's pages: page settings and every block with its id, type, size and content. Edits from edit_page land in this draft and go live with publish_page.",
  inputSchema: {
    page_id: z.string().uuid().describe("Page UUID from list_my_pages or create_page."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ page_id }, ctx) => {
    const opened = await openPage(ctx, page_id);
    if (!isPageContext(opened)) return opened;
    const { draft, page } = opened;
    const s = draft.snapshot;
    return jsonResult({
      page: {
        id: page.id,
        slug: page.slug,
        url: publicUrl(page.slug),
        is_published: page.is_published,
        has_unpublished_changes: hasUnpublishedChanges(draft),
        draft_revision: draft.revision,
        seo: s.seo ?? null,
        is_indexable: s.isIndexable ?? true,
        city: s.city ?? null,
        profession: s.profession ?? null,
        niche: s.niche ?? null,
      },
      blocks: s.blocks.map((block, position) => ({ position, ...block })),
    });
  },
});
