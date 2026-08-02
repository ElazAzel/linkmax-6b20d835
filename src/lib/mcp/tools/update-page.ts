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
  name: "update_page",
  title: "Update a page's design and settings",
  description:
    "Update the appearance and settings of one of the signed-in LinkMAX user's pages: title, description, avatar, theme (theme_settings), SEO meta, publish state. Pass only the fields to change. Returns the updated page.",
  inputSchema: {
    page_id: z.string().uuid().describe("UUID of the page to update."),
    title: z.string().trim().max(120).optional().describe("New page title shown in header and SEO."),
    description: z.string().trim().max(500).optional().describe("New page description (SEO/bio)."),
    avatar_url: z.string().url().optional().describe("New avatar image URL."),
    is_published: z.boolean().optional().describe("Set true to publish the page, false to unpublish."),
    theme_settings: z
      .record(z.any())
      .optional()
      .describe("Page theme/design settings to merge, e.g. { background, font, accent, layout, spacing }. Omitted keys keep current values."),
    seo_meta: z
      .record(z.any())
      .optional()
      .describe("SEO meta object to merge, e.g. { title, description, ogImage }."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ page_id, title, description, avatar_url, is_published, theme_settings, seo_meta }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const { data: existing, error: fetchErr } = await supabase
      .from("pages")
      .select("id, theme_settings, seo_meta")
      .eq("id", page_id)
      .eq("user_id", ctx.getUserId())
      .limit(1);
    if (fetchErr) return { content: [{ type: "text", text: fetchErr.message }], isError: true };
    if (!existing?.[0]) {
      return { content: [{ type: "text", text: "Page not found for this user." }], isError: true };
    }

    const update: Record<string, any> = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (avatar_url !== undefined) update.avatar_url = avatar_url;
    if (is_published !== undefined) update.is_published = is_published;
    if (theme_settings !== undefined) {
      update.theme_settings = { ...(existing[0].theme_settings as Record<string, any> ?? {}), ...theme_settings };
    }
    if (seo_meta !== undefined) {
      update.seo_meta = { ...(existing[0].seo_meta as Record<string, any> ?? {}), ...seo_meta };
    }

    const { data, error } = await supabase
      .from("pages")
      .update(update)
      .eq("id", page_id)
      .select("id, slug, title, description, is_published, theme_settings, updated_at")
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify({ page: data }, null, 2) }],
      structuredContent: { page: data },
    };
  },
});
