import { auth, defineMcp } from "@lovable.dev/mcp-js";
import createBlock from "./tools/create-block";
import createPage from "./tools/create-page";
import getAnalyticsSummary from "./tools/get-analytics-summary";
import getPageStructure from "./tools/get-page-structure";
import listMyLeads from "./tools/list-my-leads";
import listMyPages from "./tools/list-my-pages";
import updateBlock from "./tools/update-block";
import updatePage from "./tools/update-page";

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
  version: "0.2.0",
  instructions:
    "Tools for LinkMAX — a link-in-bio and micro-business OS. Browse pages and leads, inspect page analytics and block structure, create pages and blocks, and update page or block settings. All tools operate only on the signed-in user's own data.",
  auth: auth.oauth.issuer({
    issuer: supabaseIssuer,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listMyPages,
    listMyLeads,
    getAnalyticsSummary,
    createPage,
    getPageStructure,
    createBlock,
    updateBlock,
    updatePage,
  ],
});
