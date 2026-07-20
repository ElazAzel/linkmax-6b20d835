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
  name: "create_page",
  title: "Create a new LinkMAX page",
  description:
    "Create a new link-in-bio page for the signed-in LinkMAX user. Returns the new page id, slug and default settings so the agent can immediately edit blocks and appearance.",
  inputSchema: {
    slug: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .optional()
      .describe("Desired URL slug (lowercase). If omitted or already taken, a unique slug is generated."),
    title: z.string().trim().min(1).max(120).optional().describe("Page title shown in the header and SEO."),
    description: z.string().trim().max(500).optional().describe("Short page description (SEO/bio)."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ slug, title, description }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("mcp_create_user_page", {
      p_slug: slug ?? null,
      p_title: title ?? null,
      p_description: description ?? null,
    });
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const row = Array.isArray(data) ? data[0] : data;
    const settings = {
      editable_fields: [
        "title",
        "description",
        "avatar_url",
        "theme_settings",
        "seo_meta",
        "is_published",
        "niche",
        "contact_email",
        "contact_phone",
        "contact_whatsapp",
      ],
      block_types: ["link", "text", "image", "video", "form", "event", "product", "profile", "social"],
      public_url_pattern: "https://lnkmx.my/{slug}",
    };
    return {
      content: [{ type: "text", text: JSON.stringify({ page: row, settings }, null, 2) }],
      structuredContent: { page: row, settings },
    };
  },
});
