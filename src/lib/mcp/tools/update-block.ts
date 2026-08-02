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
  name: "update_block",
  title: "Update a block's content and design",
  description:
    "Update the content and/or design (style) of an existing block on one of the signed-in LinkMAX user's pages. Pass `content` with the fields to change (title, url, icon, style, blockStyle, background, etc) and/or `style` for the block's design settings. `title` can be set directly. Returns the updated block.",
  inputSchema: {
    block_id: z.string().uuid().describe("UUID of the block to update."),
    content: z
      .record(z.any())
      .optional()
      .describe("Block content fields to merge into the existing content JSON, e.g. { title, url, icon, style, blockStyle }. Omitted fields keep their current value."),
    style: z
      .record(z.any())
      .optional()
      .describe("Block design settings to merge into the existing style JSON, e.g. { padding, borderRadius, shadow, hoverEffect, animation, background }. Omitted fields keep their current value."),
    title: z.string().trim().max(120).optional().describe("Optional new block title (also merged into content.title)."),
    position: z.number().int().min(0).optional().describe("Optional new zero-based position on the page."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ block_id, content, style, title, position }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const { data: existing, error: fetchErr } = await supabase
      .from("blocks")
      .select("id, type, page_id, content, style, title, position")
      .eq("id", block_id)
      .limit(1);
    if (fetchErr) return { content: [{ type: "text", text: fetchErr.message }], isError: true };
    const block = existing?.[0];
    if (!block) return { content: [{ type: "text", text: "Block not found." }], isError: true };

    const { data: pageCheck, error: pageErr } = await supabase
      .from("pages")
      .select("id")
      .eq("id", block.page_id)
      .eq("user_id", ctx.getUserId())
      .limit(1);
    if (pageErr) return { content: [{ type: "text", text: pageErr.message }], isError: true };
    if (!pageCheck?.[0]) {
      return { content: [{ type: "text", text: "Block does not belong to a page owned by this user." }], isError: true };
    }

    const mergedContent: Record<string, any> = { ...(block.content as Record<string, any> ?? {}), ...(content ?? {}) };
    if (title !== undefined) mergedContent.title = title;

    const update: Record<string, any> = {
      content: mergedContent,
      style: { ...(block.style as Record<string, any> ?? {}), ...(style ?? {}) },
    };
    if (title !== undefined) update.title = title;
    if (position !== undefined) update.position = position;

    const { data, error } = await supabase
      .from("blocks")
      .update(update)
      .eq("id", block_id)
      .select("id, type, page_id, position, title, content, style")
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify({ block: data }, null, 2) }],
      structuredContent: { block: data },
    };
  },
});
