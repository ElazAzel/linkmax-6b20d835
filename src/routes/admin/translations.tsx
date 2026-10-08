import { createFileRoute } from "@tanstack/react-router";
import AdminTranslations from "@/pages/AdminTranslations";

export const Route = createFileRoute("/admin/translations")({
  component: AdminTranslations,
});
