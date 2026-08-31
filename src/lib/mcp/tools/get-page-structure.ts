import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { databaseError, getAuthenticatedContext, isToolError, jsonResult, toolError } from "../utils";

export default defineTool({
  name: "get_page_structure",
  title: "Get page structure and blocks",
  description:
    "Return the full block structure and current configuration of one of the signed-in user's LinkMAX pages, so an agent can review and edit it. Accepts either a page_id (uuid) or a slug.",
  inputSchema: {
    page_id: z.string().uuid().optional().describe("Page UUID. Provide this OR slug."),
    slug: z.string().trim().min(1).max(120).optional().describe("Page slug. Provide this OR page_id."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ page_id, slug }, ctx) => {
    const authContext = getAuthenticatedContext(ctx);
    if (isToolError(authContext)) return authContext;

    if (!page_id && !slug) {
      return toolError("invalid_input", "Provide page_id or slug.");
    }
    if (page_id && slug) {
      return toolError("invalid_input", "Provide either page_id or slug, not both.");
    }

    const { supabase, userId } = authContext;
    let pageQuery = supabase
      .from("pages")
      .select(
        "id, slug, title, description, avatar_url, avatar_style, theme_settings, seo_meta, is_published, niche, entity_type, contact_email, contact_phone, contact_whatsapp, editor_mode, grid_config, integrations, custom_domain, page_type, updated_at",
      )
      .eq("user_id", userId)
      .limit(1);
    pageQuery = page_id ? pageQuery.eq("id", page_id) : pageQuery.eq("slug", slug!);

    const { data: pages, error: pageErr } = await pageQuery;
    if (pageErr) return databaseError("get_page_structure.page");
    const page = pages?.[0];
    if (!page) return toolError("not_found", "Page not found for this user.");

    const { data: blocks, error: blocksErr } = await supabase
      .from("blocks")
      .select("id, type, position, title, content, style, is_premium, click_count, schedule")
      .eq("page_id", page.id)
      .order("position", { ascending: true });
    if (blocksErr) return databaseError("get_page_structure.blocks");

    const result = { page, blocks: blocks ?? [], block_count: (blocks ?? []).length };
    return jsonResult(result);
  },
});
