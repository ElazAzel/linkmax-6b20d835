import { buildLandingHead } from '@/lib/seo/landing-head';
import { requestLanguage } from '@/lib/seo/site-policy';
import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";

export const Route = createFileRoute("/index")({
  head: ({ match }) => buildLandingHead(requestLanguage(match.pathname, new URLSearchParams(match.search as Record<string, string>).toString())),
  component: Index,
});
