import { buildUtilityHead } from '@/lib/seo/content-head';
import { createFileRoute } from "@tanstack/react-router";
import ReferralRedirect from "@/pages/ReferralRedirect";

export const Route = createFileRoute("/r/$code")({
  head: ({ match }) => buildUtilityHead(match, 'referral.title', 'referral.bothGetBonus'),
  component: ReferralRedirect,
});
