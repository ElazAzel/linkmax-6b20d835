import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";
import i18n from "@/i18n/config";
import { buildLandingHead } from "@/lib/seo/landing-head";
import { requestLanguage } from '@/lib/seo/site-policy';

export const Route = createFileRoute("/")({
  head: ({ match }) => buildLandingHead(typeof window === 'undefined'
    ? requestLanguage('/', new URLSearchParams(match.search as Record<string, string>).toString()) : i18n.language),
  component: Index,
});
