import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type ToolContext, type ToolHandlerResult } from "@lovable.dev/mcp-js";

type AuthenticatedToolContext = {
  supabase: SupabaseClient;
  userId: string;
};

type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  const value = runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Supabase Edge Functions on new API keys expose a JSON dictionary instead of
 * a single publishable key value.
 */
function publishableKeyFromKeyset(): string | undefined {
  const keyset = runtimeEnv("SUPABASE_PUBLISHABLE_KEYS");
  if (!keyset) return undefined;
  try {
    const parsed: unknown = JSON.parse(keyset);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const keys = parsed as Record<string, unknown>;
    return [keys.default, ...Object.values(keys)]
      .find((v): v is string => typeof v === "string" && v.trim().startsWith("sb_publishable_"))
      ?.trim();
  } catch {
    return undefined;
  }
}

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

  const supabaseUrl = runtimeEnv("SUPABASE_URL") ?? runtimeEnv("VITE_SUPABASE_URL");
  const supabaseKey =
    runtimeEnv("SUPABASE_ANON_KEY") ??
    runtimeEnv("SUPABASE_PUBLISHABLE_KEY") ??
    publishableKeyFromKeyset() ??
    runtimeEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

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
