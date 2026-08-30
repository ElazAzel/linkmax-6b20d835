import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import {
  databaseError,
  getAuthenticatedContext,
  isToolError,
  jsonResult,
} from "../utils";

export default defineTool({
  name: "list_my_pages",
  title: "List my LinkMAX pages",
  description:
    "List all link-in-bio pages that belong to the signed-in LinkMAX user. Returns slug, title, publish status, view count and update time.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of pages to return. Defaults to 50."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    const authContext = getAuthenticatedContext(ctx);
    if (isToolError(authContext)) return authContext;

    const { supabase, userId } = authContext;
    const { data, error } = await supabase
      .from("pages")
      .select("id, slug, title, is_published, view_count, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit ?? 50);

    if (error) {
      return databaseError("list_my_pages");
    }
    return jsonResult({ pages: data ?? [] });
  },
});
