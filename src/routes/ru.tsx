import { createFileRoute } from "@tanstack/react-router";
import LocaleIndex from "@/components/routing/LocaleIndex";

export const Route = createFileRoute("/ru")({
  component: LocaleIndex,
});
