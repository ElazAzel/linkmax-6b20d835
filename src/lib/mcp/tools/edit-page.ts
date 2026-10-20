import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { isDraft, saveDraft } from "../draft";
import { applyOperations, OperationError, type PageOperation } from "../page-ops";
import { isPageContext, openPage, publicUrl } from "../page-context";
import { jsonResult, toolError } from "../utils";

const size = z.enum(["small", "wide", "tall", "large"]);
const text = z.string().max(2000);

const operation = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("set_page"),
    fields: z.object({
      seo_title: text.max(70).nullable().optional(),
      seo_description: text.max(170).nullable().optional(),
      seo_image: z.string().max(2000).nullable().optional(),
      is_indexable: z.boolean().optional(),
      city: z.string().max(80).nullable().optional(),
      profession: z.string().max(80).nullable().optional(),
      niche: z.string().max(40).nullable().optional(),
      favicon_url: z.string().max(2000).nullable().optional(),
    }),
  }),
  z.object({
    op: z.literal("add_block"),
    block: z.record(z.string(), z.unknown()).describe("Block fields including type; see get_block_catalog. id is generated."),
    size: size.optional(),
    after_block_id: z.string().optional().describe("Insert right after this block. Default: end of page."),
    position: z.number().int().min(0).optional(),
  }),
  z.object({
    op: z.literal("update_block"),
    block_id: z.string(),
    changes: z.record(z.string(), z.unknown()).describe("Fields to set; null removes a field. Arrays are replaced whole."),
    size: size.optional(),
  }),
  z.object({ op: z.literal("remove_block"), block_id: z.string() }),
  z.object({ op: z.literal("move_block"), block_id: z.string(), position: z.number().int().min(0) }),
]);

export default defineTool({
  name: "edit_page",
  title: "Edit a page draft",
  description:
    "Apply a batch of edits to a page draft atomically: set_page (SEO, city, indexing), add_block, update_block, remove_block, move_block. Nothing goes live until publish_page; the owner sees the changes in the LinkMAX editor. Returns the change list and warnings.",
  inputSchema: {
    page_id: z.string().uuid(),
    operations: z.array(operation).min(1).max(60),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ page_id, operations }, ctx) => {
    const opened = await openPage(ctx, page_id);
    if (!isPageContext(opened)) return opened;
    const { supabase, draft, page } = opened;

    let result;
    try {
      result = applyOperations(draft.snapshot, operations as PageOperation[]);
    } catch (error) {
      if (error instanceof OperationError) return toolError("invalid_operation", `${error.message} No changes were saved.`);
      throw error;
    }
    const saved = await saveDraft(supabase, draft, result.snapshot);
    if (!isDraft(saved)) return saved;
    return jsonResult({
      saved: true,
      published: false,
      draft_revision: saved.revision,
      changes: result.changes,
      warnings: result.warnings,
      blocks: saved.snapshot.blocks.map((b, position) => ({ position, id: b.id, type: b.type })),
      next: `Review in the editor or call publish_page to make it live at ${publicUrl(page.slug)}.`,
    });
  },
});
