import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { databaseError, getAuthenticatedContext, isToolError, jsonResult, toolError } from "../utils";

const jsonObject = z.record(z.string(), z.unknown());

export default defineTool({
  name: "update_page",
  title: "Update LinkMAX page settings",
  description:
    "Update the settings of one of the signed-in user's pages. Only explicitly supplied allowlisted fields are changed; ownership is checked before the update.",
  inputSchema: {
    page_id: z.string().uuid().describe("Page UUID owned by the signed-in user."),
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    avatar_url: z.string().url().max(2048).nullable().optional(),
    avatar_style: jsonObject.nullable().optional(),
    theme_settings: jsonObject.nullable().optional(),
    seo_meta: jsonObject.nullable().optional(),
    is_published: z.boolean().optional(),
    niche: z.string().trim().max(120).nullable().optional(),
    entity_type: z.string().trim().max(80).nullable().optional(),
    contact_email: z.string().email().max(320).nullable().optional(),
    contact_phone: z.string().trim().max(40).nullable().optional(),
    contact_whatsapp: z.string().trim().max(40).nullable().optional(),
    editor_mode: z.string().trim().max(40).optional(),
    grid_config: jsonObject.nullable().optional(),
    integrations: jsonObject.nullable().optional(),
    custom_domain: z.string().trim().max(253).nullable().optional(),
    page_type: z.string().trim().max(40).optional(),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ page_id, ...fields }, ctx) => {
    const authContext = getAuthenticatedContext(ctx);
    if (isToolError(authContext)) return authContext;

    const { supabase, userId } = authContext;
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select("id")
      .eq("id", page_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (pageError) return databaseError("update_page.lookup");
    if (!page) return toolError("not_found", "Page not found for this user.");

    const updates = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(updates).length === 0) {
      return toolError("invalid_input", "Provide at least one page field to update.");
    }

    const { data: updatedPage, error } = await supabase
      .from("pages")
      .update(updates)
      .eq("id", page_id)
      .eq("user_id", userId)
      .select(
        "id, slug, title, description, avatar_url, avatar_style, theme_settings, seo_meta, is_published, niche, entity_type, contact_email, contact_phone, contact_whatsapp, editor_mode, grid_config, integrations, custom_domain, page_type, updated_at",
      )
      .single();
    if (error) return databaseError("update_page");

    return jsonResult({ page: updatedPage });
  },
});
