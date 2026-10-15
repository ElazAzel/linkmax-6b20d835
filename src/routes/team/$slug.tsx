import { createFileRoute } from "@tanstack/react-router";
import TeamPage from "@/pages/TeamPage";

export const Route = createFileRoute("/team/$slug")({
  component: TeamPage,
});
