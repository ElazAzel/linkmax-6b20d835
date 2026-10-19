import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { MCP_LANGUAGES } from "../languages";
import { isPageContext, openPage } from "../page-context";
import { findTranslationGaps } from "../translations";
import { jsonResult } from "../utils";

const language = z.enum(MCP_LANGUAGES);

export default defineTool({
  name: "get_translation_gaps",
  title: "Find untranslated texts",
  description:
    "List every visitor-facing text on a page draft that is missing in the target languages, with its block id, path and source text. Translate them yourself, then save with apply_translations. Keep names, prices and links unchanged.",
  inputSchema: {
    page_id: z.string().uuid(),
    languages: z.array(language).min(1).max(15).describe("Target languages, e.g. [\"en\", \"kk\"]."),
    source_language: language.optional().describe("Language the page is written in. Default ru."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ page_id, languages, source_language }, ctx) => {
    const opened = await openPage(ctx, page_id);
    if (!isPageContext(opened)) return opened;
    const source = source_language ?? "ru";
    const gaps = findTranslationGaps(opened.draft.snapshot, languages, source);
    return jsonResult({
      source_language: source,
      languages,
      missing_texts: gaps.reduce((sum, g) => sum + g.missing.length, 0),
      gaps: gaps.slice(0, 300),
      truncated: gaps.length > 300,
    });
  },
});
