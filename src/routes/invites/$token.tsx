import { createFileRoute } from "@tanstack/react-router";
import AcceptInvite from "@/pages/AcceptInvite";

export const Route = createFileRoute("/invites/$token")({
  component: AcceptInvite,
});
