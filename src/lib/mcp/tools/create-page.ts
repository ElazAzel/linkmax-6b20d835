import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { isDraft, loadDraft, saveDraft } from "../draft";
import { applyOperations } from "../page-ops";
import { publicUrl } from "../page-context";
import { MCP_RESERVED_SLUGS } from "../reserved-slugs";
import { databaseError, getAuthenticatedContext, isToolError, jsonResult, toolError } from "../utils";

export default defineTool({
  name: "create_page",
  title: "Create a new LinkMAX page",
  description:
    "Create a new page for the signed-in user with a profile block (name and bio) in its draft. Fill it with edit_page, then publish_page. Returns page id, slug and URL.",
  inputSchema: {
    slug: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9-]+$/, "Latin letters, digits and hyphens only.")
      .transform((value) => value.toLowerCase())
      .optional()
      .describe("Desired address lnkmx.my/{slug}. If taken, a suffix is added."),
    name: z.string().trim().min(1).max(120).describe("Person or business name for the profile block."),
    bio: z.string().trim().max(500).optional().describe("One or two sentences: who this is and how they help."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ slug, name, bio }, ctx) => {
    const auth = getAuthenticatedContext(ctx);
    if (isToolError(auth)) return auth;
    if (slug && MCP_RESERVED_SLUGS.has(slug)) {
      return toolError("slug_reserved", `lnkmx.my/${slug} is used by LinkMAX itself. Pick another slug.`);
    }

    const { supabase } = auth;
    const { data, error } = await supabase.rpc("mcp_create_user_page", {
      p_slug: slug ?? null,
      p_title: name,
      p_description: bio ?? null,
    });
    if (error) return databaseError("create_page");
    const row = (Array.isArray(data) ? data[0] : data) as { id: string; slug: string } | null;
    if (!row) return databaseError("create_page.empty");

    const draft = await loadDraft(supabase, row.id);
    let profileReady = false;
    if (isDraft(draft) && !draft.snapshot.blocks.some((b) => b.type === "profile")) {
      const { snapshot } = applyOperations(draft.snapshot, [{ op: "add_block", block: { type: "profile", name, bio: bio ?? "" } }]);
      profileReady = isDraft(await saveDraft(supabase, draft, snapshot));
    }

    return jsonResult({
      page: { id: row.id, slug: row.slug, url: publicUrl(row.slug), is_published: false },
      profile_block_created: profileReady,
      next: "Call get_block_catalog, add content with edit_page, check it with audit_page, then publish_page.",
    });
  },
});
