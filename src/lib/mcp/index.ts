import { auth, defineMcp } from "@lovable.dev/mcp-js";
import applyTranslations from "./tools/apply-translations";
import auditPage from "./tools/audit-page";
import createPage from "./tools/create-page";
import editPage from "./tools/edit-page";
import getAnalyticsSummary from "./tools/get-analytics-summary";
import getBlockCatalog from "./tools/get-block-catalog";
import getPage from "./tools/get-page";
import getPageAnalytics from "./tools/get-page-analytics";
import getTranslationGaps from "./tools/get-translation-gaps";
import listMyLeads from "./tools/list-my-leads";
import listMyPages from "./tools/list-my-pages";
import publishPage from "./tools/publish-page";

// Vite inlines these values into the generated Supabase function. Prefer the
// full URL when present, while retaining project-id compatibility with older
// LinkMAX deployments. No runtime environment access happens at module load.
const env = (import.meta as unknown as { env?: {
  VITE_SUPABASE_PROJECT_ID?: string;
  VITE_SUPABASE_URL?: string;
} }).env;
const supabaseUrl = env?.VITE_SUPABASE_URL?.replace(/\/+$/, "");
const projectRef = env?.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";
const supabaseIssuer = supabaseUrl
  ? `${supabaseUrl}/auth/v1`
  : `https://${projectRef}.supabase.co/auth/v1`;

export default defineMcp({
  name: "linkmax-mcp",
  title: "LinkMAX MCP",
  version: "0.3.0",
  instructions: [
    "Tools for LinkMAX, a link-in-bio page builder. All tools operate only on the signed-in user's own data.",
    "Workflow: list_my_pages or create_page -> get_block_catalog -> get_page -> edit_page (batch edits to a private draft) -> audit_page -> publish_page.",
    "Edits land in the same draft the owner sees in the LinkMAX editor; nothing is live until publish_page, so ask the owner before publishing.",
    "Translations: get_translation_gaps lists missing texts, you translate them, apply_translations stores them.",
    "Analytics: get_analytics_summary for all pages, get_page_analytics for one page, audit_page for strengths and weaknesses with fixes.",
    "Never invent reviews, prices or contacts; use only what the owner gave you.",
  ].join(" "),
  auth: auth.oauth.issuer({
    issuer: supabaseIssuer,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listMyPages,
    createPage,
    getBlockCatalog,
    getPage,
    editPage,
    publishPage,
    getTranslationGaps,
    applyTranslations,
    getAnalyticsSummary,
    getPageAnalytics,
    auditPage,
    listMyLeads,
  ],
});
