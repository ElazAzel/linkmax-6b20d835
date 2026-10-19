import { describe, expect, it } from "vitest";
import mcp from "./index";
import { MCP_LANGUAGES } from "./languages";
import { MCP_RESERVED_SLUGS } from "./reserved-slugs";
import { SUPPORTED_LANGUAGES } from "@/i18n/config";
import { RESERVED_SLUGS } from "@/lib/routing/reserved-slugs";

describe("LinkMAX MCP contract", () => {
  it("exposes the page-builder, translation and analytics tools", () => {
    expect(mcp.tools.map((tool) => tool.name)).toEqual([
      "list_my_pages",
      "create_page",
      "get_block_catalog",
      "get_page",
      "edit_page",
      "publish_page",
      "get_translation_gaps",
      "apply_translations",
      "get_analytics_summary",
      "get_page_analytics",
      "audit_page",
      "list_my_leads",
    ]);
  });

  it("keeps all tools authenticated and schema-backed", () => {
    expect(mcp.auth?.type).toBe("oauth");
    expect(mcp.instructions).toContain("signed-in user's own data");
    for (const tool of mcp.tools) {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.handler).toBeTypeOf("function");
    }
  });

  it("marks only read tools as read-only", () => {
    const readOnly = mcp.tools.filter((t) => t.annotations?.readOnlyHint).map((t) => t.name).sort();
    expect(readOnly).toEqual(["audit_page", "get_analytics_summary", "get_block_catalog", "get_page", "get_page_analytics", "get_translation_gaps", "list_my_leads", "list_my_pages"]);
  });

  it("stays in sync with the app's languages and reserved slugs", () => {
    expect([...MCP_LANGUAGES]).toEqual([...SUPPORTED_LANGUAGES]);
    expect([...MCP_RESERVED_SLUGS].sort()).toEqual([...RESERVED_SLUGS].sort());
  });
});
