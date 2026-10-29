import { buildMarketingHead } from '@/lib/seo/marketing-metadata';
import { createFileRoute } from "@tanstack/react-router";
import PaymentTerms from "@/pages/PaymentTerms";

export const Route = createFileRoute("/payment-terms")({
  head: ({ match }) => buildMarketingHead(match),
  component: PaymentTerms,
});
