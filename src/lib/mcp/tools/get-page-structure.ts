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
  name: "get_page_structure",
  title: "Get page structure and blocks",
  description:
    "Return the full block structure and current configuration of one of the signed-in user's LinkMAX pages, so an agent can review and edit it. Accepts either a page_id (uuid) or a slug.",
  inputSchema: {
    page_id: z.string().uuid().optional().describe("Page UUID. Provide this OR slug."),
    slug: z.string().trim().min(1).optional().describe("Page slug. Provide this OR page_id."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ page_id, slug }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!page_id && !slug) {
      return { content: [{ type: "text", text: "Provide page_id or slug." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let pageQuery = supabase
      .from("pages")
      .select(
        "id, user_id, slug, title, description, avatar_url, avatar_style, theme_settings, seo_meta, is_published, niche, entity_type, contact_email, contact_phone, contact_whatsapp, editor_mode, grid_config, integrations, custom_domain, page_type, updated_at",
      )
      .eq("user_id", ctx.getUserId())
      .limit(1);
    pageQuery = page_id ? pageQuery.eq("id", page_id) : pageQuery.eq("slug", slug!);

    const { data: pages, error: pageErr } = await pageQuery;
    if (pageErr) return { content: [{ type: "text", text: pageErr.message }], isError: true };
    const page = pages?.[0];
    if (!page) return { content: [{ type: "text", text: "Page not found for this user." }], isError: true };

    const { data: blocks, error: blocksErr } = await supabase
      .from("blocks")
      .select("id, type, position, title, content, style, is_premium, click_count, schedule")
      .eq("page_id", page.id)
      .order("position", { ascending: true });
    if (blocksErr) return { content: [{ type: "text", text: blocksErr.message }], isError: true };

    const result = { page, blocks: blocks ?? [], block_count: (blocks ?? []).length };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
