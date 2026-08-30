import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import {
  databaseError,
  getAuthenticatedContext,
  getMetadataPageId,
  isToolError,
  jsonResult,
} from "../utils";

export default defineTool({
  name: "list_my_leads",
  title: "List my LinkMAX leads",
  description:
    "List recent leads captured by the signed-in LinkMAX user's pages. Returns contact fields and source page.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional().describe("Max leads to return. Default 50."),
    page_id: z
      .string()
      .uuid()
      .optional()
      .describe("Optional page UUID stored in lead metadata to filter leads by page."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, page_id }, ctx) => {
    const authContext = getAuthenticatedContext(ctx);
    if (isToolError(authContext)) return authContext;

    const { supabase, userId } = authContext;
    let query = supabase
      .from("leads")
      .select("id, name, email, phone, source, status, notes, metadata, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (page_id) query = query.contains("metadata", { page_id });

    const { data, error } = await query.limit(limit ?? 50);
    if (error) {
      return databaseError("list_my_leads");
    }

    const leads = (data ?? [])
      .map((lead) => ({ ...lead, page_id: getMetadataPageId(lead.metadata) ?? null }));

    return jsonResult({ leads });
  },
});
