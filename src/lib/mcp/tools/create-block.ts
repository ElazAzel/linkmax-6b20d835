import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { databaseError, getAuthenticatedContext, isToolError, jsonResult, toolError } from "../utils";

export default defineTool({
  name: "create_block",
  title: "Create a LinkMAX block",
  description:
    "Create a block on one of the signed-in user's pages. The block is inserted at the requested position or appended to the end when position is omitted.",
  inputSchema: {
    page_id: z.string().uuid().describe("Page UUID owned by the signed-in user."),
    type: z.string().trim().min(1).max(64).describe("LinkMAX block type, for example link, text, image or form."),
    title: z.string().trim().max(200).optional().describe("Optional block title."),
    content: z.unknown().optional().describe("JSON content for the block."),
    style: z.record(z.string(), z.unknown()).optional().describe("Optional JSON style configuration."),
    position: z.number().int().min(0).max(10000).optional().describe("Zero-based position. Defaults to the end."),
    is_premium: z.boolean().optional().describe("Whether the block is marked premium."),
    schedule: z.unknown().optional().describe("Optional JSON publication schedule."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ page_id, type, title, content, style, position, is_premium, schedule }, ctx) => {
    const authContext = getAuthenticatedContext(ctx);
    if (isToolError(authContext)) return authContext;

    const { supabase, userId } = authContext;
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select("id")
      .eq("id", page_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (pageError) return databaseError("create_block.page");
    if (!page) return toolError("not_found", "Page not found for this user.");

    let nextPosition = position;
    if (nextPosition === undefined) {
      const { data: lastBlock, error: positionError } = await supabase
        .from("blocks")
        .select("position")
        .eq("page_id", page_id)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (positionError) return databaseError("create_block.position");
      nextPosition = (lastBlock?.position ?? -1) + 1;
    }

    const { data: block, error } = await supabase
      .from("blocks")
      .insert({
        page_id,
        type,
        title: title ?? null,
        content: content ?? {},
        style: style ?? null,
        position: nextPosition,
        is_premium: is_premium ?? false,
        schedule: schedule ?? null,
      })
      .select("id, page_id, type, position, title, content, style, is_premium, click_count, schedule")
      .single();

    if (error) return databaseError("create_block");
    return jsonResult({ block });
  },
});
