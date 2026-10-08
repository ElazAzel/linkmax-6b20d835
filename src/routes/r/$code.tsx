import { createFileRoute } from "@tanstack/react-router";
import ReferralRedirect from "@/pages/ReferralRedirect";

export const Route = createFileRoute("/r/$code")({
  component: ReferralRedirect,
});
