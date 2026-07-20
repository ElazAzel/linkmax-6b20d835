import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyPages from "./tools/list-my-pages";
import listMyLeads from "./tools/list-my-leads";
import getAnalyticsSummary from "./tools/get-analytics-summary";
import createPage from "./tools/create-page";
import getPageStructure from "./tools/get-page-structure";

// OAuth issuer MUST be the direct Supabase host, built from the project ref.
// import.meta.env.VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time so
// this stays import-safe (no runtime env read at module top level).
const projectRef =
  (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "linkmax-mcp",
  title: "LinkMAX MCP",
  version: "0.1.0",
  instructions:
    "Tools for LinkMAX — a link-in-bio and micro-business OS. Use `list_my_pages` to browse the user's published pages, `list_my_leads` to read captured leads, and `get_analytics_summary` for a quick performance overview. All tools operate on the signed-in user's own data.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMyPages, listMyLeads, getAnalyticsSummary],
});
