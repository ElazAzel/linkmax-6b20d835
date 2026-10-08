import { createFileRoute } from "@tanstack/react-router";
import JoinTeam from "@/pages/JoinTeam";

export const Route = createFileRoute("/join/$inviteCode")({
  component: JoinTeam,
});
