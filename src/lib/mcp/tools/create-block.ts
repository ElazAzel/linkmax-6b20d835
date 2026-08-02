import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

const BLOCK_TYPES = [
  "profile",
  "link",
  "button",
  "text",
  "image",
  "socials",
  "product",
  "video",
  "carousel",
  "custom_code",
  "messenger",
  "form",
  "download",
  "newsletter",
  "testimonial",
  "scratch",
  "map",
  "avatar",
  "separator",
  "catalog",
  "before_after",
  "faq",
  "countdown",
  "pricing",
  "shoutout",
  "booking",
  "community",
  "event",
] as const;

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_block",
  title: "Create a block on a page",
  description:
    "Create a new block on one of the signed-in LinkMAX user's pages. Supports all block types: link, text, image, button, video, socials, product, form, messenger, map, separator and more. For a link block pass `url` and `title`. The block is appended at the end of the page unless `position` is given. Returns the created block.",
  inputSchema: {
    page_id: z.string().uuid().describe("UUID of the page to add the block to."),
    type: z.enum(BLOCK_TYPES).describe("Block type to create."),
    title: z.string().trim().max(120).optional().describe("Block title (link text, heading, etc)."),
    url: z.string().url().optional().describe("For link/button/download/video blocks: the target URL."),
    content: z
      .record(z.any())
      .optional()
      .describe("Full block content object (JSON). All block fields in one place, e.g. { title, url, icon, style, blockStyle, ... }. `page_id`, `type` and `position` are handled separately."),
    position: z.number().int().min(0).optional().describe("Zero-based position on the page. Defaults to append at the end."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ page_id, type, title, url, content, position }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const { data: pages, error: pageErr } = await supabase
      .from("pages")
      .select("id")
      .eq("id", page_id)
      .eq("user_id", ctx.getUserId())
      .limit(1);
    if (pageErr) return { content: [{ type: "text", text: pageErr.message }], isError: true };
    if (!pages?.[0]) {
      return { content: [{ type: "text", text: "Page not found for this user." }], isError: true };
    }

    let nextPosition = position;
    if (nextPosition === undefined) {
      const { data: last, error: posErr } = await supabase
        .from("blocks")
        .select("position")
        .eq("page_id", page_id)
        .order("position", { ascending: false })
        .limit(1);
      if (posErr) return { content: [{ type: "text", text: posErr.message }], isError: true };
      nextPosition = (last?.[0]?.position ?? -1) + 1;
    }

    const blockId = crypto.randomUUID();
    const blockContent: Record<string, any> = {
      id: blockId,
      type,
      ...(content ?? {}),
    };
    if (title !== undefined && !(title in blockContent)) blockContent.title = title;
    if (url !== undefined && !(url in blockContent)) blockContent.url = url;

    const { data, error } = await supabase
      .from("blocks")
      .insert({
        id: blockId,
        page_id,
        type,
        position: nextPosition,
        title: title ?? null,
        content: blockContent,
        style: {},
        is_premium: false,
      })
      .select("id, type, position, title, page_id")
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { block: data, content: blockContent, hint: "Use update_block to change its content or style afterwards." },
            null,
            2,
          ),
        },
      ],
      structuredContent: { block: data, content: blockContent },
    };
  },
});
