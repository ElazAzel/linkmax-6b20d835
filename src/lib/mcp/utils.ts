import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type ToolContext, type ToolHandlerResult } from "@lovable.dev/mcp-js";

export type AuthenticatedToolContext = {
  supabase: SupabaseClient;
  userId: string;
};

/**
 * MCP runs inside a Supabase Edge Function, where SUPABASE_ANON_KEY is the
 * platform-provided name. The publishable-key fallbacks keep the same source
 * usable in local Node/Vite builds as well.
 */
export function getAuthenticatedContext(
  ctx: ToolContext,
): AuthenticatedToolContext | ToolHandlerResult {
  const userId = ctx.getUserId();
  if (!ctx.isAuthenticated() || !userId) {
    return toolError("not_authenticated", "Sign in to LinkMAX before using this tool.");
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return toolError("configuration_error", "LinkMAX data access is not configured.");
  }

  try {
    return {
      userId,
      supabase: createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    };
  } catch (error) {
    console.error("LinkMAX MCP Supabase client initialization failed", {
      error: error instanceof Error ? error.name : "unknown_error",
    });
    return toolError("configuration_error", "LinkMAX data access is not configured.");
  }
}

export function toolError(code: string, message: string): ToolHandlerResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: code, message }) }],
    structuredContent: { error: code, message },
    isError: true,
  };
}

export function databaseError(operation: string): ToolHandlerResult {
  console.error(`LinkMAX MCP database operation failed: ${operation}`);
  return toolError("database_error", "LinkMAX could not complete the data request.");
}

export function jsonResult(value: Record<string, unknown>): ToolHandlerResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

export function getMetadataString(
  metadata: unknown,
  ...keys: string[]
): string | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
  const record = metadata as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

export function getMetadataPageId(metadata: unknown): string | undefined {
  return getMetadataString(metadata, "page_id", "pageId");
}

export function isToolError(
  value: AuthenticatedToolContext | ToolHandlerResult,
): value is ToolHandlerResult {
  return "isError" in value;
}
