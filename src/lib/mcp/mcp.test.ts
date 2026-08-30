import { describe, expect, it } from "vitest";
import mcp from "./index";

describe("LinkMAX MCP contract", () => {
  it("exposes the complete page-builder tool surface", () => {
    expect(mcp.tools.map((tool) => tool.name)).toEqual([
      "list_my_pages",
      "list_my_leads",
      "get_analytics_summary",
      "create_page",
      "get_page_structure",
      "create_block",
      "update_block",
      "update_page",
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
});
