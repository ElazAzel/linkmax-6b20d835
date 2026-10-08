import { createFileRoute } from "@tanstack/react-router";
import AdminTemplateEditor from "@/pages/AdminTemplateEditor";

export const Route = createFileRoute("/admin/templates/new")({
  ssr: false,
  component: AdminTemplateEditor,
});
