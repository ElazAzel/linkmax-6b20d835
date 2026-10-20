import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { isDraft, saveDraft } from "../draft";
import { MCP_LANGUAGES } from "../languages";
import { isPageContext, openPage } from "../page-context";
import { applyTranslations } from "../translations";
import { jsonResult, toolError } from "../utils";

const language = z.enum(MCP_LANGUAGES);

export default defineTool({
  name: "apply_translations",
  title: "Save translations",
  description:
    "Write translated texts into a page draft. Each entry names a block id and path from get_translation_gaps, the language and the translated text. Existing languages are kept; plain texts become multilingual. Publish with publish_page.",
  inputSchema: {
    page_id: z.string().uuid(),
    source_language: language.optional().describe("Language of the existing plain texts. Default ru."),
    translations: z
      .array(z.object({
        block_id: z.string(),
        path: z.string().max(200),
        language,
        text: z.string().min(1).max(4000),
      }))
      .min(1)
      .max(400),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ page_id, source_language, translations }, ctx) => {
    const opened = await openPage(ctx, page_id);
    if (!isPageContext(opened)) return opened;
    const result = applyTranslations(opened.draft.snapshot, translations, source_language ?? "ru");
    if (result.applied === 0) {
      return toolError("nothing_applied", `No translation matched the draft: ${result.rejected.slice(0, 3).map((r) => r.reason).join("; ")}`);
    }
    const saved = await saveDraft(opened.supabase, opened.draft, result.snapshot);
    if (!isDraft(saved)) return saved;
    return jsonResult({ saved: true, published: false, applied: result.applied, rejected: result.rejected, draft_revision: saved.revision });
  },
});
