import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { databaseError, getAuthenticatedContext, isToolError, jsonResult, toolError } from "../utils";

export default defineTool({
  name: "update_block",
  title: "Update a LinkMAX block",
  description:
    "Update the content, appearance, type or position of a block that belongs to one of the signed-in user's pages.",
  inputSchema: {
    block_id: z.string().uuid().describe("Block UUID."),
    type: z.string().trim().min(1).max(64).optional(),
    title: z.string().trim().max(200).nullable().optional(),
    content: z.unknown().optional(),
    style: z.record(z.string(), z.unknown()).nullable().optional(),
    position: z.number().int().min(0).max(10000).optional(),
    is_premium: z.boolean().optional(),
    schedule: z.unknown().nullable().optional(),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ block_id, type, title, content, style, position, is_premium, schedule }, ctx) => {
    const authContext = getAuthenticatedContext(ctx);
    if (isToolError(authContext)) return authContext;

    const { supabase, userId } = authContext;
    const { data: block, error: blockError } = await supabase
      .from("blocks")
      .select("id, page_id")
      .eq("id", block_id)
      .maybeSingle();
    if (blockError) return databaseError("update_block.lookup");
    if (!block) return toolError("not_found", "Block not found.");

    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select("id")
      .eq("id", block.page_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (pageError) return databaseError("update_block.authorization");
    if (!page) return toolError("not_found", "Block not found for this user.");

    const updates: Record<string, unknown> = {};
    if (type !== undefined) updates.type = type;
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (style !== undefined) updates.style = style;
    if (position !== undefined) updates.position = position;
    if (is_premium !== undefined) updates.is_premium = is_premium;
    if (schedule !== undefined) updates.schedule = schedule;
    if (Object.keys(updates).length === 0) {
      return toolError("invalid_input", "Provide at least one block field to update.");
    }

    const { data: updatedBlock, error } = await supabase
      .from("blocks")
      .update(updates)
      .eq("id", block_id)
      .select("id, page_id, type, position, title, content, style, is_premium, click_count, schedule")
      .single();
    if (error) return databaseError("update_block");

    return jsonResult({ block: updatedBlock });
  },
});
