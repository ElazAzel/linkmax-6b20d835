import { createFileRoute } from "@tanstack/react-router";
import PaymentTerms from "@/pages/PaymentTerms";

export const Route = createFileRoute("/payment-terms")({
  component: PaymentTerms,
});
