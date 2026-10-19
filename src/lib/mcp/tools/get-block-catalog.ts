import { defineTool } from "@lovable.dev/mcp-js";
import { BLOCK_CATALOG, BLOCK_SIZES } from "../block-catalog";
import { MCP_LANGUAGES } from "../languages";
import { jsonResult } from "../utils";

export default defineTool({
  name: "get_block_catalog",
  title: "Get the block catalog",
  description:
    "List the block types an agent can add to a LinkMAX page, with required fields, field formats, translatable text paths and a minimal example for each. Read this before filling a page with edit_page.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () =>
    jsonResult({
      grid: "Pages are a 2-column grid. size: small = half width, wide = full width, tall = half width double height, large = full width double height.",
      sizes: BLOCK_SIZES,
      languages: MCP_LANGUAGES,
      text_values: "Any text field takes a plain string or an object like {\"ru\": \"…\", \"en\": \"…\", \"kk\": \"…\"}.",
      rules: [
        "Exactly one profile block, always first; publishing requires it.",
        "Put one clear contact action (messenger or button to WhatsApp/Telegram) in the first three blocks.",
        "Use only facts, prices, reviews and links the owner gave you; never invent reviews or numbers.",
        "Image fields need public https URLs; LinkMAX MCP cannot upload files.",
      ],
      blocks: BLOCK_CATALOG,
    }),
});
